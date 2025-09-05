/**
 * Unit Test for Donations Preview Receipt Number Implementation
 * 
 * This test validates the code structure and implementation of the preview endpoint
 * without requiring a running database.
 */

import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

/**
 * Check if the backend endpoint is properly implemented
 */
function testBackendEndpoint() {
  console.log(chalk.yellow('\n1. Testing backend endpoint implementation...'));
  
  try {
    const donationsRouteFile = './src/routes/donations.js';
    const content = fs.readFileSync(donationsRouteFile, 'utf8');
    
    // Check for the preview endpoint route
    const hasPreviewRoute = content.includes('router.get(\'/next-receipt-number\'');
    if (hasPreviewRoute) {
      console.log(chalk.green('✅ Preview endpoint route exists'));
    } else {
      console.log(chalk.red('❌ Preview endpoint route missing'));
      return false;
    }
    
    // Check for proper authentication and authorization
    const hasAuth = content.includes('authenticate') && content.includes('authorize([\'Admin\', \'Treasurer\'])');
    if (hasAuth) {
      console.log(chalk.green('✅ Proper authentication and authorization'));
    } else {
      console.log(chalk.red('❌ Missing authentication or authorization'));
      return false;
    }
    
    // Check for getNextReceiptNumber function call
    const hasGetNextCall = content.includes('getNextReceiptNumber(\'Donation\')');
    if (hasGetNextCall) {
      console.log(chalk.green('✅ Calls getNextReceiptNumber function'));
    } else {
      console.log(chalk.red('❌ Missing getNextReceiptNumber function call'));
      return false;
    }
    
    return true;
  } catch (error) {
    console.log(chalk.red('❌ Error reading donations route file:'), error.message);
    return false;
  }
}

/**
 * Check if the database function is properly implemented
 */
function testDatabaseFunction() {
  console.log(chalk.yellow('\n2. Testing database function implementation...'));
  
  try {
    const dbFile = './src/config/db.js';
    const content = fs.readFileSync(dbFile, 'utf8');
    
    // Check for getNextReceiptNumber function
    const hasFunction = content.includes('export const getNextReceiptNumber');
    if (hasFunction) {
      console.log(chalk.green('✅ getNextReceiptNumber function exists'));
    } else {
      console.log(chalk.red('❌ getNextReceiptNumber function missing'));
      return false;
    }
    
    // Check for read-only query (SELECT without UPDATE)
    const functionMatch = content.match(/export const getNextReceiptNumber[^}]*?SELECT[^}]*?}/s);
    if (functionMatch) {
      const functionCode = functionMatch[0];
      const hasSelect = functionCode.includes('SELECT next_number FROM receipt_sequences');
      const hasNoUpdate = !functionCode.includes('UPDATE');
      
      if (hasSelect && hasNoUpdate) {
        console.log(chalk.green('✅ Function is read-only (SELECT without UPDATE)'));
      } else {
        console.log(chalk.red('❌ Function is not read-only or incorrect query'));
        return false;
      }
    } else {
      console.log(chalk.red('❌ Could not parse function implementation'));
      return false;
    }
    
    // Check for proper error handling
    const hasErrorHandling = content.includes('throw new Error') && 
                           content.includes('Receipt sequence not found');
    if (hasErrorHandling) {
      console.log(chalk.green('✅ Proper error handling'));
    } else {
      console.log(chalk.red('❌ Missing or inadequate error handling'));
      return false;
    }
    
    // Check for proper formatting
    const hasFormatting = content.includes('padStart(4, \'0\')');
    if (hasFormatting) {
      console.log(chalk.green('✅ Proper receipt number formatting'));
    } else {
      console.log(chalk.red('❌ Missing receipt number formatting'));
      return false;
    }
    
    return true;
  } catch (error) {
    console.log(chalk.red('❌ Error reading database config file:'), error.message);
    return false;
  }
}

/**
 * Check if the frontend API client is properly implemented
 */
function testFrontendApiClient() {
  console.log(chalk.yellow('\n3. Testing frontend API client implementation...'));
  
  try {
    const apiFile = '../frontend/src/utils/api.ts';
    const content = fs.readFileSync(apiFile, 'utf8');
    
    // Check for getNextDonationReceiptNumber method
    const hasMethod = content.includes('getNextDonationReceiptNumber()');
    if (hasMethod) {
      console.log(chalk.green('✅ getNextDonationReceiptNumber method exists'));
    } else {
      console.log(chalk.red('❌ getNextDonationReceiptNumber method missing'));
      return false;
    }
    
    // Check for correct endpoint call
    const hasCorrectEndpoint = content.includes('"/api/donations/next-receipt-number"');
    if (hasCorrectEndpoint) {
      console.log(chalk.green('✅ Calls correct API endpoint'));
    } else {
      console.log(chalk.red('❌ Incorrect or missing API endpoint'));
      return false;
    }
    
    return true;
  } catch (error) {
    console.log(chalk.red('❌ Error reading API client file:'), error.message);
    return false;
  }
}

/**
 * Check if the frontend component uses the preview functionality
 */
