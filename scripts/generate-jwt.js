#!/usr/bin/env node

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate a random secret if not provided
const secret = process.env.JWT_SECRET || crypto.randomBytes(32).toString('base64');

// Default payload
const payload = {
  sub: 'dev-user-' + Date.now(),
  email: 'dev@example.com',
  name: 'Development User',
  tier: 'free',
  subscriptionStatus: 'active'
};

// Generate token
const token = jwt.sign(payload, secret, {
  issuer: process.env.JWT_ISSUER || 'vibe-deck-frontend',
  audience: process.env.JWT_AUDIENCE || 'vibe-deck-api',
  expiresIn: process.env.JWT_EXPIRY || 3600,
  algorithm: 'HS256'
});

console.log('\n=== JWT Token Generated ===\n');
console.log('Token:', token);
console.log('\nPayload:', JSON.stringify(payload, null, 2));
console.log('\nSecret used:', secret);
console.log('\n=== Add to your .env.local ===\n');
console.log(`JWT_SECRET=${secret}`);
console.log(`NEXT_PUBLIC_MOCK_JWT_TOKEN=${token}`);
console.log('\n');