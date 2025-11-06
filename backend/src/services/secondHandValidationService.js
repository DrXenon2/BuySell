/**
 * Service backend de validation des produits de seconde main
 * Vérification qualité, prix, éligibilité et modération
 */

const { supabaseService } = require('./supabaseService');
const { logger } = require('../utils/logger');
const { AppError } = require('../utils/errors');

class SecondHandValidationService {
  constructor() {
    this.supabase = supabaseService;
    
    // Configuration des conditions
    this.conditions = {
      EXCELLENT: { 
        value: 'excellent', 
        label: 'Excellent état', 
        discount: 0.1,
        minPriceMultiplier: 0.7,
        description: 'Comme neuf, très peu utilisé'
      },
      VERY_GOOD: { 
        value: 'very_good', 
        label: 'Très bon état', 
        discount: 0.2,
        minPriceMultiplier: 0.6,
        description: 'Légères traces d\'utilisation'
      },
      GOOD: { 
        value: 'good', 
        label: 'Bon état', 
        discount: 0.3,
        minPriceMultiplier: 0.5,
        description: 'Signes d\'utilisation visibles mais fonctionnel'
      },
      FAIR: { 
        value: 'fair', 
        label: 'État correct', 
        discount: 0.4,
        minPriceMultiplier: 0.4,
        description: 'Usure notable mais parfaitement fonctionnel'
      },
      POOR: { 
        value: 'poor', 
        label: 'État moyen', 
        discount: 0.5,
        minPriceMultiplier: 0.3,
        description: 'Fortement usé, nécessite peut-être des réparations'
      }
    };

    // Règles de modération
    this.moderationRules = {
      MIN_PRICE: 1000, // Prix minimum en XOF
      MAX_AGE_MONTHS: 60, // Âge maximum en mois
      BANNED_CATEGORIES: ['weapons', 'drugs', 'counterfeit'],
      REQUIRED_FIELDS: ['title', 'description', 'condition', 'original_price', 'images'],
      PRICE_VARIATION_THRESHOLD: 0.5 // 50% de variation max par rapport au prix recommandé
    };
  }

  /**
   * Valider une nouvelle annonce de seconde main
   */
  async validateListing(listingData, sellerId) {
    try {
      const validationResults = {
        isValid: true,
        errors: [],
        warnings: [],
        recommendations: [],
        approved: false,
        requiresModeration: false,
        calculatedPrice: 0
      };

      // 1. Validation des champs requis
      const fieldValidation = this.validateRequiredFields(listingData);
      if (!fieldValidation.isValid) {
        validationResults.errors.push(...fieldValidation.errors);
        validationResults.isValid = false;
      }

      // 2. Validation du prix
      const priceValidation = await this.validatePrice(listingData);
      if (!priceValidation.isValid) {
        validationResults.errors.push(...priceValidation.errors);
        validationResults.isValid = false;
      } else {
        validationResults.calculatedPrice = priceValidation.recommendedPrice;
        validationResults.warnings.push(...priceValidation.warnings);
      }

      // 3. Validation des images
      const imageValidation = await this.validateImages(listingData.images);
      if (!imageValidation.isValid) {
        validationResults.errors.push(...imageValidation.errors);
        validationResults.isValid = false;
      }

      // 4. Validation du vendeur
      const sellerValidation = await this.validateSeller(sellerId);
      if (!sellerValidation.isValid) {
        validationResults.errors.push(...sellerValidation.errors);
        validationResults.isValid = false;
      }

      // 5. Validation de la catégorie
      const categoryValidation = await this.validateCategory(listingData.category_id);
      if (!categoryValidation.isValid) {
        validationResults.errors.push(...categoryValidation.errors);
        validationResults.isValid = false;
      }

      // 6. Vérification des doublons
      const duplicateCheck = await this.checkForDuplicates(listingData, sellerId);
      if (duplicateCheck.hasDuplicates) {
        validationResults.warnings.push(...duplicateCheck.warnings);
      }

      // 7. Analyse du contenu (détection de spam/mots interdits)
      const contentAnalysis = await this.analyzeContent(listingData);
      if (!contentAnalysis.isClean) {
        validationResults.requiresModeration = true;
        validationResults.warnings.push(...contentAnalysis.warnings);
      }

      // Déterminer si l'annonce est approuvée automatiquement
      if (validationResults.isValid && !validationResults.requiresModeration) {
        validationResults.approved = await this.canAutoApprove(sellerId, listingData);
      }

      // Enregistrer la validation
      await this.recordValidationResult({
        listingData,
        sellerId,
        validationResults,
        validatedAt: new Date().toISOString()
      });

      return validationResults;

    } catch (error) {
      logger.error('Erreur validation annonce:', error);
      throw new AppError(`Échec validation: ${error.message}`, 500);
    }
  }

