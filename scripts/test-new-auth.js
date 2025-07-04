#!/usr/bin/env node

/**
 * Test the new authentication endpoints
 * Run with: node scripts/test-new-auth.js
 */

const https = require('https');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(url, method, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ status: 0, error: error.message });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  log('\n=== Testing New Authentication Endpoints ===\n', 'blue');

  // Test 1: Demo endpoint with JSON body
  log('1. Testing /api/auth/demo endpoint...', 'yellow');
  const demoResult = await testEndpoint(
    'https://deckster-production.up.railway.app/api/auth/demo',
    'POST',
    { user_id: 'test_user_' + Date.now() }
  );

  if (demoResult.status === 200) {
    log('✅ Demo endpoint working!', 'green');
    log(`   Token: ${demoResult.data.access_token?.substring(0, 50)}...`, 'green');
    log(`   Expires in: ${demoResult.data.expires_in} seconds`, 'green');
  } else {
    log(`❌ Demo endpoint failed: ${demoResult.status}`, 'red');
    log(`   Error: ${JSON.stringify(demoResult.data)}`, 'red');
  }

  // Test 2: Dev endpoint with query parameter
  log('\n2. Testing /api/dev/token endpoint...', 'yellow');
  const devResult = await testEndpoint(
    'https://deckster-production.up.railway.app/api/dev/token?user_id=test_user',
    'POST'
  );

  if (devResult.status === 200) {
    log('✅ Dev endpoint working!', 'green');
    log(`   Token: ${devResult.data.access_token?.substring(0, 50)}...`, 'green');
  } else {
    log(`❌ Dev endpoint failed: ${devResult.status}`, 'red');
    log(`   Error: ${JSON.stringify(devResult.data)}`, 'red');
  }

  // Test 3: WebSocket connection with token
  if (demoResult.status === 200) {
    log('\n3. Testing WebSocket connection...', 'yellow');
    const WebSocket = require('ws');
    const token = demoResult.data.access_token;
    const ws = new WebSocket(`wss://deckster-production.up.railway.app/ws?token=${token}`);

    ws.on('open', () => {
      log('✅ WebSocket connected successfully!', 'green');
      
      // Send a test message
      const testMessage = {
        message_id: 'test_' + Date.now(),
        timestamp: new Date().toISOString(),
        session_id: null,
        type: 'user_input',
        data: {
          text: 'Hello from test script!',
          response_to: null,
          attachments: [],
          ui_references: [],
          frontend_actions: []
        }
      };
      
      ws.send(JSON.stringify(testMessage));
      log('   Sent test message', 'green');
      
      // Close after 2 seconds
      setTimeout(() => {
        ws.close();
      }, 2000);
    });

    ws.on('message', (data) => {
      log('📨 Received message:', 'blue');
      console.log(JSON.parse(data.toString()));
    });

    ws.on('error', (error) => {
      log(`❌ WebSocket error: ${error.message}`, 'red');
    });

    ws.on('close', () => {
      log('\n✅ All tests completed!', 'green');
    });
  } else {
    log('\n⚠️  Skipping WebSocket test (no token available)', 'yellow');
  }
}

// Check if ws module is installed
try {
  require('ws');
  runTests();
} catch (e) {
  log('Please install ws module first: npm install ws', 'red');
  process.exit(1);
}