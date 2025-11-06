// Cart related TypeScript definitions

export interface Cart {
  id: string;
  userId?: string;
  sessionId: string;
  items: CartItem[];
  pricing: CartPricing;
  shipping?: CartShipping;
  coupons: AppliedCoupon[];
  metadata: CartMetadata;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  productName: string;
  productImage?: string;
  sku: string;
  quantity: number;
  price: Price;
  originalPrice?: Price;
  total: Price;
  attributes: CartItemAttribute[];
  inventory: CartItemInventory;
  isAvailable: boolean;
  maxQuantity: number;
}

export interface CartItemAttribute {
  name: string;
  value: string;
}

export interface CartItemInventory {
  quantity: number;
  isInStock: boolean;
  allowBackorder: boolean;
}

export interface CartPricing {
  subtotal: Price;
  shipping: Price;
  tax: Price;
  discount: Price;
  total: Price;
  currency: string;
  taxRate: number;
}

export interface CartShipping {
  address?: ShippingAddress;
  method?: ShippingMethod;
  options: ShippingOption[];
}

export interface ShippingOption {
  id: string;
  name: string;
  carrier: string;
  service: string;
  cost: number;
  estimatedDays: number;
  isFree: boolean;
  isRecommended: boolean;
}

export interface AppliedCoupon {
  code: string;
  type: DiscountType;
  value: number;
  description: string;
  minimumAmount?: number;
  maximumDiscount?: number;
  appliedAmount: Price;
}

export interface CartMetadata {
  ipAddress: string;
  userAgent: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

// API Types
export interface AddToCartRequest {
  productId: string;
  variantId?: string;
  quantity: number;
  attributes?: Record<string, string>;
}

export interface UpdateCartItemRequest {
  itemId: string;
  quantity: number;
}

export interface ApplyCouponRequest {
  code: string;
}

export interface UpdateShippingRequest {
  address: ShippingAddress;
  methodId: string;
}

export interface CartResponse {
  cart: Cart;
  recommendations: ProductRecommendation[];
  abandonedCart?: AbandonedCartInfo;
}

export interface ProductRecommendation {
  productId: string;
  productName: string;
  productImage?: string;
  price: Price;
  originalPrice?: Price;
  reason: RecommendationReason;
}

export interface AbandonedCartInfo {
  recovered: boolean;
  recoveryUrl?: string;
  discountOffer?: DiscountOffer;
}

export interface DiscountOffer {
  code: string;
  discount: number;
  type: DiscountType;
  expiresAt: Date;
}

export enum RecommendationReason {
  FREQUENTLY_BOUGHT_TOGETHER = 'frequently_bought_together',
  SIMILAR_PRODUCTS = 'similar_products',
  TRENDING = 'trending',
  RECENTLY_VIEWED = 'recently_viewed'
}

// Cart Events
export interface CartEvent {
  type: CartEventType;
  cartId: string;
  userId?: string;
  sessionId: string;
  data: Record<string, any>;
  timestamp: Date;
}

export enum CartEventType {
  ITEM_ADDED = 'item_added',
  ITEM_UPDATED = 'item_updated',
  ITEM_REMOVED = 'item_removed',
  COUPON_APPLIED = 'coupon_applied',
  COUPON_REMOVED = 'coupon_removed',
  SHIPPING_UPDATED = 'shipping_updated',
  CART_MERGED = 'cart_merged',
  CART_ABANDONED = 'cart_abandoned',
  CART_RECOVERED = 'cart_recovered'
}
