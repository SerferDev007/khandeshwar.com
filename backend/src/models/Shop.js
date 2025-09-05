export class Shop {
  constructor(data = {}) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [SHOP-MODEL] [constructor] 🏪 Creating new Shop instance:`, { 
      hasData: !!data,
      dataKeys: Object.keys(data || {}),
      id: data?.id,
      shopNumber: data?.shopNumber
    });

    this.id = data.id;
    this.shopNumber = data.shopNumber;
    this.size = data.size;
    this.monthlyRent = data.monthlyRent;
    this.deposit = data.deposit;
    this.status = data.status; // 'Vacant' | 'Occupied' | 'Maintenance'
    this.tenantId = data.tenantId;
    this.agreementId = data.agreementId;
    this.createdAt = data.createdAt;
    this.description = data.description;

    console.log(`[${timestamp}] [SHOP-MODEL] [constructor] ✅ Shop instance created:`, { 
      id: this.id,
      shopNumber: this.shopNumber,
      status: this.status,
      hasRequiredFields: !!(this.id && this.shopNumber && this.size && this.monthlyRent && this.deposit)
    });
  }

  static getTableSchema() {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [SHOP-MODEL] [getTableSchema] 📋 Generating table schema`);
    
    const schema = `
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
      ) ENGINE=InnoDB;
    `;

    console.log(`[${timestamp}] [SHOP-MODEL] [getTableSchema] ✅ Table schema generated:`, { 
      schemaLength: schema.length,
      tableName: 'shops',
      hasIndexes: true,
      hasForeignKeys: true
    });

    return schema;
  }

  static fromDbRow(row) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [SHOP-MODEL] [fromDbRow] 🔄 Converting database row to Shop instance:`, { 
      hasRow: !!row,
      rowKeys: row ? Object.keys(row) : [],
      shopId: row?.id,
      shopNumber: row?.shop_number
    });

    const shop = new Shop({
      id: row.id,
      shopNumber: row.shop_number,
      size: parseFloat(row.size),
      monthlyRent: parseFloat(row.monthly_rent),
      deposit: parseFloat(row.deposit),
      status: row.status,
      tenantId: row.tenant_id,
      agreementId: row.agreement_id,
      createdAt: row.created_at,
      description: row.description
    });

    console.log(`[${timestamp}] [SHOP-MODEL] [fromDbRow] ✅ Database row converted:`, { 
      shopId: shop.id,
      shopNumber: shop.shopNumber,
      status: shop.status,
      numericFieldsParsed: {
        size: shop.size,
        monthlyRent: shop.monthlyRent,
        deposit: shop.deposit
      }
    });

    return shop;
  }

  toDbObject() {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [SHOP-MODEL] [toDbObject] 🔄 Converting Shop instance to database object:`, { 
      shopId: this.id,
      shopNumber: this.shopNumber,
      status: this.status
    });

    const dbObject = {
      id: this.id,
      shop_number: this.shopNumber,
      size: this.size,
      monthly_rent: this.monthlyRent,
      deposit: this.deposit,
      status: this.status,
      tenant_id: this.tenantId,
      agreement_id: this.agreementId,
      created_at: this.createdAt,
      description: this.description
    };

    console.log(`[${timestamp}] [SHOP-MODEL] [toDbObject] ✅ Database object created:`, { 
      objectKeys: Object.keys(dbObject),
      hasAllRequired: !!(dbObject.id && dbObject.shop_number && dbObject.size && dbObject.monthly_rent && dbObject.deposit),
      nullableFields: {
        tenant_id: dbObject.tenant_id,
        agreement_id: dbObject.agreement_id,
        description: dbObject.description
      }
    });

    return dbObject;
  }
}