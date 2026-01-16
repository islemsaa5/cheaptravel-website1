
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
  password?: string; // For simple auth demo
  status?: 'PENDING' | 'APPROVED' | 'REJECTED'; // For B2B approval
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
}

export interface Testimonial {
  id: string;
  name: string;
  comment: string;
  rating: number;
  location: string;
}
