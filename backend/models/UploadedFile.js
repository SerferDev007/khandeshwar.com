export class UploadedFile {
  constructor(data = {}) {
    this.id = data.id;
    this.name = data.name;
    this.size = data.size;
    this.type = data.type;
    this.base64 = data.base64;
    this.uploadedAt = data.uploadedAt;
    this.compressedSize = data.compressedSize;
    this.entityType = data.entityType; // 'agreement', 'loan', 'transaction'
    this.entityId = data.entityId;
  }

  static getTableSchema() {
    return `
      CREATE TABLE IF NOT EXISTS uploaded_files (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        size INT NOT NULL,
        type VARCHAR(100) NOT NULL,
        base64 LONGTEXT NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        compressed_size INT NULL,
        entity_type ENUM('agreement', 'loan', 'transaction') NOT NULL,
        entity_id VARCHAR(36) NOT NULL,
        INDEX idx_entity (entity_type, entity_id),
        INDEX idx_uploaded_at (uploaded_at)
      ) ENGINE=InnoDB;
    `;
  }

  static fromDbRow(row) {
    return new UploadedFile({
      id: row.id,
      name: row.name,
      size: row.size,
      type: row.type,
      base64: row.base64,
      uploadedAt: row.uploaded_at,
      compressedSize: row.compressed_size,
      entityType: row.entity_type,
      entityId: row.entity_id
    });
  }

  toDbObject() {
    return {
      id: this.id,
      name: this.name,
      size: this.size,
      type: this.type,
      base64: this.base64,
      uploaded_at: this.uploadedAt,
      compressed_size: this.compressedSize,
      entity_type: this.entityType,
      entity_id: this.entityId
    };
  }
}