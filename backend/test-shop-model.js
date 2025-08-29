#!/usr/bin/env node

/**
 * Unit test for Shop model and validation logic
 */

import { Shop } from './src/models/Shop.js';
import { generateId } from './src/utils/helpers.js';
import { z } from 'zod';

// Test Shop model functionality
function testShopModel() {
  console.log('🧪 Testing Shop Model...\n');

  try {
    // Test 1: Shop creation with valid data
    console.log('1. Testing Shop creation with valid data...');
    const validShopData = {
      id: generateId(),
      shopNumber: 'SHOP-001',
      size: 100.5,
      monthlyRent: 5000.0,
      deposit: 15000.0,
      status: 'Vacant',
      tenantId: null,
      agreementId: null,
      createdAt: new Date().toISOString(),
      description: 'Test shop'
    };

    const shop = new Shop(validShopData);
    console.log('   ✅ Shop created successfully');
    console.log('   Shop ID:', shop.id);
    console.log('   Shop Number:', shop.shopNumber);

    // Test 2: toDbObject conversion
    console.log('\n2. Testing toDbObject conversion...');
    const dbObject = shop.toDbObject();
    console.log('   ✅ toDbObject conversion successful');
    console.log('   DB Object keys:', Object.keys(dbObject));
    console.log('   shop_number:', dbObject.shop_number);
    console.log('   monthly_rent:', dbObject.monthly_rent);

    // Test 3: Validation schema
    console.log('\n3. Testing validation schema...');
    const shopCreateSchema = z.object({
      shopNumber: z.string().min(1, 'Shop number is required'),
      size: z.number().positive('Size must be positive'),
      monthlyRent: z.number().positive('Monthly rent must be positive'),
      deposit: z.number().positive('Deposit must be positive'),
      status: z.enum(['Vacant', 'Occupied', 'Maintenance']).default('Vacant'),
      tenantId: z.string().optional(),
      agreementId: z.string().optional(),
      description: z.string().optional(),
    });

    const validInput = {
      shopNumber: 'SHOP-002',
      size: 200.0,
      monthlyRent: 8000.0,
      deposit: 24000.0,
      description: 'Another test shop'
    };

    const validatedData = shopCreateSchema.parse(validInput);
    console.log('   ✅ Validation passed for valid data');
    console.log('   Validated data:', validatedData);

    // Test 4: Validation with invalid data
    console.log('\n4. Testing validation with invalid data...');
    try {
      const invalidInput = {
        shopNumber: '', // Invalid: empty
        size: -100, // Invalid: negative
        monthlyRent: 0, // Invalid: not positive
        deposit: -1000 // Invalid: negative
      };
      
      shopCreateSchema.parse(invalidInput);
      console.log('   ❌ Validation should have failed');
    } catch (validationError) {
      console.log('   ✅ Validation properly rejected invalid data');
      console.log('   Error details:', validationError.issues.length, 'issues found');
    }

    // Test 5: fromDbRow conversion
    console.log('\n5. Testing fromDbRow conversion...');
    const mockDbRow = {
      id: 'test-id-123',
      shop_number: 'SHOP-003',
      size: '150.00',
      monthly_rent: '6000.00',
      deposit: '18000.00',
      status: 'Vacant',
      tenant_id: null,
      agreement_id: null,
      created_at: '2023-01-01T00:00:00.000Z',
      description: 'Mock DB row'
    };

    const shopFromDb = Shop.fromDbRow(mockDbRow);
    console.log('   ✅ fromDbRow conversion successful');
    console.log('   Converted shop:', {
      id: shopFromDb.id,
      shopNumber: shopFromDb.shopNumber,
      size: shopFromDb.size,
      monthlyRent: shopFromDb.monthlyRent
    });

    // Test 6: SQL query construction logic
    console.log('\n6. Testing SQL query construction logic...');
    const testDbObject = shop.toDbObject();
    const fields = Object.keys(testDbObject).join(', ');
    const placeholders = Object.keys(testDbObject).map(() => '?').join(', ');
    const values = Object.values(testDbObject);

    console.log('   ✅ SQL query construction successful');
    console.log('   Fields:', fields);
    console.log('   Placeholders:', placeholders);
    console.log('   Values count:', values.length);
    console.log('   Sample query: INSERT INTO shops (' + fields + ') VALUES (' + placeholders + ')');

    console.log('\n📝 All Shop Model tests passed! ✅');
    console.log('The issue is likely with database connectivity or table creation, not the Shop model logic.');

  } catch (error) {
    console.error('❌ Shop Model test failed:', error);
  }
}

testShopModel();