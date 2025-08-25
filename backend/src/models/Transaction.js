export class Transaction {
  constructor(data = {}) {
    this.id = data.id;
    this.date = data.date;
    this.type = data.type; // 'Donation' | 'Expense' | 'Utilities' | 'Salary' | 'RentIncome'
    this.category = data.category;
    this.subCategory = data.subCategory;
    this.description = data.description;
    this.amount = data.amount;
    this.receiptNumber = data.receiptNumber;
    this.donorName = data.donorName;
    this.donorContact = data.donorContact;
    this.familyMembers = data.familyMembers;
    this.amountPerPerson = data.amountPerPerson;
    this.vendor = data.vendor;
    this.receipt = data.receipt;
    this.tenantName = data.tenantName;
    this.tenantContact = data.tenantContact;
    this.agreementId = data.agreementId;
    this.shopNumber = data.shopNumber;
    this.payeeName = data.payeeName;
    this.payeeContact = data.payeeContact;
    this.loanId = data.loanId;
    this.emiAmount = data.emiAmount;
    this.penaltyId = data.penaltyId;
    this.penaltyAmount = data.penaltyAmount;
    this.createdAt = data.createdAt;
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
      penaltyAmount: row.penalty_amount ? parseFloat(row.penalty_amount) : null,
      createdAt: row.created_at
    });
  }

  toDbObject() {
    const obj = {};
    
    // Always include required fields
    if (this.id !== undefined) obj.id = this.id;
    if (this.date !== undefined) obj.date = this.date;
    if (this.type !== undefined) obj.type = this.type;
    if (this.category !== undefined) obj.category = this.category;
    if (this.description !== undefined) obj.description = this.description;
    if (this.amount !== undefined) obj.amount = this.amount;
    
    // Optional fields - only include if they have values
    if (this.subCategory !== undefined && this.subCategory !== null) obj.sub_category = this.subCategory;
    if (this.receiptNumber !== undefined && this.receiptNumber !== null) obj.receipt_number = this.receiptNumber;
    if (this.donorName !== undefined && this.donorName !== null) obj.donor_name = this.donorName;
    if (this.donorContact !== undefined && this.donorContact !== null && this.donorContact !== '') obj.donor_contact = this.donorContact;
    if (this.familyMembers !== undefined && this.familyMembers !== null) obj.family_members = this.familyMembers;
    if (this.amountPerPerson !== undefined && this.amountPerPerson !== null) obj.amount_per_person = this.amountPerPerson;
    if (this.vendor !== undefined && this.vendor !== null) obj.vendor = this.vendor;
    if (this.receipt !== undefined && this.receipt !== null) obj.receipt = this.receipt;
    if (this.tenantName !== undefined && this.tenantName !== null) obj.tenant_name = this.tenantName;
    if (this.tenantContact !== undefined && this.tenantContact !== null) obj.tenant_contact = this.tenantContact;
    if (this.agreementId !== undefined && this.agreementId !== null) obj.agreement_id = this.agreementId;
    if (this.shopNumber !== undefined && this.shopNumber !== null) obj.shop_number = this.shopNumber;
    if (this.payeeName !== undefined && this.payeeName !== null) obj.payee_name = this.payeeName;
    if (this.payeeContact !== undefined && this.payeeContact !== null) obj.payee_contact = this.payeeContact;
    if (this.loanId !== undefined && this.loanId !== null) obj.loan_id = this.loanId;
    if (this.emiAmount !== undefined && this.emiAmount !== null) obj.emi_amount = this.emiAmount;
    if (this.penaltyId !== undefined && this.penaltyId !== null) obj.penalty_id = this.penaltyId;
    if (this.penaltyAmount !== undefined && this.penaltyAmount !== null) obj.penalty_amount = this.penaltyAmount;
    
    // Don't include created_at - let database handle it with DEFAULT CURRENT_TIMESTAMP
    
    return obj;
  }
}