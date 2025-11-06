// Product related TypeScript definitions

export interface Product {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  shortDescription?: string;
  sku: string;
  price: Price;
  originalPrice?: Price;
  costPrice?: Price;
  categoryId: string;
  brand?: string;
  images: ProductImage[];
  videos?: ProductVideo[];
  attributes: ProductAttribute[];
  variants?: ProductVariant[];
  inventory: Inventory;
  shipping: ShippingInfo;
  seo: SEOData;
  status: ProductStatus;
  condition: ProductCondition;
  tags: string[];
  specifications: Specification[];
  reviews: ReviewSummary;
  stats: ProductStats;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface Price {
  amount: number;
  currency: string;
  formatted: string;
}

export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  isPrimary: boolean;
  order: number;
  metadata?: ImageMetadata;
}

export interface ImageMetadata {
  width: number;
  height: number;
  size: number;
  format: string;
}

export interface ProductVideo {
  id: string;
  url: string;
  thumbnail?: string;
  type: VideoType;
  duration?: number;
}

export interface ProductAttribute {
  id: string;
  name: string;
  value: string;
  type: AttributeType;
  displayOrder: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  price: Price;
  originalPrice?: Price;
  attributes: VariantAttribute[];
  inventory: Inventory;
  images: string[]; // image IDs
  isActive: boolean;
}

export interface VariantAttribute {
  attributeId: string;
  value: string;
}

export interface Inventory {
  quantity: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
  trackQuantity: boolean;
  allowBackorder: boolean;
  sku: string;
  barcode?: string;
}

export interface ShippingInfo {
  weight: number;
  weightUnit: WeightUnit;
  dimensions: Dimensions;
  isFreeShipping: boolean;
  shippingClass?: string;
  processingTime: ProcessingTime;
}

export interface Dimensions {
  length: number;
  width: number;
  height: number;
  unit: DimensionUnit;
}

export interface SEOData {
  title?: string;
  description?: string;
  slug: string;
  metaKeywords?: string[];
  canonicalUrl?: string;
}

export interface Specification {
  name: string;
  value: string;
  group?: string;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: RatingDistribution;
}

export interface RatingDistribution {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

export interface ProductStats {
  views: number;
  purchases: number;
  wishlists: number;
  shares: number;
  conversionRate: number;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  slug: string;
  parentId?: string;
  image?: string;
  icon?: string;
  isActive: boolean;
  displayOrder: number;
  metadata?: CategoryMetadata;
  children?: Category[];
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryMetadata {
  seoTitle?: string;
  seoDescription?: string;
  filters?: FilterOption[];
}

export interface FilterOption {
  id: string;
  name: string;
  type: FilterType;
  values: FilterValue[];
}

export interface FilterValue {
  id: string;
  value: string;
  count: number;
}

// Enums
export enum ProductStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  OUT_OF_STOCK = 'out_of_stock',
  DISCONTINUED = 'discontinued'
}

export enum ProductCondition {
  NEW = 'new',
  USED = 'used',
  REFURBISHED = 'refurbished'
}

export enum WeightUnit {
  GRAMS = 'g',
  KILOGRAMS = 'kg',
  POUNDS = 'lb',
  OUNCES = 'oz'
}

export enum DimensionUnit {
  CENTIMETERS = 'cm',
  INCHES = 'in',
  MILLIMETERS = 'mm'
}

export enum ProcessingTime {
  ONE_DAY = '1_day',
  TWO_DAYS = '2_days',
  THREE_DAYS = '3_days',
  ONE_WEEK = '1_week',
  TWO_WEEKS = '2_weeks',
  CUSTOM = 'custom'
}

export enum AttributeType {
  TEXT = 'text',
  COLOR = 'color',
  IMAGE = 'image',
  SELECT = 'select'
}

export enum VideoType {
  YOUTUBE = 'youtube',
  VIMEO = 'vimeo',
  DIRECT = 'direct'
}

export enum FilterType {
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  RANGE = 'range',
  COLOR = 'color'
}

// API Types
export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  condition?: ProductCondition;
  status?: ProductStatus;
  sortBy?: ProductSortField;
  sortOrder?: SortOrder;
  attributes?: Record<string, string>;
  inStock?: boolean;
  featured?: boolean;
  onSale?: boolean;
}

export enum ProductSortField {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  PRICE = 'price',
  NAME = 'title',
  RATING = 'rating',
  POPULARITY = 'popularity',
  BEST_SELLING = 'bestSelling'
}

export interface ProductsResponse {
  products: Product[];
  pagination: PaginationInfo;
  filters: AvailableFilters;
}

export interface AvailableFilters {
  categories: CategoryFilter[];
  brands: BrandFilter[];
  priceRange: PriceRange;
  attributes: AttributeFilter[];
}

export interface CategoryFilter {
  id: string;
  name: string;
  count: number;
  parentId?: string;
}

export interface BrandFilter {
  name: string;
  count: number;
}

export interface PriceRange {
  min: number;
  max: number;
}

export interface AttributeFilter {
  id: string;
  name: string;
  values: AttributeValueFilter[];
}

export interface AttributeValueFilter {
  value: string;
  count: number;
}

export interface CreateProductRequest {
  title: string;
  description: string;
  shortDescription?: string;
  price: number;
  originalPrice?: number;
  costPrice?: number;
  categoryId: string;
  brand?: string;
  inventory: Omit<Inventory, 'available'>;
  shipping: Omit<ShippingInfo, 'dimensions'> & {
    dimensions: Omit<Dimensions, 'unit'>;
  };
  attributes: Omit<ProductAttribute, 'id'>[];
  variants?: Omit<ProductVariant, 'id'>[];
  tags?: string[];
  specifications?: Omit<Specification, 'id'>[];
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: string;
}

export interface BulkUpdateProductsRequest {
  productIds: string[];
  updates: Partial<{
    status: ProductStatus;
    price: number;
    inventory: Partial<Inventory>;
  }>;
}