  /**
   * Calculer le prix recommandé pour un produit de seconde main
   */
  async calculateRecommendedPrice(productData) {
    try {
      const { 
        original_price, 
        condition, 
        age_months = 0,
        category_id,
        brand,
        functionality_issues = []
      } = productData;

      // Prix de base basé sur la condition
      const conditionInfo = this.conditions[condition?.toUpperCase()] || this.conditions.GOOD;
      let recommendedPrice = original_price * (1 - conditionInfo.discount);

      // Ajustement pour l'âge
      const ageDiscount = Math.min(age_months * 0.02, 0.5); // Max 50% pour l'âge
      recommendedPrice *= (1 - ageDiscount);

      // Ajustement pour les problèmes fonctionnels
      const functionalityDiscount = functionality_issues.length * 0.1; // 10% par problème
      recommendedPrice *= (1 - functionalityDiscount);

      // Ajustement basé sur la catégorie et la marque
      const marketAdjustment = await this.getMarketAdjustment(category_id, brand);
      recommendedPrice *= marketAdjustment;

      // Prix minimum garanti
      const minPrice = original_price * conditionInfo.minPriceMultiplier;
      recommendedPrice = Math.max(recommendedPrice, minPrice);

      // Arrondir au multiple de 100 supérieur
      recommendedPrice = Math.ceil(recommendedPrice / 100) * 100;

      return {
        recommendedPrice: Math.round(recommendedPrice),
        originalPrice: original_price,
        conditionDiscount: conditionInfo.discount,
        ageDiscount,
        functionalityDiscount,
        marketAdjustment,
        minPrice,
        calculationDetails: {
          condition: conditionInfo.label,
          ageMonths: age_months,
          functionalityIssues: functionality_issues.length
        }
      };

    } catch (error) {
      logger.error('Erreur calcul prix recommandé:', error);
      throw error;
    }
  }

  /**
   * Modérer une annonce existante
   */
  async moderateListing(listingId, moderatorId, action, reason = '') {
    try {
      const listing = await this.getListing(listingId);
      
      if (!listing) {
        throw new AppError('Annonce non trouvée', 404);
      }

      let moderationResult;

      switch (action) {
        case 'approve':
          moderationResult = await this.approveListing(listingId, moderatorId, reason);
          break;

        case 'reject':
          moderationResult = await this.rejectListing(listingId, moderatorId, reason);
          break;

        case 'request_changes':
          moderationResult = await this.requestListingChanges(listingId, moderatorId, reason);
          break;

        default:
          throw new AppError('Action de modération invalide', 400);
      }

      // Notifier le vendeur
      await this.notifySeller(moderationResult, listing.seller_id);

      return moderationResult;

    } catch (error) {
      logger.error('Erreur modération annonce:', error);
      throw error;
    }
  }

  /**
   * Vérifier l'éligibilité d'un produit pour la revente
   */
  async checkProductEligibility(productDetails) {
    try {
      const {
        category,
        age_months,
        condition,
        original_price,
        brand,
        functionality,
        has_original_box,
        has_warranty
      } = productDetails;

      const eligibility = {
        eligible: true,
        reasons: [],
        warnings: [],
        recommendations: [],
        estimatedPrice: 0,
        requiresVerification: false
      };

      // Vérification d'âge
      if (age_months > this.moderationRules.MAX_AGE_MONTHS) {
        eligibility.eligible = false;
        eligibility.reasons.push('Produit trop ancien (plus de 5 ans)');
      }

      // Vérification du prix minimum
      if (original_price < this.moderationRules.MIN_PRICE) {
        eligibility.warnings.push('Le prix de vente pourrait être trop bas pour être intéressant');
      }

      // Vérification des catégories interdites
      if (this.moderationRules.BANNED_CATEGORIES.includes(category)) {
        eligibility.eligible = false;
        eligibility.reasons.push('Catégorie non autorisée pour la revente');
      }

      // Vérification de la fonctionnalité
      if (!functionality) {
        eligibility.eligible = false;
        eligibility.reasons.push('Produit non fonctionnel');
      }

      // Vérification condition critique
      if (condition === 'poor' && original_price < 5000) {
        eligibility.eligible = false;
        eligibility.reasons.push('Produit en trop mauvais état pour la revente');
      }

      // Calcul du prix estimé si éligible
      if (eligibility.eligible) {
        const priceCalculation = await this.calculateRecommendedPrice(productDetails);
        eligibility.estimatedPrice = priceCalculation.recommendedPrice;
        
        // Recommandations
        if (!has_original_box) {
          eligibility.recommendations.push('La présence de la boîte d\'origine augmenterait la valeur');
        }
        
        if (!has_warranty) {
          eligibility.recommendations.push('Un produit sans garantie se vend généralement moins cher');
        }

        // Vérification supplémentaire pour les produits de valeur
        if (original_price > 100000) {
          eligibility.requiresVerification = true;
          eligibility.recommendations.push('Vérification recommandée pour les produits de haute valeur');
        }
      }

      return eligibility;

    } catch (error) {
      logger.error('Erreur vérification éligibilité:', error);
      throw error;
    }
  }

