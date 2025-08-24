export class Transaction {
  constructor(data = {}) {
    this.id = data.id;
    this.date = data.date;
    this.type = data.type; // 'Donation' | 'Expense' | 'Utilities' | 'Salary' | 'RentIncome'
    this.category = data.category;
    this.subCategory = data.subCategory || data.sub_category;
    this.description = data.description;
    this.amount = data.amount;
    this.receiptNumber = data.receiptNumber || data.receipt_number;
    this.donorName = data.donorName || data.donor_name;
    this.donorContact = data.donorContact || data.donor_contact;
    this.familyMembers = data.familyMembers || data.family_members;
    this.amountPerPerson = data.amountPerPerson || data.amount_per_person;
    this.vendor = data.vendor;
    this.receipt = data.receipt;
    this.tenantName = data.tenantName || data.tenant_name;
    this.tenantContact = data.tenantContact || data.tenant_contact;
    this.agreementId = data.agreementId || data.agreement_id;
    this.shopNumber = data.shopNumber || data.shop_number;
    this.payeeName = data.payeeName || data.payee_name;
    this.payeeContact = data.payeeContact || data.payee_contact;
    this.loanId = data.loanId || data.loan_id;
    this.emiAmount = data.emiAmount || data.emi_amount;
    this.penaltyId = data.penaltyId || data.penalty_id;
    this.penaltyAmount = data.penaltyAmount || data.penalty_amount;
  }

  static getTableSchema() {
    return `
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(36) PRIMARY KEY,
        date DATE NOT NULL,
        type ENUM('Donation', 'Expense', 'Utilities', 'Salary', 'RentIncome') NOT NULL,
        category VARCHAR(100) NOT NULL,
        sub_category VARCHAR(100) NULL,
        description TEXT NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        receipt_number VARCHAR(50) NULL,
        donor_name VARCHAR(100) NULL,
        donor_contact VARCHAR(20) NULL,
        family_members INT NULL,
        amount_per_person DECIMAL(10,2) NULL,
        vendor VARCHAR(100) NULL,
        receipt VARCHAR(255) NULL,
        tenant_name VARCHAR(100) NULL,
        tenant_contact VARCHAR(20) NULL,
        agreement_id VARCHAR(36) NULL,
        shop_number VARCHAR(20) NULL,
        payee_name VARCHAR(100) NULL,
        payee_contact VARCHAR(20) NULL,
        loan_id VARCHAR(36) NULL,
        emi_amount DECIMAL(10,2) NULL,
        penalty_id VARCHAR(36) NULL,
        penalty_amount DECIMAL(10,2) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_date (date),
        INDEX idx_type (type),
        INDEX idx_category (category),
        INDEX idx_receipt_number (receipt_number),
        INDEX idx_agreement (agreement_id),
        INDEX idx_loan (loan_id),
        INDEX idx_penalty (penalty_id),
        FOREIGN KEY (agreement_id) REFERENCES agreements(id) ON DELETE SET NULL,
        FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE SET NULL,
        FOREIGN KEY (penalty_id) REFERENCES rent_penalties(id) ON DELETE SET NULL
      ) ENGINE=InnoDB;
    `;
  }

  static fromDbRow(row) {
    return new Transaction({
      id: row.id,
      date: row.date,
      type: row.type,
      category: row.category,
      subCategory: row.sub_category,
      description: row.description,
      amount: parseFloat(row.amount),
      receiptNumber: row.receipt_number,
      donorName: row.donor_name,
      donorContact: row.donor_contact,
      familyMembers: row.family_members,
      amountPerPerson: row.amount_per_person ? parseFloat(row.amount_per_person) : null,
      vendor: row.vendor,
      receipt: row.receipt,
      tenantName: row.tenant_name,
      tenantContact: row.tenant_contact,
      agreementId: row.agreement_id,
      shopNumber: row.shop_number,
      payeeName: row.payee_name,
      payeeContact: row.payee_contact,
      loanId: row.loan_id,
      emiAmount: row.emi_amount ? parseFloat(row.emi_amount) : null,
      penaltyId: row.penalty_id,
      penaltyAmount: row.penalty_amount ? parseFloat(row.penalty_amount) : null
    });
  }

  toDbObject() {
    return {
      id: this.id,
      date: this.date,
      type: this.type,
      category: this.category,
      sub_category: this.subCategory,
      description: this.description,
      amount: this.amount,
      receipt_number: this.receiptNumber,
      donor_name: this.donorName,
      donor_contact: this.donorContact,
      family_members: this.familyMembers,
      amount_per_person: this.amountPerPerson,
      vendor: this.vendor,
      receipt: this.receipt,
      tenant_name: this.tenantName,
      tenant_contact: this.tenantContact,
      agreement_id: this.agreementId,
      shop_number: this.shopNumber,
      payee_name: this.payeeName,
      payee_contact: this.payeeContact,
      loan_id: this.loanId,
      emi_amount: this.emiAmount,
      penalty_id: this.penaltyId,
      penalty_amount: this.penaltyAmount,
      created_at: this.createdAt
    };
  }
}