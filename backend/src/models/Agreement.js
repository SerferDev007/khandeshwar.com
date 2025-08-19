export class Agreement {
  constructor(data = {}) {
    this.id = data.id;
    this.shopId = data.shopId;
    this.tenantId = data.tenantId;
    this.agreementDate = data.agreementDate;
    this.duration = data.duration;
    this.monthlyRent = data.monthlyRent;
    this.securityDeposit = data.securityDeposit;
    this.advanceRent = data.advanceRent;
    this.agreementType = data.agreementType; // 'Residential' | 'Commercial'
    this.status = data.status; // 'Active' | 'Expired' | 'Terminated'
    this.nextDueDate = data.nextDueDate;
    this.lastPaymentDate = data.lastPaymentDate;
    this.hasActiveLoan = data.hasActiveLoan;
    this.activeLoanId = data.activeLoanId;
    this.pendingPenalties = data.pendingPenalties; // JSON array of penalty IDs
    this.createdAt = data.createdAt;
  }

  static getTableSchema() {
    return `
      CREATE TABLE IF NOT EXISTS agreements (
        id VARCHAR(36) PRIMARY KEY,
        shop_id VARCHAR(36) NOT NULL,
        tenant_id VARCHAR(36) NOT NULL,
        agreement_date DATE NOT NULL,
        duration INT NOT NULL,
        monthly_rent DECIMAL(10,2) NOT NULL,
        security_deposit DECIMAL(10,2) NOT NULL,
        advance_rent DECIMAL(10,2) NOT NULL,
        agreement_type ENUM('Residential', 'Commercial') NOT NULL,
        status ENUM('Active', 'Expired', 'Terminated') NOT NULL DEFAULT 'Active',
        next_due_date DATE NOT NULL,
        last_payment_date DATE NULL,
        has_active_loan BOOLEAN DEFAULT FALSE,
        active_loan_id VARCHAR(36) NULL,
        pending_penalties JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_shop (shop_id),
        INDEX idx_tenant (tenant_id),
        INDEX idx_status (status),
        INDEX idx_next_due_date (next_due_date),
        INDEX idx_agreement_type (agreement_type),
        FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `;
  }

  static fromDbRow(row) {
    return new Agreement({
      id: row.id,
      shopId: row.shop_id,
      tenantId: row.tenant_id,
      agreementDate: row.agreement_date,
      duration: row.duration,
      monthlyRent: parseFloat(row.monthly_rent),
      securityDeposit: parseFloat(row.security_deposit),
      advanceRent: parseFloat(row.advance_rent),
      agreementType: row.agreement_type,
      status: row.status,
      nextDueDate: row.next_due_date,
      lastPaymentDate: row.last_payment_date,
      hasActiveLoan: row.has_active_loan,
      activeLoanId: row.active_loan_id,
      pendingPenalties: row.pending_penalties ? JSON.parse(row.pending_penalties) : [],
      createdAt: row.created_at
    });
  }

  toDbObject() {
    return {
      id: this.id,
      shop_id: this.shopId,
      tenant_id: this.tenantId,
      agreement_date: this.agreementDate,
      duration: this.duration,
      monthly_rent: this.monthlyRent,
      security_deposit: this.securityDeposit,
      advance_rent: this.advanceRent,
      agreement_type: this.agreementType,
      status: this.status,
      next_due_date: this.nextDueDate,
      last_payment_date: this.lastPaymentDate,
      has_active_loan: this.hasActiveLoan,
      active_loan_id: this.activeLoanId,
      pending_penalties: this.pendingPenalties ? JSON.stringify(this.pendingPenalties) : null,
      created_at: this.createdAt
    };
  }
}