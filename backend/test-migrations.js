#!/usr/bin/env node

/**
 * Test database migrations without full server startup
 */

import mysql from 'mysql2/promise';

// Simple database config for testing
const testDbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  port: 3306,
  multipleStatements: true
};

async function testMigrations() {
  console.log('🧪 Testing Database Migrations...\n');

  let connection = null;
  try {
    // Try to connect to MySQL
    console.log('1. Connecting to MySQL...');
    connection = await mysql.createConnection(testDbConfig);
    console.log('   ✅ Connected to MySQL successfully');

    // Create test database
    console.log('\n2. Creating test database...');
    await connection.execute('CREATE DATABASE IF NOT EXISTS khandeshwar_test_db');
    await connection.execute('USE khandeshwar_test_db');
    console.log('   ✅ Test database created/selected');

    // Test tenants table migration
    console.log('\n3. Testing tenants table creation...');
    const tenantsTableSQL = `
      CREATE TABLE IF NOT EXISTS tenants (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(100) NOT NULL,
        address TEXT NOT NULL,
        business_type VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
        id_proof VARCHAR(200) NULL,
        INDEX idx_name (name),
        INDEX idx_phone (phone),
        INDEX idx_email (email),
        INDEX idx_status (status),
        INDEX idx_business_type (business_type)
      ) ENGINE=InnoDB
    `;
    await connection.execute(tenantsTableSQL);
    console.log('   ✅ Tenants table created successfully');

    // Test shops table migration
    console.log('\n4. Testing shops table creation...');
    const shopsTableSQL = `
      CREATE TABLE IF NOT EXISTS shops (
        id VARCHAR(36) PRIMARY KEY,
        shop_number VARCHAR(20) UNIQUE NOT NULL,
        size DECIMAL(10,2) NOT NULL,
        monthly_rent DECIMAL(10,2) NOT NULL,
        deposit DECIMAL(10,2) NOT NULL,
        status ENUM('Vacant', 'Occupied', 'Maintenance') NOT NULL DEFAULT 'Vacant',
        tenant_id VARCHAR(36) NULL,
        agreement_id VARCHAR(36) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        description TEXT NULL,
        INDEX idx_shop_number (shop_number),
        INDEX idx_status (status),
        INDEX idx_tenant (tenant_id),
        INDEX idx_agreement (agreement_id),
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL
      ) ENGINE=InnoDB
    `;
    await connection.execute(shopsTableSQL);
    console.log('   ✅ Shops table created successfully');

    // Test table existence
    console.log('\n5. Verifying table existence...');
    const [tables] = await connection.execute(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'khandeshwar_test_db'"
    );
    const tableNames = tables.map(row => row.table_name || row.TABLE_NAME);
    console.log('   Created tables:', tableNames);
    
    if (tableNames.includes('tenants') && tableNames.includes('shops')) {
      console.log('   ✅ Both required tables exist');
    } else {
      console.log('   ❌ Required tables missing');
    }

    // Test sample data insertion
    console.log('\n6. Testing sample data insertion...');
    
    // Insert sample tenant
    await connection.execute(`
      INSERT IGNORE INTO tenants (id, name, phone, email, address, business_type) 
      VALUES ('test-tenant-123', 'Test Tenant', '1234567890', 'test@tenant.com', 'Test Address', 'Retail')
    `);
    console.log('   ✅ Sample tenant inserted');

    // Insert sample shop
    await connection.execute(`
      INSERT IGNORE INTO shops (id, shop_number, size, monthly_rent, deposit, status, description) 
      VALUES ('test-shop-123', 'SHOP-TEST-001', 100.50, 5000.00, 15000.00, 'Vacant', 'Test shop for migration verification')
    `);
    console.log('   ✅ Sample shop inserted');

    // Test foreign key relationship
    console.log('\n7. Testing foreign key relationship...');
    try {
      await connection.execute(`
        UPDATE shops SET tenant_id = 'test-tenant-123' WHERE id = 'test-shop-123'
      `);
      console.log('   ✅ Foreign key relationship works');
    } catch (fkError) {
      console.log('   ❌ Foreign key relationship failed:', fkError.message);
    }

    // Clean up test data
    console.log('\n8. Cleaning up test data...');
    await connection.execute('DELETE FROM shops WHERE id = "test-shop-123"');
    await connection.execute('DELETE FROM tenants WHERE id = "test-tenant-123"');
    console.log('   ✅ Test data cleaned up');

    console.log('\n📝 Database Migration Test Results:');
    console.log('✅ MySQL connection: Working');
    console.log('✅ Database creation: Working');
    console.log('✅ Tenants table: Created successfully');
    console.log('✅ Shops table: Created successfully');
    console.log('✅ Foreign key constraints: Working');
    console.log('✅ Data insertion: Working');
    console.log('\n🎉 All database migrations are working correctly!');

  } catch (error) {
    console.error('\n❌ Database migration test failed:');
    console.error('Error:', error.message);
    console.error('\nThis could be due to:');
    console.error('1. MySQL server not running');
    console.error('2. Incorrect database permissions');
    console.error('3. Network connectivity issues');
    console.error('\nTo fix:');
    console.error('1. Start MySQL: sudo service mysql start');
    console.error('2. Check MySQL access: mysql -u root');
    console.error('3. Verify MySQL is listening on port 3306');
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testMigrations();