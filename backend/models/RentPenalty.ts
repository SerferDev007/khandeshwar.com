/**
 * RentPenalty model for late payment penalties
 * Tracks penalties imposed for late rent payments
 */

export interface RentPenalty {
  id: string;
  agreementId: string;
  tenantName: string;
  rentAmount: number;
  dueDate: string;
  paidDate?: string;
  penaltyRate: number;
  penaltyAmount: number;
  penaltyPaid: boolean;
  penaltyPaidDate?: string;
  status: 'Pending' | 'Paid';
  createdAt: string;
}

export interface CreateRentPenaltyRequest {
  agreementId: string;
  tenantName: string;
  rentAmount: number;
  dueDate: string;
  penaltyRate: number;
  penaltyAmount: number;
  penaltyPaid?: boolean;
  status?: 'Pending' | 'Paid';
}

export interface UpdateRentPenaltyRequest {
  rentAmount?: number;
  paidDate?: string;
  penaltyRate?: number;
  penaltyAmount?: number;
  penaltyPaid?: boolean;
  penaltyPaidDate?: string;
  status?: 'Pending' | 'Paid';
}

export interface RentPenaltyWithRelations extends RentPenalty {
  agreement?: {
    id: string;
    shopId: string;
    shopNumber: string;
    monthlyRent: number;
    status: string;
  };
  tenant?: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
  paymentTransaction?: {
    id: string;
    date: string;
    amount: number;
    receiptNumber: string;
  };
}