  /**
   * Analyser les performances des annonces
   */
  async analyzeListingPerformance(listingId) {
    try {
      const listing = await this.getListingWithStats(listingId);
      
      if (!listing) {
        throw new AppError('Annonce non trouvée', 404);
      }

      const performance = {
        listingId,
        views: listing.view_count || 0,
        contacts: listing.contact_count || 0,
        favorites: listing.favorite_count || 0,
        daysListed: this.calculateDaysListed(listing.created_at),
        priceCompetitiveness: await this.analyzePriceCompetitiveness(listing),
        imageQuality: await this.analyzeImageQuality(listing.images),
        descriptionQuality: this.analyzeDescriptionQuality(listing.description),
        overallScore: 0
      };

      // Calcul du score global
      performance.overallScore = this.calculatePerformanceScore(performance);

      // Recommandations d'amélioration
      performance.recommendations = this.generateImprovementRecommendations(performance);

      return performance;

    } catch (error) {
      logger.error('Erreur analyse performance:', error);
      throw error;
    }
  }

  /**
   * Méthodes utilitaires privées
   */

  validateRequiredFields(listingData) {
    const results = { isValid: true, errors: [] };
    
    this.moderationRules.REQUIRED_FIELDS.forEach(field => {
      if (!listingData[field] || listingData[field].toString().trim() === '') {
        results.isValid = false;
        results.errors.push(`Le champ ${field} est requis`);
      }
    });

    // Validation spécifique des images
    if (!listingData.images || listingData.images.length === 0) {
      results.isValid = false;
      results.errors.push('Au moins une image est requise');
    } else if (listingData.images.length < 2) {
      results.warnings = ['Plusieurs images recommandées pour une meilleure visibilité'];
    }

    return results;
  }

  async validatePrice(listingData) {
    const results = { isValid: true, errors: [], warnings: [], recommendedPrice: 0 };
    
    const { original_price, selling_price, condition } = listingData;

    if (original_price < this.moderationRules.MIN_PRICE) {
      results.isValid = false;
      results.errors.push(`Le prix original doit être d'au moins ${this.moderationRules.MIN_PRICE} XOF`);
    }

    // Calcul du prix recommandé
    const priceCalculation = await this.calculateRecommendedPrice(listingData);
    results.recommendedPrice = priceCalculation.recommendedPrice;

    // Validation du prix de vente
    if (selling_price) {
      const priceVariation = Math.abs(selling_price - results.recommendedPrice) / results.recommendedPrice;
      
      if (priceVariation > this.moderationRules.PRICE_VARIATION_THRESHOLD) {
        results.warnings.push(`Le prix de vente semble ${selling_price > results.recommendedPrice ? 'trop élevé' : 'trop bas'} par rapport au marché`);
      }

      if (selling_price < this.moderationRules.MIN_PRICE) {
        results.isValid = false;
        results.errors.push(`Le prix de vente doit être d'au moins ${this.moderationRules.MIN_PRICE} XOF`);
      }
    }

    return results;
  }

  async validateImages(images) {
    const results = { isValid: true, errors: [] };
    
    if (!images || images.length === 0) {
      results.isValid = false;
      results.errors.push('Au moins une image est requise');
      return results;
    }

    // Vérification du nombre d'images
    if (images.length > 10) {
      results.errors.push('Maximum 10 images autorisées');
      results.isValid = false;
    }

    // Vérification de la qualité des images (taille, format, etc.)
    for (const image of images) {
      const imageValidation = await this.validateSingleImage(image);
      if (!imageValidation.isValid) {
        results.errors.push(...imageValidation.errors);
        results.isValid = false;
      }
    }

    return results;
  }

