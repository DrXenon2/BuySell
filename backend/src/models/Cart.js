const database = require('../config/database');
const logger = require('../utils/logger');

/**
 * Modèle Cart pour la gestion des paniers
 */
class Cart {
  constructor() {
    this.table = 'carts';
  }

  // Obtenir ou créer un panier
  async getOrCreate(userId) {
    // Chercher un panier existant
    const { data: existingCart, error: findError } = await supabase
      .from(this.table)
      .select(`
        *,
        items:cart_items(
          *,
          product:products(
            id,
            name,
            slug,
            price,
            compare_price,
            images,
            quantity as stock_quantity,
            is_published
          )
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      throw findError;
    }

    // Retourner le panier existant
    if (existingCart) {
      return existingCart;
    }

    // Créer un nouveau panier
    const { data: newCart, error: createError } = await supabase
      .from(this.table)
      .insert({
        user_id: userId,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      })
      .select(`
        *,
        items:cart_items(
          *,
          product:products(
            id,
            name,
            slug,
            price,
            compare_price,
            images,
            quantity as stock_quantity,
            is_published
          )
        )
      `)
      .single();

    if (createError) throw createError;
    return newCart;
  }

  // Obtenir le panier
  async findByUserId(userId) {
    const { data, error } = await supabase
      .from(this.table)
      .select(`
        *,
        items:cart_items(
          *,
          product:products(
            id,
            name,
            slug,
            price,
            compare_price,
            images,
            quantity as stock_quantity,
            is_published
          )
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Ajouter un article au panier
  async addItem(userId, itemData) {
    const cart = await this.getOrCreate(userId);

    // Vérifier si l'article existe déjà
    const { data: existingItem, error: findError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cart.id)
      .eq('product_id', itemData.product_id)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      throw findError;
    }

    let result;

    if (existingItem) {
      // Mettre à jour la quantité
      const newQuantity = existingItem.quantity + (itemData.quantity || 1);
      result = await this.updateItem(cart.id, existingItem.id, { quantity: newQuantity });
    } else {
      // Ajouter un nouvel article
      const { data, error } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cart.id,
          ...itemData,
          created_at: new Date(),
          updated_at: new Date()
        })
        .select(`
          *,
          product:products(
            id,
            name,
            slug,
            price,
            compare_price,
            images,
            quantity as stock_quantity,
            is_published
          )
        `)
        .single();

      if (error) throw error;
      result = data;
    }

    // Mettre à jour la date de modification du panier
    await this.update(cart.id, { updated_at: new Date() });

    return result;
  }

  // Mettre à jour un article du panier
  async updateItem(cartId, itemId, updates) {
    const { data, error } = await supabase
      .from('cart_items')
      .update({
        ...updates,
        updated_at: new Date()
      })
      .eq('id', itemId)
      .eq('cart_id', cartId)
      .select(`
        *,
        product:products(
          id,
          name,
          slug,
          price,
          compare_price,
          images,
          quantity as stock_quantity,
          is_published
        )
      `)
      .single();

    if (error) throw error;

    // Mettre à jour la date de modification du panier
    await this.update(cartId, { updated_at: new Date() });

    return data;
  }

  // Supprimer un article du panier
  async removeItem(cartId, itemId) {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId)
      .eq('cart_id', cartId);

    if (error) throw error;

    // Mettre à jour la date de modification du panier
    await this.update(cartId, { updated_at: new Date() });

    return true;
  }

  // Vider le panier
  async clear(cartId) {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cartId);

    if (error) throw error;

    // Mettre à jour la date de modification du panier
    await this.update(cartId, { 
      updated_at: new Date(),
      coupon_code: null,
      discount_amount: 0
    });

    return true;
  }

  // Mettre à jour le panier
  async update(cartId, updates) {
    const { data, error } = await supabase
      .from(this.table)
      .update({
        ...updates,
        updated_at: new Date()
      })
      .eq('id', cartId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Appliquer un coupon
  async applyCoupon(cartId, couponCode) {
    // Vérifier la validité du coupon (implémentation simplifiée)
    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.toUpperCase())
      .eq('is_active', true)
      .gte('valid_from', new Date().toISOString())
      .lte('valid_to', new Date().toISOString())
      .single();

    if (couponError || !coupon) {
      throw new Error('Coupon invalide ou expiré');
    }

    // Calculer le montant de la réduction
    const cart = await this.findById(cartId);
    const discountAmount = this.calculateDiscount(cart.total_amount, coupon);

    // Mettre à jour le panier
    const { data, error } = await supabase
      .from(this.table)
      .update({
        coupon_code: couponCode,
        discount_amount: discountAmount,
        updated_at: new Date()
      })
      .eq('id', cartId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Supprimer le coupon
  async removeCoupon(cartId) {
    const { data, error } = await supabase
      .from(this.table)
      .update({
        coupon_code: null,
        discount_amount: 0,
        updated_at: new Date()
      })
      .eq('id', cartId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Calculer le total du panier
  async calculateTotal(cartId) {
    const { data: items, error } = await supabase
      .from('cart_items')
      .select('unit_price, quantity, discount')
      .eq('cart_id', cartId);

    if (error) throw error;

    const subtotal = items.reduce((sum, item) => {
      const itemTotal = (item.unit_price * item.quantity) - (item.discount || 0);
      return sum + itemTotal;
    }, 0);

    // Mettre à jour le total dans la base de données
    const { data: cart } = await supabase
      .from(this.table)
      .update({
        subtotal_amount: subtotal,
        total_amount: subtotal - (cart.discount_amount || 0),
        updated_at: new Date()
      })
      .eq('id', cartId)
      .select()
      .single();

    return cart;
  }

  // Calculer la réduction
  calculateDiscount(subtotal, coupon) {
    if (coupon.discount_type === 'percentage') {
      return (subtotal * coupon.discount_value) / 100;
    } else if (coupon.discount_type === 'fixed') {
      return Math.min(coupon.discount_value, subtotal);
    }
    return 0;
  }

  // Convertir le panier en commande
  async convertToOrder(cartId, orderData) {
    const cart = await this.findById(cartId);
    
    if (!cart || cart.items.length === 0) {
      throw new Error('Le panier est vide');
    }

    // Créer la commande
    const orderModel = require('./Order');
    const order = await orderModel.create({
      ...orderData,
      customer_id: cart.user_id,
      subtotal_amount: cart.subtotal_amount,
      discount_amount: cart.discount_amount,
      total_amount: cart.total_amount
    });

    // Créer les éléments de commande
    const orderItemModel = require('./OrderItem');
    await orderItemModel.createMultiple(order.id, cart.items.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.unit_price * item.quantity
    })));

    // Désactiver le panier
    await supabase
      .from(this.table)
      .update({ is_active: false })
      .eq('id', cartId);

    return order;
  }
}

module.exports = new Cart();
