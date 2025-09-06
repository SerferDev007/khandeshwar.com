import * as shopsRepo from '../repositories/shopsRepo.js';
import { generateId } from '../utils/helpers.js';

/**
 * Service layer for shops business logic
 */

export async function getShops({ limit = 50, offset = 0, status = null } = {}) {
  try {
    // Validate inputs
    const validLimit = Math.min(Math.max(1, parseInt(limit) || 50), 200);
    const validOffset = Math.max(0, parseInt(offset) || 0);
    
    const [items, total] = await Promise.all([
      shopsRepo.listShops({ limit: validLimit, offset: validOffset, status }),
      shopsRepo.countShops({ status })
    ]);
    
    return {
      items: items || [],
      total: total || 0,
      limit: validLimit,
      offset: validOffset
    };
  } catch (error) {
    console.error('Service error getting shops:', error);
    throw error;
  }
}

export async function getShopById(id) {
  try {
    if (!id) {
      throw new Error('Shop ID is required');
    }
    
    const shop = await shopsRepo.getShopById(id);
    if (!shop) {
      const error = new Error('Shop not found');
      error.statusCode = 404;
      throw error;
    }
    
    return shop;
  } catch (error) {
    console.error('Service error getting shop by ID:', error);
    throw error;
  }
}

export async function createShop(shopData) {
  try {
    // Validate required fields
    const { shop_number, size, monthly_rent, deposit } = shopData;
    
    if (!shop_number || !size || !monthly_rent || !deposit) {
      const error = new Error('Missing required fields: shop_number, size, monthly_rent, deposit');
      error.statusCode = 400;
      throw error;
    }
    
    // Generate ID if not provided
    const shopWithId = {
      ...shopData,
      id: shopData.id || generateId()
    };
    
    await shopsRepo.createShop(shopWithId);
    
    // Return the created shop
    return await shopsRepo.getShopById(shopWithId.id);
  } catch (error) {
    console.error('Service error creating shop:', error);
    if (error.message?.includes('Duplicate entry')) {
      const duplicateError = new Error('Shop number already exists');
      duplicateError.statusCode = 409;
      throw duplicateError;
    }
    throw error;
  }
}

export async function updateShop(id, shopData) {
  try {
    if (!id) {
      throw new Error('Shop ID is required');
    }
    
    // Check if shop exists
    const existingShop = await shopsRepo.getShopById(id);
    if (!existingShop) {
      const error = new Error('Shop not found');
      error.statusCode = 404;
      throw error;
    }
    
    // Remove fields that shouldn't be updated
    const { id: _, created_at: __, ...updateData } = shopData;
    
    if (Object.keys(updateData).length === 0) {
      const error = new Error('No valid fields to update');
      error.statusCode = 400;
      throw error;
    }
    
    await shopsRepo.updateShop(id, updateData);
    
    // Return the updated shop
    return await shopsRepo.getShopById(id);
  } catch (error) {
    console.error('Service error updating shop:', error);
    throw error;
  }
}

export async function deleteShop(id) {
  try {
    if (!id) {
      throw new Error('Shop ID is required');
    }
    
    // Check if shop exists
    const existingShop = await shopsRepo.getShopById(id);
    if (!existingShop) {
      const error = new Error('Shop not found');
      error.statusCode = 404;
      throw error;
    }
    
    const result = await shopsRepo.deleteShop(id);
    
    if (result.affectedRows === 0) {
      const error = new Error('Shop not found');
      error.statusCode = 404;
      throw error;
    }
    
    return { success: true, message: 'Shop deleted successfully' };
  } catch (error) {
    console.error('Service error deleting shop:', error);
    throw error;
  }
}