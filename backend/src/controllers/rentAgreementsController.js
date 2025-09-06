import * as agreementsService from '../services/rentAgreementsService.js';

/**
 * Controller for rent agreements API endpoints
 */

export async function getAgreements(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;
    const status = req.query.status || null;
    
    console.log('Getting agreements with params:', { limit, offset, status });
    
    const result = await agreementsService.getAgreements({ limit, offset, status });
    
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
    console.error('Controller error in getAgreements:', err);
    next(err);
  }
}

export async function getAgreementById(req, res, next) {
  try {
    const { id } = req.params;
    
    console.log('Getting agreement by ID:', id);
    
    const agreement = await agreementsService.getAgreementById(id);
    
    res.status(200).json({ 
      success: true, 
      data: agreement 
    });
  } catch (err) {
    console.error('Controller error in getAgreementById:', err);
    next(err);
  }
}

export async function createAgreement(req, res, next) {
  try {
    console.log('Creating agreement with data:', req.body);
    
    const agreement = await agreementsService.createAgreement(req.body);
    
    res.status(201).json({ 
      success: true, 
      data: agreement 
    });
  } catch (err) {
    console.error('Controller error in createAgreement:', err);
    next(err);
  }
}

export async function updateAgreement(req, res, next) {
  try {
    const { id } = req.params;
    
    console.log('Updating agreement:', id, 'with data:', req.body);
    
    const agreement = await agreementsService.updateAgreement(id, req.body);
    
    res.status(200).json({ 
      success: true, 
      data: agreement 
    });
  } catch (err) {
    console.error('Controller error in updateAgreement:', err);
    next(err);
  }
}

export async function deleteAgreement(req, res, next) {
  try {
    const { id } = req.params;
    
    console.log('Deleting agreement:', id);
    
    const result = await agreementsService.deleteAgreement(id);
    
    res.status(200).json({ 
      success: true, 
      data: result 
    });
  } catch (err) {
    console.error('Controller error in deleteAgreement:', err);
    next(err);
  }
}