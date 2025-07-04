#!/usr/bin/env node

const WebSocket = require('ws');

const presentationId = 'test-' + Date.now();
const wsUrl = `wss://vibe-decker-agents-mvp10-production.up.railway.app/ws/presentations/${presentationId}/interactive`;

console.log('Connecting to:', wsUrl);

const ws = new WebSocket(wsUrl);

ws.on('open', () => {
  console.log('\n✅ Connected to WebSocket');
  
  // Send initial discovery command
  const initCommand = {
    command_type: 'start_discovery',
    command: 'Start chat mode',
    context: { chat_mode: true }
  };
  
  console.log('\n📤 Sending:', JSON.stringify(initCommand, null, 2));
  ws.send(JSON.stringify(initCommand));
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    console.log('\n📥 Received:', message.type);
    console.log('Full message:', JSON.stringify(message, null, 2));
    
    // Simulate conversation flow
    if (message.type === 'assistant_message') {
      if (message.content.includes('audience') || message.content.includes('goal')) {
        // Respond to initial questions
        setTimeout(() => {
          const response = {
            type: 'chat_message',
            content: 'the audience is kids. presentation is for 20 min. main goal is educate with fun.'
          };
          console.log('\n📤 Sending:', JSON.stringify(response, null, 2));
          ws.send(JSON.stringify(response));
        }, 2000);
      } else if (message.content.includes('structure') && message.content.includes('review')) {
        // Approve structure
        setTimeout(() => {
          const response = {
            type: 'chat_message',
            content: 'looks good'
          };
          console.log('\n📤 Sending:', JSON.stringify(response, null, 2));
          ws.send(JSON.stringify(response));
        }, 2000);
      }
    }
    
    if (message.type === 'structure_generated') {
      console.log('\n🎯 Structure generated!');
      console.log('Phase:', message.phase);
      console.log('Slides count:', message.structure?.slides?.length);
      if (message.phase === 2) {
        console.log('\n✨ Enhanced structure with meta-content received!');
        // Close connection after successful enhancement
        setTimeout(() => {
          ws.close();
          process.exit(0);
        }, 2000);
      }
    }
  } catch (error) {
    console.error('\n❌ Error parsing message:', error);
    console.log('Raw data:', data.toString());
  }
});

ws.on('error', (error) => {
  console.error('\n❌ WebSocket error:', error);
});

ws.on('close', (code, reason) => {
  console.log('\n🔌 Connection closed');
  console.log('Code:', code);
  console.log('Reason:', reason.toString());
});

// Send initial topic after a short delay
setTimeout(() => {
  const topicMessage = {
    type: 'chat_message',
    content: 'planets'
  };
  console.log('\n📤 Sending:', JSON.stringify(topicMessage, null, 2));
  ws.send(JSON.stringify(topicMessage));
}, 3000);

// Timeout after 60 seconds
setTimeout(() => {
  console.log('\n⏱️ Test timeout reached');
  ws.close();
  process.exit(1);
}, 60000);