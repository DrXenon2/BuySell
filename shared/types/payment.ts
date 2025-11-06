// Payment related TypeScript definitions

export interface Payment {
  id: string;
  orderId: string;
  customerId: string;
  amount: Price;
  status: PaymentStatus;
  method: PaymentMethod;
  processor: PaymentProcessor;
  processorData: ProcessorData;
  billingDetails: BillingDetails;
  shippingDetails?: ShippingDetails;
  metadata: PaymentMetadata;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
  refundedAmount?: Price;
}

export interface ProcessorData {
  transactionId?: string;
  paymentIntent?: string;
  clientSecret?: string;
  paymentMethod?: string;
  currency: string;
  processorFee?: Price;
  netAmount?: Price;
  riskLevel?: RiskLevel;
  fraudDetails?: FraudDetails;
}

export interface BillingDetails {
  name: string;
  email: string;
  phone?: string;
  address: BillingAddress;
}

export interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ShippingDetails {
  name: string;
  phone?: string;
  address: ShippingAddress;
}

export interface PaymentMetadata {
  ipAddress: string;
  userAgent: string;
  deviceId?: string;
  sessionId: string;
  riskScore?: number;
  threeDSecure?: ThreeDSecureData;
}

export interface ThreeDSecureData {
  version: string;
  authenticated: boolean;
  liabilityShift: boolean;
  reason?: string;
}

export interface FraudDetails {
  score: number;
  reasons: string[];
  decision: FraudDecision;
  rules: FraudRule[];
}

export interface FraudRule {
  id: string;
  name: string;
  action: FraudAction;
  description: string;
}

// Enums
export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export enum FraudDecision {
  ALLOW = 'allow',
  REVIEW = 'review',
  BLOCK = 'block'
}

export enum FraudAction {
  ALLOW = 'allow',
  REVIEW = 'review',
  BLOCK = 'block',
  CAPTCHA = 'captcha'
}

// API Types
export interface CreatePaymentRequest {
  orderId: string;
  paymentMethod: PaymentMethod;
  paymentMethodId?: string;
  savePaymentMethod?: boolean;
  returnUrl: string;
  metadata?: Partial<PaymentMetadata>;
}

export interface PaymentResponse {
  payment: Payment;
  nextAction?: PaymentNextAction;
  clientSecret?: string;
  requiresAction: boolean;
}

export interface PaymentNextAction {
  type: NextActionType;
  data: Record<string, any>;
}

export enum NextActionType {
  REDIRECT = 'redirect',
  THREE_D_SECURE = 'three_d_secure',
  CAPTCHA = 'captcha',
  ADDITIONAL_INFO = 'additional_info'
}

export interface ProcessPaymentWebhook {
  type: WebhookType;
  data: Record<string, any>;
  signature: string;
  timestamp: Date;
}

export enum WebhookType {
  PAYMENT_SUCCEEDED = 'payment_succeeded',
  PAYMENT_FAILED = 'payment_failed',
  PAYMENT_REFUNDED = 'payment_refunded',
  DISPUTE_CREATED = 'dispute_created',
  DISPUTE_CLOSED = 'dispute_closed'
}

// Mobile Money Types
export interface MobileMoneyPayment {
  provider: MobileMoneyProvider;
  phoneNumber: string;
  transactionId: string;
  status: MobileMoneyStatus;
  amount: Price;
  fees: Price;
  network: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum MobileMoneyProvider {
  ORANGE_MONEY = 'orange_money',
  MTN_MONEY = 'mtn_money',
  WAVE = 'wave',
  AIRTEL_MONEY = 'airtel_money',
  MPESA = 'mpesa'
}

export enum MobileMoneyStatus {
  PENDING = 'pending',
  INITIATED = 'initiated',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// Subscription Types
export interface Subscription {
  id: string;
  customerId: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  trialStart?: Date;
  trialEnd?: Date;
  paymentMethod: PaymentMethod;
  metadata: SubscriptionMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionMetadata {
  processorSubscriptionId: string;
  processorCustomerId: string;
  latestInvoice?: string;
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired',
  PAST_DUE = 'past_due',
  TRIALING = 'trialing',
  UNPAID = 'unpaid'
}
