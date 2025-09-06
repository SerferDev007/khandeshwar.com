import { pool } from '../config/db.js';

/**
 * Repository for shops data access
 */

/**
 * List shops with pagination and filtering
 */
export async function listShops({ limit = 50, offset = 0, status = null } = {}) {
  try {
    let whereClause = '';
    const params = [];
    
    if (status) {
      whereClause = 'WHERE status = ?';
      params.push(status);
    }
    
    const query = `
      SELECT id, shop_number, size, monthly_rent, deposit, status, 
             tenant_id, agreement_id, description, created_at 
      FROM shops 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    
    params.push(limit, offset);
    
    const [rows] = await pool.query(query, params);
    return rows;
  } catch (error) {
    console.error('Error listing shops:', error);
    throw new Error(`Failed to list shops: ${error.message}`);
  }
}

/**
 * Count total shops
 */
export async function countShops({ status = null } = {}) {
  try {
    let whereClause = '';
    const params = [];
    
    if (status) {
      whereClause = 'WHERE status = ?';
      params.push(status);
    }
    
    const query = `SELECT COUNT(*) AS cnt FROM shops ${whereClause}`;
    
    const [rows] = await pool.query(query, params);
    return rows[0].cnt;
  } catch (error) {
    console.error('Error counting shops:', error);
    throw new Error(`Failed to count shops: ${error.message}`);
  }
}

/**
 * Get shop by ID
 */
export async function getShopById(id) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM shops WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  } catch (error) {
    console.error('Error getting shop by ID:', error);
    throw new Error(`Failed to get shop: ${error.message}`);
  }
}

/**
 * Create new shop
 */
export async function createShop(shopData) {
  try {
    const {
      id,
      shop_number,
      size,
      monthly_rent,
      deposit,
      status = 'Vacant',
      tenant_id = null,
      agreement_id = null,
      description = null
    } = shopData;
    
    const [result] = await pool.query(
      `INSERT INTO shops (id, shop_number, size, monthly_rent, deposit, status, tenant_id, agreement_id, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, shop_number, size, monthly_rent, deposit, status, tenant_id, agreement_id, description]
    );
    
    return { insertId: result.insertId, affectedRows: result.affectedRows };
  } catch (error) {
    console.error('Error creating shop:', error);
    throw new Error(`Failed to create shop: ${error.message}`);
  }
}

/**
 * Update shop
 */
export async function updateShop(id, shopData) {
  try {
    const updateFields = [];
    const updateValues = [];
    
    Object.entries(shopData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'created_at') {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    });
    
    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }
    
    updateValues.push(id);
    
    const [result] = await pool.query(
      `UPDATE shops SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
    
    return { affectedRows: result.affectedRows };
  } catch (error) {
    console.error('Error updating shop:', error);
    throw new Error(`Failed to update shop: ${error.message}`);
  }
}

/**
 * Delete shop
 */
export async function deleteShop(id) {
  try {
    const [result] = await pool.query(
      'DELETE FROM shops WHERE id = ?',
      [id]
    );
    
    return { affectedRows: result.affectedRows };
  } catch (error) {
    console.error('Error deleting shop:', error);
    throw new Error(`Failed to delete shop: ${error.message}`);
  }
}