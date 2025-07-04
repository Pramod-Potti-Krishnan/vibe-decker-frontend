# Authentication & WebSocket Testing Checklist

## Overview
This checklist helps verify that the authentication and WebSocket connection are working correctly after implementing the CORS workarounds.

## Pre-Testing Setup

### Environment Variables
- [ ] Verify `.env.local` exists with proper configuration
- [ ] Check `NEXT_PUBLIC_USE_PROXY` is not set to `false` (defaults to true)
- [ ] Confirm backend URLs are correctly configured

### Development Server
- [ ] Run `pnpm dev` to start the development server
- [ ] Open browser console (F12) to monitor network requests and console logs

## Authentication Testing

### 1. Demo Endpoint Test (Direct)
- [ ] Navigate to `/test-connection`
- [ ] Click "Run Connection Test"
- [ ] Verify "Test Demo Endpoint" step succeeds
- [ ] Check if backend now supports CORS directly
- [ ] Confirm no CORS errors in console

### 2. Token Acquisition via Proxy
- [ ] Verify "Get Token via Proxy" step succeeds
- [ ] Check console for "✅ Successfully got token from /api/auth/demo endpoint" message
- [ ] Confirm fallback chain works if needed

### 3. Browser Console Test
- [ ] Copy the test code from `/test-connection` page
- [ ] Paste into browser console
- [ ] Verify token is obtained directly
- [ ] Confirm WebSocket connects successfully
- [ ] Check for test message exchange

### 4. Token Persistence
- [ ] After successful authentication, refresh the page
- [ ] Verify token is restored from localStorage
- [ ] Check token expiry time is correctly displayed (24 hours for demo tokens)
- [ ] Test "Invalidate Token" button forces refresh

## WebSocket Connection Testing

### 1. Initial Connection
- [ ] From `/test-connection`, verify all steps complete:
  - [ ] Environment Configuration ✅
  - [ ] Get Authentication Token ✅
  - [ ] Connect to WebSocket ✅
  - [ ] Authenticate WebSocket ✅
  - [ ] Send Ping Message ✅

### 2. Connection Recovery
- [ ] Disconnect network briefly (airplane mode)
- [ ] Reconnect network
- [ ] Verify WebSocket reconnects automatically
- [ ] Check exponential backoff in console logs
- [ ] Confirm session is restored after reconnection

### 3. Error Handling
- [ ] Test with invalid backend URL
- [ ] Verify error messages are clear and actionable
- [ ] Check "Retry Connection" button works
- [ ] Confirm connection status indicator updates correctly

## Builder Module Testing

### 1. Navigate to Builder
- [ ] Go to `/builder`
- [ ] Verify no "WebSocket client not initialized" errors
- [ ] Check connection status indicator shows "Connected"
- [ ] Confirm AI agents panel shows connected status

### 2. Send Messages
- [ ] Type a message in the chat input
- [ ] Send the message
- [ ] Verify message appears in chat
- [ ] Check for WebSocket activity in console
- [ ] Confirm no authentication errors

### 3. Real-time Updates
- [ ] Request slide generation
- [ ] Verify progress updates appear
- [ ] Check agent status updates in real-time
- [ ] Confirm slides appear when generated

## Production Testing

### 1. Deploy to Vercel/Production
- [ ] Set production environment variables
- [ ] Deploy application
- [ ] Test at https://www.deckster.xyz

### 2. Verify Proxy Routes
- [ ] Check `/api/proxy/token` endpoint works
- [ ] Confirm no CORS errors in production
- [ ] Verify WebSocket connects successfully

### 3. Monitor Performance
- [ ] Check network tab for proxy request timing
- [ ] Verify token refresh happens before expiry
- [ ] Monitor WebSocket connection stability

## Debug Tools

### Connection Debug Panel
1. Click connection status indicator in header
2. Review debug information:
   - [ ] Connection status
   - [ ] Authentication method (Proxy/Dev/Direct)
   - [ ] Backend URLs
   - [ ] Token expiry time
   - [ ] Last error (if any)

### Browser Console Commands
```javascript
// Check token status
tokenManager.isAuthenticated()

// Get token expiry
new Date(tokenManager.getExpiryTime()).toLocaleString()

// Force token refresh
tokenManager.invalidateToken()

// Check WebSocket state
window.__WEBSOCKET_CLIENT__?.isConnected()
```

## Common Issues & Solutions

### Issue: CORS Error on Token Request
**Solution**: Ensure proxy route is being used
- Check `NEXT_PUBLIC_USE_PROXY` is not `false`
- Verify `/api/proxy/token` route exists
- Check backend URL configuration

### Issue: WebSocket Fails to Connect
**Solution**: Verify authentication succeeded
- Check token was obtained successfully
- Ensure WebSocket URL includes token parameter
- Verify backend WebSocket endpoint is running

### Issue: "No authentication token available"
**Solution**: Check authentication flow
- Try clearing localStorage and re-authenticating
- Enable dev mode for mock tokens
- Check TokenManager error with `tokenManager.getLastError()`

### Issue: Connection Drops Frequently
**Solution**: Check network and configuration
- Verify heartbeat interval (30 seconds default)
- Check WebSocket URL is stable
- Monitor network tab for connection issues

## Post-Testing Cleanup

When CORS is fixed on backend:
1. [ ] Remove or disable proxy routes
2. [ ] Set `NEXT_PUBLIC_USE_PROXY=false`
3. [ ] Test direct connection to backend
4. [ ] Remove dev mode mock token generator
5. [ ] Update documentation

## Success Criteria

✅ All test steps pass without errors
✅ No CORS errors in console
✅ WebSocket maintains stable connection
✅ Messages flow bidirectionally
✅ UI updates in real-time
✅ Connection recovers from network issues