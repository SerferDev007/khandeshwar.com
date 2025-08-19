export class RentPenalty {
  constructor(data = {}) {
    this.id = data.id;
    this.agreementId = data.agreementId;
    this.tenantName = data.tenantName;
    this.rentAmount = data.rentAmount;
    this.dueDate = data.dueDate;
    this.paidDate = data.paidDate;
    this.penaltyRate = data.penaltyRate;
    this.penaltyAmount = data.penaltyAmount;
    this.penaltyPaid = data.penaltyPaid;
    this.penaltyPaidDate = data.penaltyPaidDate;
    this.status = data.status; // 'Pending' | 'Paid'
    this.createdAt = data.createdAt;
  }

  static getTableSchema() {
    return `
      CREATE TABLE IF NOT EXISTS rent_penalties (
        id VARCHAR(36) PRIMARY KEY,
        agreement_id VARCHAR(36) NOT NULL,
        tenant_name VARCHAR(100) NOT NULL,
        rent_amount DECIMAL(10,2) NOT NULL,
        due_date DATE NOT NULL,
        paid_date DATE NULL,
        penalty_rate DECIMAL(5,2) NOT NULL,
        penalty_amount DECIMAL(10,2) NOT NULL,
        penalty_paid BOOLEAN DEFAULT FALSE,
        penalty_paid_date DATE NULL,
        status ENUM('Pending', 'Paid') NOT NULL DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_agreement (agreement_id),
        INDEX idx_status (status),
        INDEX idx_due_date (due_date),
        INDEX idx_penalty_paid (penalty_paid),
        FOREIGN KEY (agreement_id) REFERENCES agreements(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `;
  }

  static fromDbRow(row) {
    return new RentPenalty({
      id: row.id,
      agreementId: row.agreement_id,
      tenantName: row.tenant_name,
      rentAmount: parseFloat(row.rent_amount),
      dueDate: row.due_date,
      paidDate: row.paid_date,
      penaltyRate: parseFloat(row.penalty_rate),
      penaltyAmount: parseFloat(row.penalty_amount),
      penaltyPaid: row.penalty_paid,
      penaltyPaidDate: row.penalty_paid_date,
      status: row.status,
      createdAt: row.created_at
    });
  }

  toDbObject() {
    return {
      id: this.id,
      agreement_id: this.agreementId,
      tenant_name: this.tenantName,
      rent_amount: this.rentAmount,
      due_date: this.dueDate,
      paid_date: this.paidDate,
      penalty_rate: this.penaltyRate,
      penalty_amount: this.penaltyAmount,
      penalty_paid: this.penaltyPaid,
      penalty_paid_date: this.penaltyPaidDate,
      status: this.status,
      created_at: this.createdAt
    };
  }
}