  async validateSeller(sellerId) {
    const results = { isValid: true, errors: [] };
    
    // Vérifier que le vendeur existe et est actif
    const seller = await this.getSeller(sellerId);
    
    if (!seller) {
      results.isValid = false;
      results.errors.push('Vendeur non trouvé');
      return results;
    }

    // Vérifier les restrictions du vendeur
    if (seller.is_suspended) {
      results.isValid = false;
      results.errors.push('Vendeur suspendu');
    }

    // Vérifier la limite d'annonces
    const activeListings = await this.getSellerActiveListings(sellerId);
    if (activeListings.length >= seller.listing_limit) {
      results.isValid = false;
      results.errors.push('Limite d\'annonces actives atteinte');
    }

    return results;
  }

  async validateCategory(categoryId) {
    const results = { isValid: true, errors: [] };
    
    const category = await this.getCategory(categoryId);
    
    if (!category) {
      results.isValid = false;
      results.errors.push('Catégorie non trouvée');
      return results;
    }

    if (!category.allow_second_hand) {
      results.isValid = false;
      results.errors.push('Catégorie non autorisée pour les produits de seconde main');
    }

    return results;
  }

  async validateSingleImage(image) {
    // Implémentation de validation d'image
    // Vérifier la taille, le format, le contenu, etc.
    return { isValid: true, errors: [] };
  }

  async checkForDuplicates(listingData, sellerId) {
    // Vérifier les doublons basés sur le titre, la description, les images
    return { hasDuplicates: false, warnings: [] };
  }

  async analyzeContent(listingData) {
    // Analyser le contenu pour détecter le spam, les mots interdits, etc.
    return { isClean: true, warnings: [] };
  }

  async canAutoApprove(sellerId, listingData) {
    // Déterminer si l'annonce peut être approuvée automatiquement
    // Basé sur la réputation du vendeur, la qualité de l'annonce, etc.
    const seller = await this.getSeller(sellerId);
    return seller.trust_level >= 3; // Exemple
  }

  async getMarketAdjustment(categoryId, brand) {
    // Obtenir les ajustements de prix basés sur le marché
    return 1.0; // Aucun ajustement par défaut
  }

  calculateDaysListed(createdAt) {
    const created = new Date(createdAt);
    const now = new Date();
    return Math.ceil((now - created) / (1000 * 60 * 60 * 24));
  }

  calculatePerformanceScore(performance) {
    // Calculer un score de performance basé sur plusieurs métriques
    let score = 0;
    
    // Points pour les vues
    score += Math.min(performance.views / 100, 10);
    
    // Points pour les contacts
    score += Math.min(performance.contacts * 5, 20);
    
    // Points pour la durée
    score += Math.min(performance.daysListed / 7, 10);
    
    return Math.min(score, 100);
  }

  generateImprovementRecommendations(performance) {
    const recommendations = [];
    
    if (performance.views < 50) {
      recommendations.push('Améliorez le titre et les images pour attirer plus de vues');
    }
    
    if (performance.contacts === 0 && performance.views > 20) {
      recommendations.push('Le prix pourrait être trop élevé, envisagez une réduction');
    }
    
    if (performance.imageQuality < 0.7) {
      recommendations.push('Ajoutez des images de meilleure qualité et sous différents angles');
    }
    
    return recommendations;
  }

  // Méthodes d'accès aux données (à adapter à votre schema)
  async getListing(listingId) {
    const { data, error } = await this.supabase
      .from('second_hand_listings')
      .select('*')
      .eq('id', listingId)
      .single();

    if (error) throw error;
    return data;
  }

  async getSeller(sellerId) {
    const { data, error } = await this.supabase
      .from('sellers')
      .select('*')
      .eq('id', sellerId)
      .single();

    if (error) throw error;
    return data;
  }

  async getCategory(categoryId) {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .single();

    if (error) throw error;
    return data;
  }

  async recordValidationResult(validationData) {
    // Enregistrer les résultats de validation
    const { error } = await this.supabase
      .from('listing_validations')
      .insert(validationData);

    if (error) throw error;
  }

  async approveListing(listingId, moderatorId, reason) {
    const { data, error } = await this.supabase
      .from('second_hand_listings')
      .update({ 
        is_approved: true,
        approved_by: moderatorId,
        approved_at: new Date().toISOString(),
        moderation_notes: reason
      })
      .eq('id', listingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async notifySeller(moderationResult, sellerId) {
    // Implémentation de notification au vendeur
    logger.info(`Notification envoyée au vendeur ${sellerId}`);
  }
}

// Instance singleton
const secondHandValidationService = new SecondHandValidationService();

module.exports = { secondHandValidationService };
