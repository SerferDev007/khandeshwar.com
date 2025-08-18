export class User {
  constructor(data = {}) {
    this.id = data.id;
    this.username = data.username;
    this.email = data.email;
    this.role = data.role; // 'Admin' | 'Treasurer' | 'Viewer'
    this.status = data.status; // 'Active' | 'Inactive'
    this.createdAt = data.createdAt;
    this.lastLogin = data.lastLogin;
  }

  static getTableSchema() {
    return `
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        role ENUM('Admin', 'Treasurer', 'Viewer') NOT NULL DEFAULT 'Viewer',
        status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL,
        INDEX idx_username (username),
        INDEX idx_email (email),
        INDEX idx_role (role),
        INDEX idx_status (status)
      ) ENGINE=InnoDB;
    `;
  }

  static fromDbRow(row) {
    return new User({
      id: row.id,
      username: row.username,
      email: row.email,
      role: row.role,
      status: row.status,
      createdAt: row.created_at,
      lastLogin: row.last_login
    });
  }

  toDbObject() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      role: this.role,
      status: this.status,
      created_at: this.createdAt,
      last_login: this.lastLogin
    };
  }
}