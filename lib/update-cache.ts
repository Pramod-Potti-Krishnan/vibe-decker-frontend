interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

export class UpdateCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private timers = new Map<string, NodeJS.Timeout>();

  constructor(private defaultTTL: number = 5000) {}

  set(key: string, value: T, ttl?: number): void {
    const effectiveTTL = ttl ?? this.defaultTTL;
    
    // Clear existing timer
    this.clearTimer(key);

    // Set cache entry
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: effectiveTTL
    });

    // Set expiration timer
    if (effectiveTTL > 0) {
      const timer = setTimeout(() => {
        this.delete(key);
      }, effectiveTTL);
      this.timers.set(key, timer);
    }
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }

    // Check if expired
    if (entry.ttl > 0 && Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key);
      return undefined;
    }

    return entry.value;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): boolean {
    this.clearTimer(key);
    return this.cache.delete(key);
  }

  clear(): void {
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    this.cache.clear();
  }

  size(): number {
    this.cleanExpired();
    return this.cache.size;
  }

  private clearTimer(key: string): void {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
  }

  private cleanExpired(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.ttl > 0 && now - entry.timestamp > entry.ttl) {
        this.delete(key);
      }
    }
  }

  // Get all non-expired values
  values(): T[] {
    this.cleanExpired();
    return Array.from(this.cache.values()).map(entry => entry.value);
  }

  // Get all non-expired keys
  keys(): string[] {
    this.cleanExpired();
    return Array.from(this.cache.keys());
  }

  // Get entries with metadata
  entries(): Array<[string, T, { age: number; ttl: number }]> {
    this.cleanExpired();
    const now = Date.now();
    
    return Array.from(this.cache.entries()).map(([key, entry]) => [
      key,
      entry.value,
      {
        age: now - entry.timestamp,
        ttl: entry.ttl
      }
    ]);
  }
}

// Specialized caches for different update types
export class SlideUpdateCache extends UpdateCache<any> {
  constructor() {
    super(5000); // 5 second TTL for slide updates
  }

  setSlideUpdate(slideId: string, updates: any): void {
    this.set(`slide_${slideId}`, updates);
  }

  getSlideUpdate(slideId: string): any | undefined {
    return this.get(`slide_${slideId}`);
  }

  clearSlideUpdate(slideId: string): boolean {
    return this.delete(`slide_${slideId}`);
  }
}

export class MessageCache extends UpdateCache<any> {
  constructor() {
    super(30000); // 30 second TTL for messages
  }

  addMessage(messageId: string, message: any): void {
    this.set(messageId, message);
  }

  getMessage(messageId: string): any | undefined {
    return this.get(messageId);
  }

  getRecentMessages(count: number = 10): any[] {
    const entries = this.entries()
      .sort((a, b) => a[2].age - b[2].age) // Sort by age (newest first)
      .slice(0, count);
    
    return entries.map(([, value]) => value);
  }
}

// Create singleton instances
export const slideUpdateCache = new SlideUpdateCache();
export const messageCache = new MessageCache();
export const generalCache = new UpdateCache();

// React hook for using cache
import { useState, useEffect, useCallback } from 'react';

export function useCache<T>(
  key: string,
  initialValue?: T,
  ttl?: number
): [T | undefined, (value: T) => void, () => void] {
  const [value, setValue] = useState<T | undefined>(() => 
    generalCache.get(key) ?? initialValue
  );

  useEffect(() => {
    // Check cache on mount
    const cached = generalCache.get(key);
    if (cached !== undefined) {
      setValue(cached as T);
    }
  }, [key]);

  const setCachedValue = useCallback((newValue: T) => {
    generalCache.set(key, newValue, ttl);
    setValue(newValue);
  }, [key, ttl]);

  const clearCachedValue = useCallback(() => {
    generalCache.delete(key);
    setValue(undefined);
  }, [key]);

  return [value, setCachedValue, clearCachedValue];
}