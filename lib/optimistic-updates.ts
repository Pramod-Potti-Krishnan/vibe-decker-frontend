import { useState, useCallback, useRef } from 'react';

export interface OptimisticUpdate<T = any> {
  id: string;
  timestamp: number;
  originalValue: T;
  optimisticValue: T;
  rollback: () => void;
}

export interface OptimisticUpdateManager<T = any> {
  updates: Map<string, OptimisticUpdate<T>>;
  applyUpdate: (id: string, optimisticValue: T, originalValue: T) => () => void;
  rollbackUpdate: (id: string) => void;
  rollbackAll: () => void;
  getOptimisticValue: (id: string, defaultValue: T) => T;
  hasUpdate: (id: string) => boolean;
}

export function useOptimisticUpdates<T = any>(): OptimisticUpdateManager<T> {
  const [updates, setUpdates] = useState<Map<string, OptimisticUpdate<T>>>(new Map());
  const rollbackCallbacks = useRef<Map<string, () => void>>(new Map());

  const applyUpdate = useCallback((
    id: string,
    optimisticValue: T,
    originalValue: T
  ): (() => void) => {
    const timestamp = Date.now();
    
    // Create rollback function
    const rollback = () => {
      setUpdates(prev => {
        const newUpdates = new Map(prev);
        newUpdates.delete(id);
        return newUpdates;
      });
      rollbackCallbacks.current.delete(id);
    };

    // Store the update
    setUpdates(prev => {
      const newUpdates = new Map(prev);
      newUpdates.set(id, {
        id,
        timestamp,
        originalValue,
        optimisticValue,
        rollback
      });
      return newUpdates;
    });

    rollbackCallbacks.current.set(id, rollback);

    // Return rollback function
    return rollback;
  }, []);

  const rollbackUpdate = useCallback((id: string) => {
    const rollback = rollbackCallbacks.current.get(id);
    if (rollback) {
      rollback();
    }
  }, []);

  const rollbackAll = useCallback(() => {
    rollbackCallbacks.current.forEach(rollback => rollback());
    setUpdates(new Map());
    rollbackCallbacks.current.clear();
  }, []);

  const getOptimisticValue = useCallback((id: string, defaultValue: T): T => {
    const update = updates.get(id);
    return update ? update.optimisticValue : defaultValue;
  }, [updates]);

  const hasUpdate = useCallback((id: string): boolean => {
    return updates.has(id);
  }, [updates]);

  return {
    updates,
    applyUpdate,
    rollbackUpdate,
    rollbackAll,
    getOptimisticValue,
    hasUpdate
  };
}

// Optimistic update hooks for specific use cases
export function useOptimisticSlideUpdate() {
  const manager = useOptimisticUpdates<any>();

  const updateSlideOptimistically = useCallback(async (
    slideId: string,
    updates: any,
    applyActualUpdate: () => Promise<void>
  ) => {
    // Apply optimistic update
    const rollback = manager.applyUpdate(
      `slide_${slideId}`,
      updates,
      {} // Original value would be the current slide state
    );

    try {
      // Apply actual update
      await applyActualUpdate();
      
      // If successful, we can remove the optimistic update
      // as the real update should now be in place
      setTimeout(() => {
        manager.rollbackUpdate(`slide_${slideId}`);
      }, 100);
    } catch (error) {
      // On error, rollback the optimistic update
      rollback();
      throw error;
    }
  }, [manager]);

  return {
    ...manager,
    updateSlideOptimistically
  };
}

// Cache for optimistic updates
export class OptimisticCache<T = any> {
  private cache = new Map<string, T>();
  private timestamps = new Map<string, number>();
  private ttl: number;

  constructor(ttl: number = 5000) { // 5 seconds default TTL
    this.ttl = ttl;
  }

  set(key: string, value: T): void {
    this.cache.set(key, value);
    this.timestamps.set(key, Date.now());
    this.cleanup();
  }

  get(key: string): T | undefined {
    const timestamp = this.timestamps.get(key);
    if (timestamp && Date.now() - timestamp > this.ttl) {
      this.delete(key);
      return undefined;
    }
    return this.cache.get(key);
  }

  delete(key: string): void {
    this.cache.delete(key);
    this.timestamps.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.timestamps.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, timestamp] of this.timestamps.entries()) {
      if (now - timestamp > this.ttl) {
        this.delete(key);
      }
    }
  }
}

// Create singleton cache instance
export const optimisticCache = new OptimisticCache();

// Helper to merge optimistic updates with actual state
export function mergeOptimisticState<T extends Record<string, any>>(
  actualState: T,
  optimisticUpdates: Map<string, OptimisticUpdate<any>>,
  keyExtractor: (item: any) => string
): T {
  const merged = { ...actualState };

  // Apply optimistic updates
  optimisticUpdates.forEach((update, key) => {
    const [type, id] = key.split('_');
    
    switch (type) {
      case 'slide':
        if (Array.isArray(merged.slides)) {
          merged.slides = merged.slides.map(slide => 
            keyExtractor(slide) === id
              ? { ...slide, ...update.optimisticValue }
              : slide
          );
        }
        break;
        
      case 'metadata':
        if (merged.presentationMetadata) {
          merged.presentationMetadata = {
            ...merged.presentationMetadata,
            ...update.optimisticValue
          };
        }
        break;
        
      default:
        // Direct property update
        if (key in merged) {
          (merged as any)[key] = update.optimisticValue;
        }
    }
  });

  return merged;
}