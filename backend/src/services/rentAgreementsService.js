import * as agreementsRepo from '../repositories/rentAgreementsRepo.js';
import { generateId } from '../utils/helpers.js';

/**
 * Service layer for rent agreements business logic
 */

export async function getAgreements({ limit = 50, offset = 0, status = null } = {}) {
  try {
    // Validate inputs
    const validLimit = Math.min(Math.max(1, parseInt(limit) || 50), 200);
    const validOffset = Math.max(0, parseInt(offset) || 0);
    
    const [items, total] = await Promise.all([
      agreementsRepo.listAgreements({ limit: validLimit, offset: validOffset, status }),
      agreementsRepo.countAgreements({ status })
    ]);
    
    return {
      items: items || [],
      total: total || 0,
      limit: validLimit,
      offset: validOffset
    };
  } catch (error) {
    console.error('Service error getting agreements:', error);
    throw error;
  }
}

export async function getAgreementById(id) {
  try {
    if (!id) {
      throw new Error('Agreement ID is required');
    }
    
    const agreement = await agreementsRepo.getAgreementById(id);
    if (!agreement) {
      const error = new Error('Agreement not found');
      error.statusCode = 404;
      throw error;
    }
    
    return agreement;
  } catch (error) {
    console.error('Service error getting agreement by ID:', error);
    throw error;
  }
}

export async function createAgreement(agreementData) {
  try {
    // Validate required fields
    const { tenant_id, shop_id, start_date, monthly_rent } = agreementData;
    
    if (!tenant_id || !shop_id || !start_date || !monthly_rent) {
      const error = new Error('Missing required fields: tenant_id, shop_id, start_date, monthly_rent');
      error.statusCode = 400;
      throw error;
    }
    
    // Generate ID and agreement_date if not provided
    const agreementWithDefaults = {
      ...agreementData,
      id: agreementData.id || generateId(),
      agreement_date: agreementData.agreement_date || new Date().toISOString().split('T')[0]
    };
    
    await agreementsRepo.createAgreement(agreementWithDefaults);
    
    // Return the created agreement
    return await agreementsRepo.getAgreementById(agreementWithDefaults.id);
  } catch (error) {
    console.error('Service error creating agreement:', error);
    if (error.message?.includes('foreign key constraint')) {
      const constraintError = new Error('Invalid tenant_id or shop_id');
      constraintError.statusCode = 400;
      throw constraintError;
    }
    throw error;
  }
}

export async function updateAgreement(id, agreementData) {
  try {
    if (!id) {
      throw new Error('Agreement ID is required');
    }
    
    // Check if agreement exists
    const existingAgreement = await agreementsRepo.getAgreementById(id);
    if (!existingAgreement) {
      const error = new Error('Agreement not found');
      error.statusCode = 404;
      throw error;
    }
    
    // Remove fields that shouldn't be updated
    const { id: _, created_at: __, ...updateData } = agreementData;
    
    if (Object.keys(updateData).length === 0) {
      const error = new Error('No valid fields to update');
      error.statusCode = 400;
      throw error;
    }
    
    await agreementsRepo.updateAgreement(id, updateData);
    
    // Return the updated agreement
    return await agreementsRepo.getAgreementById(id);
  } catch (error) {
    console.error('Service error updating agreement:', error);
    throw error;
  }
}

export async function deleteAgreement(id) {
  try {
    if (!id) {
      throw new Error('Agreement ID is required');
    }
    
    // Check if agreement exists
    const existingAgreement = await agreementsRepo.getAgreementById(id);
    if (!existingAgreement) {
      const error = new Error('Agreement not found');
      error.statusCode = 404;
      throw error;
    }
    
    const result = await agreementsRepo.deleteAgreement(id);
    
    if (result.affectedRows === 0) {
      const error = new Error('Agreement not found');
      error.statusCode = 404;
      throw error;
    }
    
    return { success: true, message: 'Agreement deleted successfully' };
  } catch (error) {
    console.error('Service error deleting agreement:', error);
    throw error;
  }
}