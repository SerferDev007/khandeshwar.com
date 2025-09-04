import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';

const Agreement = sequelize.define('Agreement', {
  id: {
    type: DataTypes.STRING(36),
    primaryKey: true,
    allowNull: false,
  },
  shop_id: {
    type: DataTypes.STRING(36),
    allowNull: false,
    references: {
      model: 'shops',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  tenant_id: {
    type: DataTypes.STRING(36),
    allowNull: false,
    references: {
      model: 'tenants',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  agreement_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: true
    }
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 1000
    }
  },
  monthly_rent: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  security_deposit: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  advance_rent: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  agreement_type: {
    type: DataTypes.ENUM('Residential', 'Commercial'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Active', 'Expired', 'Terminated'),
    allowNull: false,
    defaultValue: 'Active'
  },
  next_due_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: true
    }
  },
  last_payment_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    validate: {
      isDate: true
    }
  },
  has_active_loan: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  active_loan_id: {
    type: DataTypes.STRING(36),
    allowNull: true
  },
  pending_penalties: {
    type: DataTypes.JSON,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'agreements',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['shop_id']
    },
    {
      fields: ['tenant_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['next_due_date']
    },
    {
      fields: ['agreement_type']
    }
  ]
});

export default Agreement;