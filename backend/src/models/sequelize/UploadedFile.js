import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';

const UploadedFile = sequelize.define('UploadedFile', {
  id: {
    type: DataTypes.STRING(36),
    primaryKey: true,
    allowNull: false,
  },
  filename: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  original_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  file_path: {
    type: DataTypes.STRING(500),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  file_size: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  mime_type: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  uploaded_by: {
    type: DataTypes.STRING(36),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  tenant_id: {
    type: DataTypes.STRING(36),
    allowNull: true,
    references: {
      model: 'tenants',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  agreement_id: {
    type: DataTypes.STRING(36),
    allowNull: true,
    references: {
      model: 'agreements',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  file_type: {
    type: DataTypes.ENUM('document', 'image', 'pdf', 'other'),
    allowNull: false,
    defaultValue: 'document'
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
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
  tableName: 'uploaded_files',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['tenant_id']
    },
    {
      fields: ['agreement_id']
    },
    {
      fields: ['uploaded_by']
    },
    {
      fields: ['file_type']
    },
    {
      fields: ['category']
    },
    {
      fields: ['is_active']
    }
  ]
});

export default UploadedFile;