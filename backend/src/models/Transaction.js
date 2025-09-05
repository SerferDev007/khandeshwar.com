export class Transaction {
  constructor(data = {}) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [TRANSACTION-MODEL] [constructor] 💰 Creating new Transaction instance:`, { 
      hasData: !!data,
      dataKeys: Object.keys(data || {}),
      id: data?.id,
      type: data?.type,
      amount: data?.amount
    });

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

    console.log(`[${timestamp}] [TRANSACTION-MODEL] [constructor] ✅ Transaction instance created:`, { 
      id: this.id,
      type: this.type,
      category: this.category,
      amount: this.amount,
      hasRequiredFields: !!(this.id && this.date && this.type && this.category && this.description && this.amount)
    });
  }

  static getTableSchema() {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [TRANSACTION-MODEL] [getTableSchema] 📋 Generating table schema`);
    
    const schema = `
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

    console.log(`[${timestamp}] [TRANSACTION-MODEL] [getTableSchema] ✅ Table schema generated:`, { 
      schemaLength: schema.length,
      tableName: 'transactions',
      hasIndexes: true,
      hasForeignKeys: true,
      supportedTypes: ['Donation', 'Expense', 'Utilities', 'Salary', 'RentIncome']
    });

    return schema;
  }

  static fromDbRow(row) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [TRANSACTION-MODEL] [fromDbRow] 🔄 Converting database row to Transaction instance:`, { 
      hasRow: !!row,
      rowKeys: row ? Object.keys(row) : [],
      transactionId: row?.id,
      type: row?.type,
      amount: row?.amount
    });

    const transaction = new Transaction({
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

    console.log(`[${timestamp}] [TRANSACTION-MODEL] [fromDbRow] ✅ Database row converted:`, { 
      transactionId: transaction.id,
      type: transaction.type,
      category: transaction.category,
      amount: transaction.amount,
      numericFieldsParsed: {
        amount: transaction.amount,
        amountPerPerson: transaction.amountPerPerson,
        emiAmount: transaction.emiAmount,
        penaltyAmount: transaction.penaltyAmount
      }
    });

    return transaction;
  }

  toDbObject() {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [TRANSACTION-MODEL] [toDbObject] 🔄 Converting Transaction instance to database object:`, { 
      transactionId: this.id,
      type: this.type,
      category: this.category,
      amount: this.amount
    });

    const obj = {};
    
    // Always include required fields
    if (this.id !== undefined) obj.id = this.id;
    if (this.date !== undefined) obj.date = this.date;
    if (this.type !== undefined) obj.type = this.type;
    if (this.category !== undefined) obj.category = this.category;
    if (this.description !== undefined) obj.description = this.description;
    if (this.amount !== undefined) obj.amount = this.amount;
    
    console.log(`[${timestamp}] [TRANSACTION-MODEL] [toDbObject] 📋 Required fields processed:`, { 
      hasRequiredFields: {
        id: !!obj.id,
        date: !!obj.date,
        type: !!obj.type,
        category: !!obj.category,
        description: !!obj.description,
        amount: !!obj.amount
      }
    });
    
    // Optional fields - only include if they have values
    const optionalFieldMappings = [
      { prop: 'subCategory', db: 'sub_category' },
      { prop: 'receiptNumber', db: 'receipt_number' },
      { prop: 'donorName', db: 'donor_name' },
      { prop: 'donorContact', db: 'donor_contact' },
      { prop: 'familyMembers', db: 'family_members' },
      { prop: 'amountPerPerson', db: 'amount_per_person' },
      { prop: 'vendor', db: 'vendor' },
      { prop: 'receipt', db: 'receipt' },
      { prop: 'tenantName', db: 'tenant_name' },
      { prop: 'tenantContact', db: 'tenant_contact' },
      { prop: 'agreementId', db: 'agreement_id' },
      { prop: 'shopNumber', db: 'shop_number' },
      { prop: 'payeeName', db: 'payee_name' },
      { prop: 'payeeContact', db: 'payee_contact' },
      { prop: 'loanId', db: 'loan_id' },
      { prop: 'emiAmount', db: 'emi_amount' },
      { prop: 'penaltyId', db: 'penalty_id' },
      { prop: 'penaltyAmount', db: 'penalty_amount' }
    ];

    const includedOptionalFields = [];
    const skippedOptionalFields = [];

    optionalFieldMappings.forEach(({ prop, db }) => {
      const value = this[prop];
      if (value !== undefined && value !== null && value !== '') {
        obj[db] = value;
        includedOptionalFields.push({ prop, db, hasValue: true });
      } else {
        skippedOptionalFields.push({ prop, db, value });
      }
    });

    console.log(`[${timestamp}] [TRANSACTION-MODEL] [toDbObject] 📊 Optional fields processed:`, { 
      includedCount: includedOptionalFields.length,
      skippedCount: skippedOptionalFields.length,
      includedFields: includedOptionalFields.map(f => f.prop),
      totalFields: Object.keys(obj).length
    });
    
    // Don't include created_at - let database handle it with DEFAULT CURRENT_TIMESTAMP
    
    console.log(`[${timestamp}] [TRANSACTION-MODEL] [toDbObject] ✅ Database object created:`, { 
      objectKeys: Object.keys(obj),
      totalFields: Object.keys(obj).length,
      hasAllRequired: !!(obj.id && obj.date && obj.type && obj.category && obj.description && obj.amount)
    });

    return obj;
  }
}