import { query } from '../config/db.js';

/**
 * Repository for rent agreements data access
 */

/**
 * List agreements with pagination and joins
 */
export async function listAgreements({ limit = 50, offset = 0, status = null } = {}) {
  try {
    let whereClause = '';
    const params = [];
    
    if (status) {
      whereClause = 'WHERE a.status = ?';
      params.push(status);
    }
    
    const queryStr = `
      SELECT a.id, a.tenant_id, a.shop_id, a.start_date, a.end_date, 
             a.monthly_rent, a.status, a.agreement_date, a.created_at,
             t.name AS tenant_name, t.phone AS tenant_phone,
             s.shop_number AS shop_name
      FROM agreements a
      LEFT JOIN tenants t ON t.id = a.tenant_id
      LEFT JOIN shops s ON s.id = a.shop_id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(limit, offset);
    
    const rows = await query(queryStr, params);
    return rows;
  } catch (error) {
    console.error('Error listing agreements:', error);
    throw new Error(`Failed to list agreements: ${error.message}`);
  }
}

/**
 * Count total agreements
 */
export async function countAgreements({ status = null } = {}) {
  try {
    let whereClause = '';
    const params = [];
    
    if (status) {
      whereClause = 'WHERE status = ?';
      params.push(status);
    }
    
    const queryStr = `SELECT COUNT(*) AS cnt FROM agreements ${whereClause}`;
    
    const rows = await query(queryStr, params);
    return rows[0].cnt;
  } catch (error) {
    console.error('Error counting agreements:', error);
    throw new Error(`Failed to count agreements: ${error.message}`);
  }
}

/**
 * Get agreement by ID with joins
 */
export async function getAgreementById(id) {
  try {
    const rows = await query(
      `SELECT a.*, 
              t.name AS tenant_name, t.phone AS tenant_phone,
              s.shop_number AS shop_name
       FROM agreements a
       LEFT JOIN tenants t ON t.id = a.tenant_id
       LEFT JOIN shops s ON s.id = a.shop_id
       WHERE a.id = ?`,
      [id]
    );
    return rows[0] || null;
  } catch (error) {
    console.error('Error getting agreement by ID:', error);
    throw new Error(`Failed to get agreement: ${error.message}`);
  }
}

/**
 * Create new agreement
 */
export async function createAgreement(agreementData) {
  try {
    const {
      id,
      tenant_id,
      shop_id,
      start_date,
      end_date,
      monthly_rent,
      status = 'Active',
      agreement_date
    } = agreementData;
    
    const result = await query(
      `INSERT INTO agreements (id, tenant_id, shop_id, start_date, end_date, monthly_rent, status, agreement_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, tenant_id, shop_id, start_date, end_date, monthly_rent, status, agreement_date]
    );
    
    return { insertId: result.insertId, affectedRows: result.affectedRows };
  } catch (error) {
    console.error('Error creating agreement:', error);
    throw new Error(`Failed to create agreement: ${error.message}`);
  }
}

/**
 * Update agreement
 */
export async function updateAgreement(id, agreementData) {
  try {
    const updateFields = [];
    const updateValues = [];
    
    Object.entries(agreementData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'created_at') {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    });
    
    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }
    
    updateValues.push(id);
    
    const result = await query(
      `UPDATE agreements SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
    
    return { affectedRows: result.affectedRows };
  } catch (error) {
    console.error('Error updating agreement:', error);
    throw new Error(`Failed to update agreement: ${error.message}`);
  }
}

/**
 * Delete agreement
 */
export async function deleteAgreement(id) {
  try {
    const result = await query(
      'DELETE FROM agreements WHERE id = ?',
      [id]
    );
    
    return { affectedRows: result.affectedRows };
  } catch (error) {
    console.error('Error deleting agreement:', error);
    throw new Error(`Failed to delete agreement: ${error.message}`);
  }
}