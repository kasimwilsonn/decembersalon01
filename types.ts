
export enum Role {
  // Management Team
  OWNER = 'OWNER',
  SALON_MANAGER = 'SALON_MANAGER',
  STORE_MANAGER = 'STORE_MANAGER',
  MARKETING_MANAGER = 'MARKETING_MANAGER',
  RECEPTIONIST = 'RECEPTIONIST',
  
  // Service Staff
  SENIOR_STYLIST = 'SENIOR_STYLIST',
  HAIRDRESSER = 'HAIRDRESSER',
  MAKEUP_ARTIST = 'MAKEUP_ARTIST',
  BEAUTICIAN = 'BEAUTICIAN',
  NAIL_TECHNICIAN = 'NAIL_TECHNICIAN',
  JUNIOR_STYLIST = 'JUNIOR_STYLIST',

  // Legacy (Keep for backward compatibility if needed)
  MANAGER = 'MANAGER',
  STYLIST = 'STYLIST'
}

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  visits: number;
  walletBalance: number;
  loyaltyPoints: number; // New field
  notes?: string;
  membershipId?: string;
  dob?: string; 
  gender?: 'Male' | 'Female' | 'Other';
  packages?: UserPackage[];
}

export interface UserPackage {
  id: string;
  name: string;
  servicesRemaining: { serviceId: string; count: number }[];
  expiryDate: string;
}

export interface PackageTemplate {
  id: string;
  name: string;
  price: number;
  validityDays: number;
  services: { serviceId: string; count: number }[];
  description?: string;
}

export interface GiftCard {
  code: string;
  balance: number;
  initialAmount: number;
  expiryDate: string;
  issuedToName?: string;
  status: 'ACTIVE' | 'REDEEMED' | 'EXPIRED';
}

export interface Service {
  id: string;
  name: string;
  price: number;
  durationMins: number;
  category: string;
}

export interface Staff {
  id: string;
  name: string;
  role: Role;
  commissionRate: number; // percentage
  phone: string;
  isActive: boolean;
  attendance?: { date: string; status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' }[];
}

export interface Appointment {
  id: string;
  customerId: string;
  customerName: string;
  serviceIds: string[];
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  stylistId: string;
  status: AppointmentStatus;
  notes?: string;
  type: 'ONLINE' | 'WALK_IN';
  technicianNotes?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  stock: number;
  price: number;
  costPrice: number;
  lowStockThreshold: number;
  sku: string;
  // New Fields
  batchNumber?: string;
  expiryDate?: string;
  barcode?: string;
}

export interface Vendor {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  category: string;
  email?: string;
  address?: string;
}

export interface PurchaseOrder {
  id: string;
  vendorId: string;
  vendorName: string;
  date: string;
  status: 'PENDING' | 'RECEIVED' | 'CANCELLED';
  items: { productName: string; qty: number; cost: number }[];
  totalAmount: number;
  expectedDelivery?: string;
}

export interface PaymentTransaction {
  id: string;
  amount: number;
  date: string;
  mode: 'CASH' | 'CARD' | 'UPI' | 'SPLIT' | 'WALLET';
  note?: string; // e.g. "Advance", "Balance Settlement"
}

export interface Bill {
  id: string;
  appointmentId: string;
  customerName: string;
  items: { name: string; price: number; qty: number; type: 'SERVICE' | 'PRODUCT' }[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  date: string; // Invoice Creation Date
  
  // Payment Tracking
  paymentMode: 'CASH' | 'CARD' | 'UPI' | 'SPLIT' | 'WALLET';
  splitDetails?: { cash: number; card: number; upi: number; wallet: number };
  
  isPartialPayment?: boolean;
  amountPaid: number; // Total amount paid so far
  dueAmount: number;  // Remaining balance
  payments: PaymentTransaction[]; // History of payments

  status: 'PAID' | 'REFUNDED' | 'PARTIAL'; 
  
  // Loyalty Fields
  pointsEarned?: number;
  pointsRedeemed?: number;
  loyaltyDiscount?: number;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: 'RENT' | 'SALARY' | 'VENDOR' | 'UTILITY' | 'OTHER';
  date: string;
  paidBy: string;
  paymentMode: string;
}

export interface NotificationSettings {
  enabled: boolean;
  provider: 'WHATSAPP_CLOUD_API' | 'TWILIO' | 'MANUAL_LINK';
  apiKey?: string;
  apiSecret?: string;
  phoneNumberId?: string; // For WhatsApp Cloud API
  triggers: {
    appointmentBooking: boolean;
    billGeneration: boolean;
    staffDailyReport: boolean;
    lowStock: boolean;
  };
}
