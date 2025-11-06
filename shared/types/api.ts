// Common API TypeScript definitions

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  validationErrors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ApiMeta {
  timestamp: Date;
  version: string;
  requestId: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface SearchParams {
  query: string;
  filters?: Record<string, any>;
  sortBy?: string;
  sortOrder?: SortOrder;
  page?: number;
  limit?: number;
}

export interface BulkOperationResponse {
  success: boolean;
  processed: number;
  succeeded: number;
  failed: number;
  errors: BulkOperationError[];
}

export interface BulkOperationError {
  id: string;
  error: string;
}

export interface FileUploadResponse {
  id: string;
  url: string;
  filename: string;
  size: number;
  mimetype: string;
  metadata: FileMetadata;
  uploadedAt: Date;
}

export interface FileMetadata {
  width?: number;
  height?: number;
  duration?: number;
  format?: string;
}

export interface HealthCheckResponse {
  status: HealthStatus;
  timestamp: Date;
  uptime: number;
  version: string;
  checks: HealthCheck[];
}

export interface HealthCheck {
  name: string;
  status: HealthStatus;
  responseTime: number;
  details?: Record<string, any>;
}

export enum HealthStatus {
  HEALTHY = 'healthy',
  UNHEALTHY = 'unhealthy',
  DEGRADED = 'degraded'
}

// WebSocket Types
export interface WebSocketMessage<T = any> {
  type: WebSocketMessageType;
  data: T;
  timestamp: Date;
  id: string;
}

export enum WebSocketMessageType {
  NOTIFICATION = 'notification',
  ORDER_UPDATE = 'order_update',
  CHAT_MESSAGE = 'chat_message',
  SYSTEM_ALERT = 'system_alert',
  PRESENCE_UPDATE = 'presence_update'
}

// Event Types
export interface SystemEvent<T = any> {
  id: string;
  type: SystemEventType;
  data: T;
  timestamp: Date;
  source: string;
  metadata: Record<string, any>;
}

export enum SystemEventType {
  USER_REGISTERED = 'user_registered',
  ORDER_CREATED = 'order_created',
  PAYMENT_PROCESSED = 'payment_processed',
  PRODUCT_VIEWED = 'product_viewed',
  CART_UPDATED = 'cart_updated',
  NOTIFICATION_SENT = 'notification_sent'
}

// Analytics Types
export interface AnalyticsEvent {
  id: string;
  type: AnalyticsEventType;
  userId?: string;
  sessionId: string;
  properties: Record<string, any>;
  timestamp: Date;
  context: AnalyticsContext;
}

export interface AnalyticsContext {
  ip: string;
  userAgent: string;
  locale: string;
  timezone: string;
  screen: ScreenInfo;
  url: string;
  referrer?: string;
}

export interface ScreenInfo {
  width: number;
  height: number;
}

export enum AnalyticsEventType {
  PAGE_VIEW = 'page_view',
  PRODUCT_VIEW = 'product_view',
  ADD_TO_CART = 'add_to_cart',
  REMOVE_FROM_CART = 'remove_from_cart',
  CHECKOUT_STARTED = 'checkout_started',
  PURCHASE = 'purchase',
  SEARCH = 'search',
  SIGN_UP = 'sign_up',
  LOGIN = 'login'
}
