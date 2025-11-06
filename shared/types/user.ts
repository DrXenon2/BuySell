// User related TypeScript definitions

export interface User {
  id: string;
  email: string;
  username?: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  phoneNumber?: string;
  dateOfBirth?: Date;
  gender?: Gender;
  preferences: UserPreferences;
  addresses: Address[];
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface UserProfile {
  id: string;
  userId: string;
  bio?: string;
  website?: string;
  socialLinks: SocialLinks;
  company?: string;
  jobTitle?: string;
  language: string;
  timezone: string;
  currency: string;
  notificationSettings: NotificationSettings;
  privacySettings: PrivacySettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  id: string;
  userId: string;
  type: AddressType;
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
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  github?: string;
}

export interface NotificationSettings {
  email: {
    marketing: boolean;
    security: boolean;
    orders: boolean;
    promotions: boolean;
    newsletter: boolean;
  };
  push: {
    orders: boolean;
    promotions: boolean;
    security: boolean;
  };
  sms: {
    orders: boolean;
    security: boolean;
  };
}

export interface PrivacySettings {
  profileVisibility: ProfileVisibility;
  showEmail: boolean;
  showPhone: boolean;
  showActivity: boolean;
  dataSharing: boolean;
}

export interface UserPreferences {
  theme: Theme;
  language: string;
  currency: string;
  timezone: string;
  emailFormat: EmailFormat;
  productsPerPage: number;
  autoPlayVideos: boolean;
  showExplicitContent: boolean;
}

export enum UserRole {
  CUSTOMER = 'customer',
  SELLER = 'seller',
  ADMIN = 'admin',
  MODERATOR = 'moderator'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
  PENDING = 'pending'
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say'
}

export enum AddressType {
  HOME = 'home',
  WORK = 'work',
  BILLING = 'billing',
  SHIPPING = 'shipping'
}

export enum ProfileVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  FRIENDS_ONLY = 'friends_only'
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto'
}

export enum EmailFormat {
  HTML = 'html',
  PLAIN_TEXT = 'plain_text'
}

// API Request/Response Types
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username?: string;
  acceptTerms: boolean;
  marketingEmails?: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  username?: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  gender?: Gender;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

// Pagination and Filtering
export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  sortBy?: UserSortField;
  sortOrder?: SortOrder;
}

export enum UserSortField {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  LAST_LOGIN = 'lastLoginAt',
  EMAIL = 'email',
  FIRST_NAME = 'firstName',
  LAST_NAME = 'lastName'
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc'
}

export interface UsersResponse {
  users: User[];
  pagination: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
