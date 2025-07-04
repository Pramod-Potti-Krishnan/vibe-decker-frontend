// Re-export the new DecksterClient for backward compatibility
export { DecksterClient as VibeDeckWebSocket } from './websocket-client';
export * from './websocket-client';

// Legacy support - this file now acts as a facade to the new implementation
console.warn('websocket-service.ts is deprecated. Please import from websocket-client.ts directly.');