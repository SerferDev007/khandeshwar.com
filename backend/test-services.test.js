/**
 * Test the core business logic without requiring a database
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database query function
vi.mock('../src/config/db.js', () => ({
  query: vi.fn(),
}));

describe('Shops Service Tests', () => {
  let mockQuery;
  
  beforeEach(() => {
    const { query } = await import('../src/config/db.js');
    mockQuery = query;
    vi.clearAllMocks();
  });

  it('should return shops with proper pagination', async () => {
    // Mock data
    const mockShops = [
      { id: '1', shop_number: 'S001', size: 100, monthly_rent: 5000, status: 'Vacant' },
      { id: '2', shop_number: 'S002', size: 150, monthly_rent: 7500, status: 'Occupied' }
    ];
    
    // Mock query responses
    mockQuery
      .mockResolvedValueOnce(mockShops) // listShops call
      .mockResolvedValueOnce([{ cnt: 2 }]); // countShops call
    
    const { getShops } = await import('../src/services/shopsService.js');
    
    const result = await getShops({ limit: 10, offset: 0 });
    
    expect(result).toEqual({
      items: mockShops,
      total: 2,
      limit: 10,
      offset: 0
    });
    
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  it('should validate limit parameter bounds', async () => {
    mockQuery
      .mockResolvedValueOnce([]) // listShops call
      .mockResolvedValueOnce([{ cnt: 0 }]); // countShops call
    
    const { getShops } = await import('../src/services/shopsService.js');
    
    // Test limit too high
    const result1 = await getShops({ limit: 300 });
    expect(result1.limit).toBe(200); // Should cap at 200
    
    // Test limit too low
    const result2 = await getShops({ limit: 0 });
    expect(result2.limit).toBe(1); // Should set to minimum 1
  });

  it('should throw error for shop not found', async () => {
    mockQuery.mockResolvedValueOnce([]); // No shop found
    
    const { getShopById } = await import('../src/services/shopsService.js');
    
    await expect(getShopById('nonexistent')).rejects.toThrow('Shop not found');
  });
});

describe('Agreements Service Tests', () => {
  let mockQuery;
  
  beforeEach(() => {
    const { query } = await import('../src/config/db.js');
    mockQuery = query;
    vi.clearAllMocks();
  });

  it('should return agreements with proper join data', async () => {
    const mockAgreements = [
      { 
        id: '1', 
        tenant_id: 't1', 
        shop_id: 's1', 
        monthly_rent: 5000, 
        status: 'Active',
        tenant_name: 'John Doe',
        shop_name: 'S001'
      }
    ];
    
    mockQuery
      .mockResolvedValueOnce(mockAgreements) // listAgreements call
      .mockResolvedValueOnce([{ cnt: 1 }]); // countAgreements call
    
    const { getAgreements } = await import('../src/services/rentAgreementsService.js');
    
    const result = await getAgreements({ limit: 10, offset: 0 });
    
    expect(result).toEqual({
      items: mockAgreements,
      total: 1,
      limit: 10,
      offset: 0
    });
    
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  it('should validate required fields for creating agreement', async () => {
    const { createAgreement } = await import('../src/services/rentAgreementsService.js');
    
    await expect(createAgreement({})).rejects.toThrow('Missing required fields');
    await expect(createAgreement({ tenant_id: 't1' })).rejects.toThrow('Missing required fields');
  });
});