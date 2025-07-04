#!/usr/bin/env node

/**
 * Test Authentication Flow Script
 * 
 * This script tests the authentication flow by:
 * 1. Attempting to get a token via the proxy endpoint
 * 2. Falling back to mock token if needed
 * 3. Testing WebSocket connection with the token
 */

const https = require('https');
const http = require('http');
const WebSocket = require('ws');

const config = {
  // Local development server
  localUrl: 'http://localhost:3000',
  // Backend URLs
  backendUrl: process.env.BACKEND_URL || 'https://deckster-production.up.railway.app',
  wsUrl: process.env.WS_URL || 'wss://deckster-production.up.railway.app',
  // Test user
  userId: 'test_user_' + Date.now()
};

// Colors for console output
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

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${json.error || data}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testProxyEndpoint() {
  log('\n1. Testing Proxy Token Endpoint...', 'blue');
  
  try {
    const response = await makeRequest(`${config.localUrl}/api/proxy/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id: config.userId })
    });
    
    log('✅ Proxy endpoint working!', 'green');
    log(`   Token: ${response.access_token.substring(0, 20)}...`, 'green');
    log(`   Expires in: ${response.expires_in} seconds`, 'green');
    
    return response.access_token;
  } catch (error) {
    log(`❌ Proxy endpoint failed: ${error.message}`, 'red');
    return null;
  }
}

async function testMockEndpoint() {
  log('\n2. Testing Mock Token Endpoint...', 'blue');
  
  try {
    const response = await makeRequest(`${config.localUrl}/api/dev/mock-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id: config.userId })
    });
    
    log('✅ Mock endpoint working!', 'green');
    log(`   Token: ${response.access_token.substring(0, 20)}...`, 'green');
    log(`   Warning: ${response.warning}`, 'yellow');
    
    return response.access_token;
  } catch (error) {
    log(`❌ Mock endpoint failed: ${error.message}`, 'red');
    return null;
  }
}

async function testDirectBackend() {
  log('\n3. Testing Direct Backend Connection...', 'blue');
  
  try {
    const response = await makeRequest(`${config.backendUrl}/api/dev/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id: config.userId })
    });
    
    log('✅ Direct backend connection working!', 'green');
    log('   Note: This means CORS might be fixed!', 'green');
    
    return response.access_token;
  } catch (error) {
    log(`❌ Direct backend failed: ${error.message}`, 'red');
    log('   This is expected if CORS is not fixed yet', 'yellow');
    return null;
  }
}

async function testWebSocket(token) {
  log('\n4. Testing WebSocket Connection...', 'blue');
  
  return new Promise((resolve) => {
    const wsUrl = `${config.wsUrl}/ws?token=${encodeURIComponent(token)}`;
    log(`   Connecting to: ${wsUrl.substring(0, 50)}...`, 'yellow');
    
    const ws = new WebSocket(wsUrl);
    let timeout;
    
    ws.on('open', () => {
      log('✅ WebSocket connected!', 'green');
      
      // Send ping
      ws.send(JSON.stringify({
        type: 'ping',
        message_id: `msg_${Date.now()}`,
        timestamp: new Date().toISOString()
      }));
      
      timeout = setTimeout(() => {
        log('⏱️  No response to ping after 5 seconds', 'yellow');
        ws.close();
        resolve(true);
      }, 5000);
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        log(`✅ Received message: ${message.type}`, 'green');
        
        if (message.type === 'connection' && message.status === 'connected') {
          log(`   Session ID: ${message.session_id}`, 'green');
        }
        
        clearTimeout(timeout);
        ws.close();
        resolve(true);
      } catch (e) {
        log(`❌ Failed to parse message: ${e.message}`, 'red');
      }
    });
    
    ws.on('error', (error) => {
      log(`❌ WebSocket error: ${error.message}`, 'red');
      clearTimeout(timeout);
      resolve(false);
    });
    
    ws.on('close', (code, reason) => {
      log(`   WebSocket closed: ${code} ${reason}`, 'yellow');
      clearTimeout(timeout);
      resolve(code === 1000);
    });
  });
}

async function runTests() {
  log('=== Authentication Flow Test ===', 'blue');
  log(`Local URL: ${config.localUrl}`, 'blue');
  log(`Backend URL: ${config.backendUrl}`, 'blue');
  log(`WebSocket URL: ${config.wsUrl}`, 'blue');
  
  // Test proxy endpoint
  let token = await testProxyEndpoint();
  
  // If proxy fails, try mock
  if (!token) {
    token = await testMockEndpoint();
  }
  
  // Test direct backend (to check if CORS is fixed)
  await testDirectBackend();
  
  // Test WebSocket if we have a token
  if (token) {
    await testWebSocket(token);
  } else {
    log('\n❌ No token available, skipping WebSocket test', 'red');
  }
  
  log('\n=== Test Complete ===', 'blue');
}

// Check if local server is running
http.get(config.localUrl, (res) => {
  runTests();
}).on('error', () => {
  log('❌ Local development server is not running!', 'red');
  log('   Please run: pnpm dev', 'yellow');
  process.exit(1);
});