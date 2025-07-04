/**
 * Feature flag system for gradual API rollout
 */

export class FeatureFlags {
  /**
   * Checks if real API should be used instead of mock
   */
  static useRealAPI(): boolean {
    return process.env.NEXT_PUBLIC_USE_REAL_API === 'true'
  }

  /**
   * Checks if WebSocket connection should be enabled
   */
  static useWebSocket(): boolean {
    return this.useRealAPI() && typeof window !== 'undefined' && 'WebSocket' in window
  }

  /**
   * Checks if enhanced error handling should be enabled
   */
  static useEnhancedErrorHandling(): boolean {
    return process.env.NEXT_PUBLIC_ENHANCED_ERRORS === 'true'
  }

  /**
   * Checks if debug mode is enabled
   */
  static isDebugMode(): boolean {
    return process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG === 'true'
  }

  /**
   * Logs feature flag status for debugging
   */
  static logStatus(): void {
    if (this.isDebugMode()) {
      console.log('[FeatureFlags] Status:', {
        useRealAPI: this.useRealAPI(),
        useWebSocket: this.useWebSocket(),
        enhancedErrors: this.useEnhancedErrorHandling(),
        debugMode: this.isDebugMode()
      })
    }
  }

  /**
   * Gets all feature flags as an object
   */
  static getAll() {
    return {
      useRealAPI: this.useRealAPI(),
      useWebSocket: this.useWebSocket(),
      enhancedErrors: this.useEnhancedErrorHandling(),
      debugMode: this.isDebugMode()
    }
  }
}

// Export individual flags for convenience
export const useRealAPI = () => FeatureFlags.useRealAPI()
export const useWebSocket = () => FeatureFlags.useWebSocket()
export const isDebugMode = () => FeatureFlags.isDebugMode()