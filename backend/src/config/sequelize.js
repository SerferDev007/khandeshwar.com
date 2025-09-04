import { Sequelize } from 'sequelize';
import env from './env.js';
import pino from 'pino';

const logger = pino({ name: 'sequelize' });

// Create Sequelize instance with MySQL connection using environment variables
const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASSWORD, {
  host: env.DB_HOST,
  port: env.DB_PORT,
  dialect: 'mysql',
  logging: env.NODE_ENV === 'development' ? (msg) => logger.info(msg) : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});

// Test the connection
export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Sequelize connection to MySQL has been established successfully.');
    return true;
  } catch (error) {
    logger.error('❌ Unable to connect to the database:', error);
    throw error;
  }
};

// Initialize database with sync
export const initializeSequelize = async () => {
  try {
    await testConnection();
    
    // Sync all models (create tables if they don't exist)
    await sequelize.sync({ alter: env.NODE_ENV === 'development' });
    
    logger.info('✅ Database synchronized successfully');
    return sequelize;
  } catch (error) {
    logger.error('❌ Failed to initialize Sequelize:', error);
    throw error;
  }
};

// Close connection
export const closeConnection = async () => {
  try {
    await sequelize.close();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
  }
};

export default sequelize;