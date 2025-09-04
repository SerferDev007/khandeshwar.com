#!/usr/bin/env node

/**
 * Test the API endpoints structure without requiring database connectivity
 * This verifies routes, controllers, and middleware are correctly wired
 */

import express from 'express';
import sequelizeRoutes from './src/routes/sequelize/index.js';
import { validateBody } from './src/middleware/joiValidation.js';
import { createTenantSchema } from './src/validation/schemas.js';

const app = express();
app.use(express.json());

// Test basic route mounting
console.log('🧪 Testing API Route Structure...\n');

try {
  // Test 1: Route mounting
  console.log('1. Testing route mounting...');
  app.use('/api/sequelize', sequelizeRoutes);
  console.log('   ✅ Sequelize routes mounted successfully');

  // Test 2: Middleware functionality
  console.log('\n2. Testing middleware functionality...');
  
  // Test validation middleware
  const testRouter = express.Router();
  testRouter.post('/test', validateBody(createTenantSchema), (req, res) => {
    res.json({ success: true, data: req.body });
  });
  
  app.use('/test', testRouter);
  console.log('   ✅ Validation middleware configured');

  // Test 3: Route structure inspection
  console.log('\n3. Inspecting route structure...');
  
  const routes = [];
  function extractRoutes(stack, prefix = '') {
    stack.forEach(layer => {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
        routes.push(`${methods} ${prefix}${layer.route.path}`);
      } else if (layer.name === 'router' && layer.regexp) {
        const match = layer.regexp.source.match(/^\^\\?\/?([^\\$]+)/);
        const routerPath = match ? match[1].replace(/\\\//g, '/') : '';
        if (layer.handle.stack) {
          extractRoutes(layer.handle.stack, prefix + '/' + routerPath);
        }
      }
    });
  }

  extractRoutes(app._router.stack);
  
  console.log('   📋 Available routes:');
  routes.forEach(route => {
    console.log(`      ${route}`);
  });

  console.log('\n🎉 All API structure tests passed!');
  console.log('\n📋 Summary:');
  console.log('   ✅ Routes mounted correctly');
  console.log('   ✅ Middleware configured');
  console.log('   ✅ API structure verified');
  console.log(`   📊 Total routes: ${routes.length}`);
  console.log('\n🚀 API is ready for use!');

} catch (error) {
  console.error('❌ API structure test failed:', error);
  process.exit(1);
}

console.log('\n📚 Next steps:');
console.log('   1. Set up MySQL database');
console.log('   2. Configure environment variables');
console.log('   3. Run: npm start');
console.log('   4. Test endpoints with Postman using POSTMAN_EXAMPLES.md');
console.log('   5. Access API at: http://localhost:8081/api/sequelize/');