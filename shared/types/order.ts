// Order related TypeScript definitions

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  sellerId: string;
  status: OrderStatus;
  items: OrderItem[];
  pricing: OrderPricing;
  shipping: OrderShipping;
  payment: OrderPayment;
  customer: OrderCustomer;
  timeline: OrderTimeline[];
  notes: OrderNote[];
  metadata: OrderMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
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
  attributes: OrderItemAttribute[];
  downloadLinks?: DownloadLink[];
}

export interface OrderItemAttribute {
  name: string;
  value: string;
}

export interface DownloadLink {
  id: string;
  name: string;
  url: string;
  expiresAt?: Date;
  downloadCount: number;
  maxDownloads?: number;
}

export interface OrderPricing {
  subtotal: Price;
  shipping: Price;
  tax: Price;
  discount: Price;
  total: Price;
  currency: string;
  taxRate: number;
  discountCode?: string;
  discountType?: DiscountType;
  discountValue?: number;
}

export interface OrderShipping {
  address: ShippingAddress;
  method: ShippingMethod;
  tracking?: TrackingInfo;
  estimatedDelivery?: Date;
  deliveredAt?: Date;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  company?: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber?: string;
  email?: string;
}

export interface ShippingMethod {
  id: string;
  name: string;
  carrier: string;
  service: string;
  cost: number;
  estimatedDays: number;
  isFree: boolean;
}

export interface TrackingInfo {
  number: string;
  url?: string;
  carrier: string;
  status?: string;
  updatedAt?: Date;
}

export interface OrderPayment {
  id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  processor: PaymentProcessor;
  transactionId?: string;
  amount: Price;
  paidAt?: Date;
  refundedAmount?: Price;
  refunds: Refund[];
  paymentIntent?: string;
}

export interface Refund {
  id: string;
  amount: Price;
  reason: string;
  status: RefundStatus;
  processedAt: Date;
  transactionId?: string;
}

export interface OrderCustomer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  marketingEmails: boolean;
}

export interface OrderTimeline {
  id: string;
  status: OrderStatus;
  description: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface OrderNote {
  id: string;
  type: NoteType;
  content: string;
  author: string;
  isCustomerVisible: boolean;
  createdAt: Date;
}

export interface OrderMetadata {
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  affiliateId?: string;
}

// Enums
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  READY_FOR_SHIPMENT = 'ready_for_shipment',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  ON_HOLD = 'on_hold',
  FAILED = 'failed'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  AUTHORIZED = 'authorized',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
  CANCELLED = 'cancelled'
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PAYPAL = 'paypal',
  STRIPE = 'stripe',
  APPLE_PAY = 'apple_pay',
  GOOGLE_PAY = 'google_pay',
  BANK_TRANSFER = 'bank_transfer',
  CASH_ON_DELIVERY = 'cash_on_delivery',
  DIGITAL_WALLET = 'digital_wallet'
}

export enum PaymentProcessor {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  SQUARE = 'square',
  AUTHORIZE_NET = 'authorize_net',
  MOBILE_MONEY = 'mobile_money'
}

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  FREE_SHIPPING = 'free_shipping'
}

export enum RefundStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum NoteType {
  INTERNAL = 'internal',
  CUSTOMER = 'customer',
  SYSTEM = 'system'
}

// API Types
export interface OrderQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus;
  customerId?: string;
  sellerId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: OrderSortField;
  sortOrder?: SortOrder;
}

export enum OrderSortField {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  ORDER_NUMBER = 'orderNumber',
  TOTAL = 'total',
  STATUS = 'status'
}

export interface OrdersResponse {
  orders: Order[];
  pagination: PaginationInfo;
  summary: OrderSummary;
}

export interface OrderSummary {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  revenue: Price;
}

export interface CreateOrderRequest {
  items: OrderItemRequest[];
  shippingAddress: ShippingAddress;
  billingAddress?: ShippingAddress;
  shippingMethodId: string;
  paymentMethod: PaymentMethod;
  customerNote?: string;
  marketingEmails?: boolean;
}

export interface OrderItemRequest {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  note?: string;
  trackingNumber?: string;
  carrier?: string;
}

export interface CreateRefundRequest {
  orderId: string;
  items: RefundItem[];
  reason: string;
  amount: number;
  restockItems?: boolean;
}

export interface RefundItem {
  orderItemId: string;
  quantity: number;
  amount: number;
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: Price;
  averageOrderValue: Price;
  conversionRate: number;
  popularProducts: PopularProduct[];
  revenueByPeriod: RevenueData[];
}

export interface PopularProduct {
  productId: string;
  productName: string;
  quantity: number;
  revenue: Price;
}

export interface RevenueData {
  period: string;
  revenue: number;
  orders: number;
}
