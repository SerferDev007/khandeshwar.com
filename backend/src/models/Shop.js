export class Shop {
  constructor(data = {}) {
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
  }

  static getTableSchema() {
    return `
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
  }

  static fromDbRow(row) {
    return new Shop({
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
  }

  toDbObject() {
    return {
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
  }
}