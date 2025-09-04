import sequelize from '../../config/sequelize.js';
import Tenant from './Tenant.js';
import Agreement from './Agreement.js';
import Loan from './Loan.js';
import RentPenalty from './RentPenalty.js';
import UploadedFile from './UploadedFile.js';

// Define associations
// Tenant↔Agreements (1:N)
Tenant.hasMany(Agreement, {
  foreignKey: 'tenant_id',
  as: 'agreements',
  onDelete: 'CASCADE'
});
Agreement.belongsTo(Tenant, {
  foreignKey: 'tenant_id',
  as: 'tenant'
});

// Tenant↔Loans (1:N)
Tenant.hasMany(Loan, {
  foreignKey: 'tenant_id',
  as: 'loans',
  onDelete: 'CASCADE'
});
Loan.belongsTo(Tenant, {
  foreignKey: 'tenant_id',
  as: 'tenant'
});

// Agreement↔Loans (1:N)
Agreement.hasMany(Loan, {
  foreignKey: 'agreement_id',
  as: 'loans',
  onDelete: 'CASCADE'
});
Loan.belongsTo(Agreement, {
  foreignKey: 'agreement_id',
  as: 'agreement'
});

// Tenant↔RentPenalties (1:N)
Tenant.hasMany(RentPenalty, {
  foreignKey: 'tenant_id',
  as: 'rentPenalties',
  onDelete: 'CASCADE'
});
RentPenalty.belongsTo(Tenant, {
  foreignKey: 'tenant_id',
  as: 'tenant'
});

// Agreement↔RentPenalties (1:N)
Agreement.hasMany(RentPenalty, {
  foreignKey: 'agreement_id',
  as: 'rentPenalties',
  onDelete: 'CASCADE'
});
RentPenalty.belongsTo(Agreement, {
  foreignKey: 'agreement_id',
  as: 'agreement'
});

// Tenant↔UploadedFiles (1:N)
Tenant.hasMany(UploadedFile, {
  foreignKey: 'tenant_id',
  as: 'uploadedFiles',
  onDelete: 'SET NULL'
});
UploadedFile.belongsTo(Tenant, {
  foreignKey: 'tenant_id',
  as: 'tenant'
});

// Agreement↔UploadedFiles (1:N)
Agreement.hasMany(UploadedFile, {
  foreignKey: 'agreement_id',
  as: 'uploadedFiles',
  onDelete: 'SET NULL'
});
UploadedFile.belongsTo(Agreement, {
  foreignKey: 'agreement_id',
  as: 'agreement'
});

export {
  sequelize,
  Tenant,
  Agreement,
  Loan,
  RentPenalty,
  UploadedFile
};

export default {
  sequelize,
  Tenant,
  Agreement,
  Loan,
  RentPenalty,
  UploadedFile
};