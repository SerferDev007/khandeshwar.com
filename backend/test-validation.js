import { z } from 'zod';

// Validation schemas using Zod (from expenses.js)
const expenseCreateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  category: z.string().min(1, 'Category is required'),
  subCategory: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be positive'),
  payeeName: z.string().min(1, 'Payee name is required'),
  payeeContact: z.string().regex(/^\d{10}$/, 'Contact must be 10 digits').optional().or(z.literal('')),
  receiptImages: z.array(z.string()).optional(),
});

console.log('Testing expense payload validation...\n');

// Test 1: Valid payload with receiptImages as base64 strings
const validPayload = {
  date: '2024-01-01',
  category: 'Utsav',
  subCategory: 'Ganesh Utsav',
  description: 'Festival expenses',
  amount: 500,
  payeeName: 'Test Vendor',
  payeeContact: '1234567890',
  receiptImages: ['data:image/jpeg;base64,iVBORw0KGgoA...', 'data:image/png;base64,iVBORw0KGgoB...']
};

console.log('Test 1: Valid payload with base64 strings');
try {
  const result = expenseCreateSchema.parse(validPayload);
  console.log('✅ Validation passed');
  console.log('receiptImages type:', typeof result.receiptImages);
  console.log('receiptImages length:', result.receiptImages?.length);
} catch (error) {
  console.log('❌ Validation failed:', error.errors);
}

// Test 2: Invalid payload with file objects (what was causing 500 error)
const invalidPayload = {
  date: '2024-01-01',
  category: 'Utsav',
  subCategory: 'Ganesh Utsav', 
  description: 'Festival expenses',
  amount: 500,
  payeeName: 'Test Vendor',
  payeeContact: '1234567890',
  receiptImages: [
    { id: '1', name: 'receipt1.jpg', base64: 'data:image/jpeg;base64,iVBORw0KGgoA...', size: 1024 },
    { id: '2', name: 'receipt2.png', base64: 'data:image/png;base64,iVBORw0KGgoB...', size: 2048 }
  ]
};

console.log('\nTest 2: Invalid payload with file objects');
try {
  const result = expenseCreateSchema.parse(invalidPayload);
  console.log('✅ Validation passed (unexpected)');
} catch (error) {
  console.log('❌ Validation failed (expected):', error.errors);
}

// Test 3: Valid payload without receiptImages
const validPayloadNoImages = {
  date: '2024-01-01',
  category: 'Utsav',
  subCategory: 'Ganesh Utsav',
  description: 'Festival expenses',
  amount: 500,
  payeeName: 'Test Vendor',
  payeeContact: '1234567890'
};

console.log('\nTest 3: Valid payload without receiptImages');
try {
  const result = expenseCreateSchema.parse(validPayloadNoImages);
  console.log('✅ Validation passed');
} catch (error) {
  console.log('❌ Validation failed:', error.errors);
}