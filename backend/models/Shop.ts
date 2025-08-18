/**
 * Shop model for rental unit management
 * Represents individual rental spaces in the temple complex
 */

import { UploadedFile } from './UploadedFile';

export interface Shop {
  id: string;
  shopNumber: string;
  size: number;
  monthlyRent: number;
  deposit: number;
  status: 'Vacant' | 'Occupied' | 'Maintenance';
  tenantId?: string;
  agreementId?: string;
  createdAt: string;
  description?: string;
}

export interface CreateShopRequest {
  shopNumber: string;
  size: number;
  monthlyRent: number;
  deposit: number;
  status?: 'Vacant' | 'Occupied' | 'Maintenance';
  description?: string;
}

export interface UpdateShopRequest {
  shopNumber?: string;
  size?: number;
  monthlyRent?: number;
  deposit?: number;
  status?: 'Vacant' | 'Occupied' | 'Maintenance';
  tenantId?: string;
  agreementId?: string;
  description?: string;
}

export interface ShopWithRelations extends Shop {
  tenant?: {
    id: string;
    name: string;
    phone: string;
    businessType: string;
  };
  agreement?: {
    id: string;
    agreementDate: string;
    duration: number;
    nextDueDate: string;
    status: string;
  };
}