export class Loan {
  constructor(data = {}) {
    this.id = data.id;
    this.tenantId = data.tenantId;
    this.tenantName = data.tenantName;
    this.agreementId = data.agreementId;
    this.loanAmount = data.loanAmount;
    this.interestRate = data.interestRate;
    this.disbursedDate = data.disbursedDate;
    this.loanDuration = data.loanDuration;
    this.monthlyEmi = data.monthlyEmi;
    this.outstandingBalance = data.outstandingBalance;
    this.totalRepaid = data.totalRepaid;
    this.status = data.status; // 'Active' | 'Completed' | 'Defaulted'
    this.nextEmiDate = data.nextEmiDate;
    this.lastPaymentDate = data.lastPaymentDate;
    this.createdAt = data.createdAt;
  }

  static getTableSchema() {
    return `
      CREATE TABLE IF NOT EXISTS loans (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        tenant_name VARCHAR(100) NOT NULL,
        agreement_id VARCHAR(36) NOT NULL,
        loan_amount DECIMAL(12,2) NOT NULL,
        interest_rate DECIMAL(5,2) NOT NULL,
        disbursed_date DATE NOT NULL,
        loan_duration INT NOT NULL,
        monthly_emi DECIMAL(10,2) NOT NULL,
        outstanding_balance DECIMAL(12,2) NOT NULL,
        total_repaid DECIMAL(12,2) DEFAULT 0.00,
        status ENUM('Active', 'Completed', 'Defaulted') NOT NULL DEFAULT 'Active',
        next_emi_date DATE NOT NULL,
        last_payment_date DATE NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_tenant (tenant_id),
        INDEX idx_agreement (agreement_id),
        INDEX idx_status (status),
        INDEX idx_next_emi_date (next_emi_date),
        INDEX idx_disbursed_date (disbursed_date),
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        FOREIGN KEY (agreement_id) REFERENCES agreements(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `;
  }

  static fromDbRow(row) {
    return new Loan({
      id: row.id,
      tenantId: row.tenant_id,
      tenantName: row.tenant_name,
      agreementId: row.agreement_id,
      loanAmount: parseFloat(row.loan_amount),
      interestRate: parseFloat(row.interest_rate),
      disbursedDate: row.disbursed_date,
      loanDuration: row.loan_duration,
      monthlyEmi: parseFloat(row.monthly_emi),
      outstandingBalance: parseFloat(row.outstanding_balance),
      totalRepaid: parseFloat(row.total_repaid),
      status: row.status,
      nextEmiDate: row.next_emi_date,
      lastPaymentDate: row.last_payment_date,
      createdAt: row.created_at
    });
  }

  toDbObject() {
    return {
      id: this.id,
      tenant_id: this.tenantId,
      tenant_name: this.tenantName,
      agreement_id: this.agreementId,
      loan_amount: this.loanAmount,
      interest_rate: this.interestRate,
      disbursed_date: this.disbursedDate,
      loan_duration: this.loanDuration,
      monthly_emi: this.monthlyEmi,
      outstanding_balance: this.outstandingBalance,
      total_repaid: this.totalRepaid,
      status: this.status,
      next_emi_date: this.nextEmiDate,
      last_payment_date: this.lastPaymentDate,
      created_at: this.createdAt
    };
  }
}