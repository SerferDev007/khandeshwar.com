const mysql = require('mysql2');
require('dotenv').config();

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'temple_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Get promises-based connection
const promisePool = pool.promise();

// Test database connection
const testConnection = async () => {
    try {
        const [rows] = await promisePool.execute('SELECT 1 as test');
        console.log('✅ Database connection successful');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
};

// Generic query function
const query = async (sql, params = []) => {
    try {
        const [rows] = await promisePool.execute(sql, params);
        return rows;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
};

// Generic insert function
const insert = async (table, data) => {
    try {
        const columns = Object.keys(data).join(', ');
        const placeholders = Object.keys(data).map(() => '?').join(', ');
        const values = Object.values(data);
        
        const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
        const [result] = await promisePool.execute(sql, values);
        return result;
    } catch (error) {
        console.error('Database insert error:', error);
        throw error;
    }
};

// Generic update function
const update = async (table, data, whereClause, whereParams = []) => {
    try {
        const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(data), ...whereParams];
        
        const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
        const [result] = await promisePool.execute(sql, values);
        return result;
    } catch (error) {
        console.error('Database update error:', error);
        throw error;
    }
};

// Generic delete function
const deleteRecord = async (table, whereClause, whereParams = []) => {
    try {
        const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
        const [result] = await promisePool.execute(sql, whereParams);
        return result;
    } catch (error) {
        console.error('Database delete error:', error);
        throw error;
    }
};

// Generic select function
const select = async (table, columns = '*', whereClause = '', whereParams = [], orderBy = '', limit = '') => {
    try {
        let sql = `SELECT ${columns} FROM ${table}`;
        if (whereClause) sql += ` WHERE ${whereClause}`;
        if (orderBy) sql += ` ORDER BY ${orderBy}`;
        if (limit) sql += ` LIMIT ${limit}`;
        
        const [rows] = await promisePool.execute(sql, whereParams);
        return rows;
    } catch (error) {
        console.error('Database select error:', error);
        throw error;
    }
};

module.exports = {
    pool,
    promisePool,
    testConnection,
    query,
    insert,
    update,
    delete: deleteRecord,
    select
};