/**
 * Agreement model for rental contracts
 * Links shops and tenants with rental terms
 */

import { UploadedFile } from './UploadedFile';

export interface Agreement {
  id: string;
  shopId: string;
  tenantId: string;
  agreementDate: string;
  duration: number;
  monthlyRent: number;
  securityDeposit: number;
  advanceRent: number;
  agreementType: 'Residential' | 'Commercial';
  status: 'Active' | 'Expired' | 'Terminated';
  nextDueDate: string;
  lastPaymentDate?: string;
  hasActiveLoan?: boolean;
  activeLoanId?: string;
  pendingPenalties?: string[];
  agreementDocument?: UploadedFile[];
  createdAt: string;
}

export interface CreateAgreementRequest {
  shopId: string;
  tenantId: string;
  agreementDate: string;
  duration: number;
  monthlyRent: number;
  securityDeposit: number;
  advanceRent: number;
  agreementType: 'Residential' | 'Commercial';
  status?: 'Active' | 'Expired' | 'Terminated';
  agreementDocument?: UploadedFile[];
}

export interface UpdateAgreementRequest {
  agreementDate?: string;
  duration?: number;
  monthlyRent?: number;
  securityDeposit?: number;
  advanceRent?: number;
  agreementType?: 'Residential' | 'Commercial';
  status?: 'Active' | 'Expired' | 'Terminated';
  nextDueDate?: string;
  lastPaymentDate?: string;
  hasActiveLoan?: boolean;
  activeLoanId?: string;
  pendingPenalties?: string[];
  agreementDocument?: UploadedFile[];
}

export interface AgreementWithRelations extends Agreement {
  shop?: {
    id: string;
    shopNumber: string;
    size: number;
    description?: string;
  };
  tenant?: {
    id: string;
    name: string;
    phone: string;
    email: string;
    businessType: string;
  };
  loans?: Array<{
    id: string;
    loanAmount: number;
    outstandingBalance: number;
    status: string;
    nextEmiDate: string;
  }>;
  penalties?: Array<{
    id: string;
    penaltyAmount: number;
    status: string;
    dueDate: string;
  }>;
}