function testFrontendComponent() {
  console.log(chalk.yellow('\n4. Testing frontend component implementation...'));
  
  try {
    const componentFile = '../frontend/components/Donations.tsx';
    const content = fs.readFileSync(componentFile, 'utf8');
    
    // Check for fetchPreviewReceiptNumber function
    const hasFetchFunction = content.includes('fetchPreviewReceiptNumber');
    if (hasFetchFunction) {
      console.log(chalk.green('✅ fetchPreviewReceiptNumber function exists'));
    } else {
      console.log(chalk.red('❌ fetchPreviewReceiptNumber function missing'));
      return false;
    }
    
    // Check for API client call
    const hasApiCall = content.includes('apiClient.getNextDonationReceiptNumber()');
    if (hasApiCall) {
      console.log(chalk.green('✅ Calls API client method'));
    } else {
      console.log(chalk.red('❌ Missing API client method call'));
      return false;
    }
    
    // Check for proper state management
    const hasStateUpdate = content.includes('setFormData') && 
                          content.includes('receiptNumber');
    if (hasStateUpdate) {
      console.log(chalk.green('✅ Updates form data with receipt number'));
    } else {
      console.log(chalk.red('❌ Missing state update for receipt number'));
      return false;
    }
    
    // Check for error handling
    const hasErrorHandling = content.includes('catch (error)') &&
                           content.includes('Failed to fetch preview receipt number');
    if (hasErrorHandling) {
      console.log(chalk.green('✅ Proper error handling'));
    } else {
      console.log(chalk.red('❌ Missing or inadequate error handling'));
      return false;
    }
    
    return true;
  } catch (error) {
    console.log(chalk.red('❌ Error reading component file:'), error.message);
    return false;
  }
}

/**
 * Check for potential race conditions or implementation issues
 */
function testImplementationIssues() {
  console.log(chalk.yellow('\n5. Testing for implementation issues...'));
  
  try {
    const componentFile = '../frontend/components/Donations.tsx';
    const content = fs.readFileSync(componentFile, 'utf8');
    
    // Check for conflicting receipt number setting mechanisms
    // Look for useEffect that sets receiptNumber from receiptCounter
    const receiptCounterEffectPattern = /useEffect\s*\(\s*\(\)\s*=>\s*{[^}]*setFormData[^}]*receiptCounter[^}]*}\s*,\s*\[[^\]]*receiptCounter[^\]]*\]/s;
    const hasReceiptCounterEffect = receiptCounterEffectPattern.test(content);
    const hasFetchPreviewCall = content.includes('fetchPreviewReceiptNumber');
    
    if (hasReceiptCounterEffect && hasFetchPreviewCall) {
      console.log(chalk.yellow('⚠️ Potential race condition detected:'));
      console.log(chalk.yellow('   Both receiptCounter useEffect and API preview set receipt number'));
      console.log(chalk.yellow('   This needs to be resolved to avoid conflicts'));
      return false;
    }
    
    // Check for proper initialization
    const hasInitialization = content.includes('initializeForNewDonation') &&
                             content.includes('useEffect');
    if (hasInitialization) {
      console.log(chalk.green('✅ Proper initialization logic'));
    } else {
      console.log(chalk.red('❌ Missing or improper initialization'));
      return false;
    }
    
    // Check that preview is used in initialization
    const initializationPattern = /initializeForNewDonation[^}]*fetchPreviewReceiptNumber/s;
    if (initializationPattern.test(content)) {
      console.log(chalk.green('✅ Preview endpoint used in initialization'));
    } else {
      console.log(chalk.red('❌ Preview endpoint not used in initialization'));
      return false;
    }
    
    console.log(chalk.green('✅ No race conditions detected'));
    return true;
  } catch (error) {
    console.log(chalk.red('❌ Error analyzing component:'), error.message);
    return false;
  }
}

/**
 * Main test execution
 */
function main() {
  console.log(chalk.blue('🧪 Donations Preview Receipt Number - Code Analysis'));
  console.log(chalk.gray('   Analyzing implementation without requiring database\n'));
  
  const tests = [
    { name: 'Backend Endpoint', fn: testBackendEndpoint },
    { name: 'Database Function', fn: testDatabaseFunction },
    { name: 'Frontend API Client', fn: testFrontendApiClient },
    { name: 'Frontend Component', fn: testFrontendComponent },
    { name: 'Implementation Issues', fn: testImplementationIssues }
  ];
  
  let allTestsPassed = true;
  const results = [];
  
  for (const test of tests) {
    const passed = test.fn();
    results.push({ name: test.name, passed });
    allTestsPassed = allTestsPassed && passed;
  }
  
  // Summary
  console.log(chalk.blue('\n' + '='.repeat(60)));
  console.log(chalk.blue('📊 Test Results Summary:'));
  
  for (const result of results) {
    const status = result.passed ? chalk.green('✅ PASS') : chalk.red('❌ FAIL');
    console.log(`   ${status} ${result.name}`);
  }
  
  if (allTestsPassed) {
    console.log(chalk.green('\n🎉 All Implementation Tests Passed!'));
    console.log(chalk.cyan('\n✅ Verified Implementation:'));
    console.log(chalk.cyan('   • Backend endpoint exists with proper auth'));
    console.log(chalk.cyan('   • Database function is read-only'));
    console.log(chalk.cyan('   • Frontend API client method exists'));
    console.log(chalk.cyan('   • Frontend component uses preview functionality'));
  } else {
    console.log(chalk.red('\n❌ Some Implementation Issues Found!'));
    console.log(chalk.yellow('\n🔧 Recommended Actions:'));
    
    if (!results.find(r => r.name === 'Implementation Issues')?.passed) {
      console.log(chalk.yellow('   • Fix race condition between receiptCounter and API preview'));
    }
    
    const failedTests = results.filter(r => !r.passed);
    for (const test of failedTests) {
      console.log(chalk.yellow(`   • Fix issues in: ${test.name}`));
    }
  }
  
  return allTestsPassed;
}

// Run the tests
const success = main();
process.exit(success ? 0 : 1);