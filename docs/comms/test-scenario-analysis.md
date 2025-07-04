# Test Scenario Analysis - Frontend vs Backend Validation

## Current Test Implementation Review

### 1. **Test Connection Page** (`/app/test-connection/page.tsx`)

**Current Test Steps:**
1. ✅ Check Environment Configuration
2. ✅ Test Demo Endpoint (direct CORS check)
3. ✅ Get Token via Proxy
4. ✅ Connect to WebSocket
5. ✅ Authenticate WebSocket
6. ⚠️  Send Test Message (only sends ping)

**Key Observations:**
- Tests direct CORS access to demo endpoint
- Uses proxy fallback for token acquisition
- Only sends a `ping` message, not a full user_input message
- Properly uses our enhanced DecksterClient with state management

### 2. **Backend's Validation Script** (from round11_BE2FE.md)

**Their Test Flow:**
1. Get token from `/api/auth/demo`
2. Connect WebSocket with token
3. Send full `user_input` message with presentation request
4. Validate session creation
5. Check for director response

**Key Differences:**
- Sends actual presentation generation request
- Validates director response (MockWorkflow)
- Checks session creation explicitly
- Tests full message flow

### 3. **Node.js Test Script** (`/scripts/test-new-auth.js`)

**Current Implementation:**
- Tests both demo and dev endpoints
- Sends simple "Hello from test script!" message
- Uses WebSocket directly (not our client)
- Good for backend validation but not frontend integration

## Recommended Updates

### 1. **Update Test Connection Page**

```typescript
// Add a new test step for full message flow
{ id: 'ws-message', name: 'Send Presentation Request', status: 'pending' },
{ id: 'ws-response', name: 'Receive Director Response', status: 'pending' },

// Replace ping test with full message test
client.on('authenticated', async (data) => {
  updateStep('ws-auth', 'success', 'WebSocket authenticated', data)
  addLog(`WebSocket authenticated with session: ${data.session_id || 'N/A'}`, 'success')
  
  // Send actual presentation request
  updateStep('ws-message', 'running')
  addLog('Sending presentation request...')
  
  const testMessage = {
    type: 'user_input',
    message_id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    session_id: data.session_id || '',
    data: {
      text: 'Create a simple 5-slide presentation about AI technology',
      response_to: null,
      attachments: [],
      ui_references: [],
      frontend_actions: []
    }
  };
  
  try {
    await client.send(testMessage);
    updateStep('ws-message', 'success', 'Message sent successfully')
    addLog('Presentation request sent', 'success')
  } catch (err) {
    updateStep('ws-message', 'error', err.message)
    addLog(`Failed to send message: ${err.message}`, 'error')
  }
})

// Add director response handler
client.on('director_message', (message) => {
  updateStep('ws-response', 'success', 'Director response received', {
    messageType: message.type,
    hasContent: !!message.data?.chat_data?.content,
    agentName: message.data?.chat_data?.agent_name
  })
  addLog(`Director response: ${message.data?.chat_data?.content?.substring(0, 100)}...`, 'success')
})
```

### 2. **Update Browser Console Test**

The current browser console test in our test page should match the backend's validation script more closely:

```javascript
// Update the browser console test to match backend expectations
const testMessage = {
  message_id: 'validation_' + Date.now(),
  timestamp: new Date().toISOString(),
  session_id: null,
  type: 'user_input',
  data: { 
    text: 'Create a test presentation about AI technology', 
    response_to: null, 
    attachments: [], 
    ui_references: [], 
    frontend_actions: [] 
  }
};
```

### 3. **Add Connection State Visualization**

Since we've implemented enhanced connection states, add visual feedback:

```typescript
// Show connection state progression
const connectionStates = ['disconnected', 'connecting', 'connected', 'authenticated', 'ready'];
const [currentState, setCurrentState] = useState('disconnected');

client.on('connecting', () => setCurrentState('connecting'));
client.on('connected', () => setCurrentState('connected'));
client.on('authenticated', () => setCurrentState('authenticated'));
client.on('director_message', () => setCurrentState('ready'));
```

## Summary of Needed Updates

1. **Test Full Message Flow** - Not just ping, but actual presentation requests
2. **Validate Director Responses** - Check MockWorkflow is responding
3. **Show Connection States** - Visualize our new state management
4. **Match Backend Format** - Ensure message format matches their expectations
5. **Add Performance Metrics** - Time each step for performance validation

## Benefits of Updates

- ✅ Complete end-to-end validation
- ✅ Matches backend team's expectations
- ✅ Tests our state management implementation
- ✅ Validates MockWorkflow integration
- ✅ Better debugging information