/**
 * Demo server for testing frontend without full database setup
 * This provides authentication and basic endpoints
 */

import express from 'express';
import cors from 'cors';
import { demoAuthRoutes, demoAuthMiddleware } from './demo-auth.js';

const app = express();
const PORT = 8081;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: '1.0.0-demo',
      environment: 'development'
    }
  });
});

// Add demo authentication routes
demoAuthRoutes(app);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Demo Khandeshwar API Server running on port ${PORT}`);
  console.log(`📍 Environment: development (DEMO MODE)`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 Demo credentials:`);
  console.log(`   • admin@example.com / admin123 (Admin)`);
  console.log(`   • manager@example.com / manager123 (Manager)`);
  console.log(`   • staff@example.com / staff123 (Staff)`);
});

export default app;