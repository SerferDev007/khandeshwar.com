const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import database connection
const db = require('./models/db');

// Import route files
const authRoutes = require('./routes/auth');
const devoteesRoutes = require('./routes/devotees');
const donationsRoutes = require('./routes/donations');
const eventsRoutes = require('./routes/events');
const staffRoutes = require('./routes/staff');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files middleware (for serving HTML/CSS/JS files)
app.use(express.static(path.join(__dirname, 'public')));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/devotees', devoteesRoutes);
app.use('/api/donations', donationsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/staff', staffRoutes);

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Admin dashboard route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'dashboard.html'));
});

// User dashboard route
app.get('/user', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'user', 'dashboard.html'));
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const dbStatus = await db.testConnection();
        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            database: dbStatus ? 'Connected' : 'Disconnected',
            version: '1.0.0'
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            database: 'Error',
            error: error.message
        });
    }
});

// API documentation endpoint
app.get('/api', (req, res) => {
    res.json({
        message: 'Temple Management System API',
        version: '1.0.0',
        endpoints: {
            health: 'GET /api/health',
            auth: {
                login: 'POST /api/auth/login',
                register: 'POST /api/auth/register',
                logout: 'POST /api/auth/logout'
            },
            devotees: {
                getAll: 'GET /api/devotees',
                getById: 'GET /api/devotees/:id',
                create: 'POST /api/devotees',
                update: 'PUT /api/devotees/:id',
                delete: 'DELETE /api/devotees/:id'
            },
            donations: {
                getAll: 'GET /api/donations',
                getById: 'GET /api/donations/:id',
                create: 'POST /api/donations',
                update: 'PUT /api/donations/:id',
                delete: 'DELETE /api/donations/:id'
            },
            events: {
                getAll: 'GET /api/events',
                getById: 'GET /api/events/:id',
                create: 'POST /api/events',
                update: 'PUT /api/events/:id',
                delete: 'DELETE /api/events/:id'
            },
            staff: {
                getAll: 'GET /api/staff',
                getById: 'GET /api/staff/:id',
                create: 'POST /api/staff',
                update: 'PUT /api/staff/:id',
                delete: 'DELETE /api/staff/:id'
            }
        }
    });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        error: 'API endpoint not found',
        path: req.originalUrl
    });
});

// 404 handler for static files
app.use('*', (req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// Start server
const startServer = async () => {
    try {
        // Test database connection on startup
        const dbConnected = await db.testConnection();
        if (!dbConnected) {
            console.warn('⚠️  Database connection failed, but server will start anyway');
        }
        
        app.listen(PORT, () => {
            console.log(`🚀 Temple Management Server running on port ${PORT}`);
            console.log(`📱 Dashboard: http://localhost:${PORT}`);
            console.log(`👨‍💼 Admin Panel: http://localhost:${PORT}/admin`);
            console.log(`👤 User Panel: http://localhost:${PORT}/user`);
            console.log(`🔗 API Documentation: http://localhost:${PORT}/api`);
            console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down server gracefully...');
    process.exit(0);
});

// Start the server
startServer();

module.exports = app;