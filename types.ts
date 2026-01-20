
export enum AppSpace {
  CLIENT = 'CLIENT',
  AGENCY = 'AGENCY',
  ADMIN = 'ADMIN'
}

export type UserRole = 'CLIENT' | 'AGENT' | 'ADMIN';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  agencyName?: string;
  avatar?: string;
  walletBalance: number;
  markupPreference?: number; // Custom margin for B2B agents
  password?: string; // For simple auth demo
  status?: 'PENDING' | 'APPROVED' | 'REJECTED'; // For B2B approval
  agencyAddress?: string;
  agencyPhone?: string;
}

export type ServiceType = 'VISA' | 'E-VISA' | 'VOYAGE_ORGANISE' | 'OMRAH' | 'BILLETERIE';

export interface Subscriber {
  id: string;
  email: string;
  subscribedAt: string;
}

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
}

export interface TravelPackage {
  id: string;
  title: string;
  description: string;
  price: number;
  priceAdult?: number;
  priceChild?: number;
  priceBaby?: number;
  image: string;
  type: ServiceType;
  duration?: string;
  date?: string;
  stock: number;
  isFlashDeal?: boolean;
  rating?: number;
  itinerary?: ItineraryDay[];
  inclusions?: string[];
  exclusions?: string[];
  isDeleted?: boolean;
  isB2BOnly?: boolean; // If true, only visible to agents
}

export type Traveler = {
  type: 'ADULT' | 'CHILD' | 'BABY';
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  passportNumber: string;
  passportImage?: string;
}

export type PaymentMethod = 'CIB_EDAHABIA' | 'BARIDIMOB_CCP' | 'CASH_AGENCY' | 'WALLET';

export interface Booking {
  id: string;
  customerName: string;
  service: ServiceType;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  date: string;
  amount: number;
  contact?: string;
  address?: string;
  travelers: Traveler[];
  packageId?: string;
  agencyId?: string;
  agencyName?: string;
  paymentMethod?: PaymentMethod;
  paymentProof?: string;
  notes?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  comment: string;
  rating: number;
  location: string;
}

export interface WalletRequest {
  id: string;
  agencyId: string;
  agencyName: string;
  amount: number;
  proofImage: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

// ============================================
// EXTENDED TYPES FOR CLIENT CONSOLE
// ============================================

export interface VisaApplication {
  id: string;
  userId: string;
  country: string;
  countryCode: string;
  applicationNumber: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'SUBMITTED';
  applicationType: string;
  deadline?: string;
  submissionDate?: string;
  approvalDate?: string;
  documentsSubmitted: boolean;
  notes?: string;
  feeAmount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserActivity {
  id: string;
  userId: string;
  activityType: string;
  activityDescription: string;
  metadata?: any;
  createdAt: string;
}

export interface LoyaltyPoints {
  id: string;
  userId: string;
  pointsBalance: number;
  lifetimePoints: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  createdAt?: string;
  updatedAt?: string;
}

export interface LoyaltyTransaction {
  id: string;
  userId: string;
  pointsChange: number;
  transactionType: string;
  description?: string;
  referenceId?: string;
  createdAt: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  amount: number;
  transactionType: 'DEPOSIT' | 'WITHDRAWAL' | 'PAYMENT' | 'REFUND' | 'BONUS';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  description?: string;
  referenceId?: string;
  paymentMethod?: string;
  createdAt: string;
}

export interface Trip {
  id: string;
  userId: string;
  destination: string;
  destinationCountry: string;
  tripType: string;
  startDate: string;
  endDate: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  totalPrice: number;
  bookingReference?: string;
  includesFlight: boolean;
  includesHotel: boolean;
  includesVisa: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppNotification {
  id: string;
  type: 'BOOKING' | 'WALLET' | 'AGENCY' | 'SYSTEM' | 'SETTINGS' | 'REPORT';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}
