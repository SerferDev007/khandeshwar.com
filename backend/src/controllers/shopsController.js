import * as shopsService from '../services/shopsService.js';

/**
 * Controller for shops API endpoints
 */

export async function getShops(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;
    const status = req.query.status || null;
    
    console.log('Getting shops with params:', { limit, offset, status });
    
    const result = await shopsService.getShops({ limit, offset, status });
    
    res.status(200).json({ 
      success: true, 
      data: {
        items: result.items,
        total: result.total,
        pagination: {
          limit: result.limit,
          offset: result.offset,
          total: result.total
        }
      }
    });
  } catch (err) {
    console.error('Controller error in getShops:', err);
    next(err);
  }
}

export async function getShopById(req, res, next) {
  try {
    const { id } = req.params;
    
    console.log('Getting shop by ID:', id);
    
    const shop = await shopsService.getShopById(id);
    
    res.status(200).json({ 
      success: true, 
      data: shop 
    });
  } catch (err) {
    console.error('Controller error in getShopById:', err);
    next(err);
  }
}

export async function createShop(req, res, next) {
  try {
    console.log('Creating shop with data:', req.body);
    
    const shop = await shopsService.createShop(req.body);
    
    res.status(201).json({ 
      success: true, 
      data: shop 
    });
  } catch (err) {
    console.error('Controller error in createShop:', err);
    next(err);
  }
}

export async function updateShop(req, res, next) {
  try {
    const { id } = req.params;
    
    console.log('Updating shop:', id, 'with data:', req.body);
    
    const shop = await shopsService.updateShop(id, req.body);
    
    res.status(200).json({ 
      success: true, 
      data: shop 
    });
  } catch (err) {
    console.error('Controller error in updateShop:', err);
    next(err);
  }
}

export async function deleteShop(req, res, next) {
  try {
    const { id } = req.params;
    
    console.log('Deleting shop:', id);
    
    const result = await shopsService.deleteShop(id);
    
    res.status(200).json({ 
      success: true, 
      data: result 
    });
  } catch (err) {
    console.error('Controller error in deleteShop:', err);
    next(err);
  }
}