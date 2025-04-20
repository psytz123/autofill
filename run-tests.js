/**
 * Test Runner Script
 * 
 * This script runs Jest tests with various options.
 * Usage:
 * - node run-tests.js         # Run all tests
 * - node run-tests.js watch   # Run tests in watch mode
 * - node run-tests.js coverage # Run tests with coverage reports
 */

const { execSync } = require('child_process');

// Get command line arguments
const args = process.argv.slice(2);
const mode = args[0] || 'normal';

// Set up command based on mode
let command = 'npx jest';

switch (mode) {
  case 'watch':
    command += ' --watch';
    break;
  case 'coverage':
    command += ' --coverage';
    break;
  case 'normal':
  default:
    // Default command is just running Jest
    break;
}

// Execute the command
console.log(`Running tests in ${mode} mode...`);
try {
  execSync(command, { stdio: 'inherit' });
} catch (error) {
  // Jest will return a non-zero exit code if tests fail
  process.exit(1);
}