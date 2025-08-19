export class Tenant {
  constructor(data = {}) {
    this.id = data.id;
    this.name = data.name;
    this.phone = data.phone;
    this.email = data.email;
    this.address = data.address;
    this.businessType = data.businessType;
    this.createdAt = data.createdAt;
    this.status = data.status; // 'Active' | 'Inactive'
    this.idProof = data.idProof;
  }

  static getTableSchema() {
    return `
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
      ) ENGINE=InnoDB;
    `;
  }

  static fromDbRow(row) {
    return new Tenant({
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      address: row.address,
      businessType: row.business_type,
      createdAt: row.created_at,
      status: row.status,
      idProof: row.id_proof
    });
  }

  toDbObject() {
    return {
      id: this.id,
      name: this.name,
      phone: this.phone,
      email: this.email,
      address: this.address,
      business_type: this.businessType,
      created_at: this.createdAt,
      status: this.status,
      id_proof: this.idProof
    };
  }
}