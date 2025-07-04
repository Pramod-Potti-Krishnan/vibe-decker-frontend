import { SlideAsset } from './types/websocket-types';

export interface AssetLoadResult {
  asset: SlideAsset;
  loaded: boolean;
  error?: string;
}

export class SlideAssetLoader {
  private cache: Map<string, HTMLImageElement | HTMLVideoElement> = new Map();
  private loadingPromises: Map<string, Promise<AssetLoadResult>> = new Map();

  async loadAsset(asset: SlideAsset): Promise<AssetLoadResult> {
    // Check cache
    if (this.cache.has(asset.asset_id)) {
      return { asset, loaded: true };
    }

    // Check if already loading
    if (this.loadingPromises.has(asset.asset_id)) {
      return this.loadingPromises.get(asset.asset_id)!;
    }

    // Start loading
    const loadPromise = this.loadAssetInternal(asset);
    this.loadingPromises.set(asset.asset_id, loadPromise);

    try {
      const result = await loadPromise;
      this.loadingPromises.delete(asset.asset_id);
      return result;
    } catch (error) {
      this.loadingPromises.delete(asset.asset_id);
      throw error;
    }
  }

  private async loadAssetInternal(asset: SlideAsset): Promise<AssetLoadResult> {
    try {
      switch (asset.type) {
        case 'image':
          return await this.loadImage(asset);
        case 'video':
          return await this.loadVideo(asset);
        case 'chart':
        case 'icon':
          // For charts and icons, we might just validate the URL
          return { asset, loaded: true };
        default:
          return { asset, loaded: false, error: 'Unsupported asset type' };
      }
    } catch (error) {
      return {
        asset,
        loaded: false,
        error: error instanceof Error ? error.message : 'Failed to load asset'
      };
    }
  }

  private loadImage(asset: SlideAsset): Promise<AssetLoadResult> {
    return new Promise((resolve) => {
      const img = new Image();
      
      img.onload = () => {
        this.cache.set(asset.asset_id, img);
        resolve({ asset, loaded: true });
      };

      img.onerror = () => {
        resolve({
          asset,
          loaded: false,
          error: 'Failed to load image'
        });
      };

      // Set crossOrigin if needed
      if (this.isExternalUrl(asset.url)) {
        img.crossOrigin = 'anonymous';
      }

      img.src = asset.url;
    });
  }

  private loadVideo(asset: SlideAsset): Promise<AssetLoadResult> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      
      video.onloadedmetadata = () => {
        this.cache.set(asset.asset_id, video);
        resolve({ asset, loaded: true });
      };

      video.onerror = () => {
        resolve({
          asset,
          loaded: false,
          error: 'Failed to load video'
        });
      };

      // Set video properties
      video.preload = 'metadata';
      video.muted = true; // Required for autoplay in many browsers
      
      if (this.isExternalUrl(asset.url)) {
        video.crossOrigin = 'anonymous';
      }

      video.src = asset.url;
    });
  }

  async loadMultiple(assets: SlideAsset[]): Promise<AssetLoadResult[]> {
    const loadPromises = assets.map(asset => this.loadAsset(asset));
    return Promise.all(loadPromises);
  }

  // Preload assets for upcoming slides
  async preloadSlideAssets(
    assets: SlideAsset[],
    priority: 'high' | 'low' = 'low'
  ): Promise<void> {
    if (priority === 'high') {
      // Load all assets immediately
      await this.loadMultiple(assets);
    } else {
      // Load assets with idle callback
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
          this.loadMultiple(assets);
        });
      } else {
        // Fallback to setTimeout
        setTimeout(() => {
          this.loadMultiple(assets);
        }, 100);
      }
    }
  }

  getCachedAsset(assetId: string): HTMLImageElement | HTMLVideoElement | null {
    return this.cache.get(assetId) || null;
  }

  clearCache(): void {
    // Clean up video elements
    this.cache.forEach((element) => {
      if (element instanceof HTMLVideoElement) {
        element.pause();
        element.src = '';
        element.load();
      }
    });

    this.cache.clear();
    this.loadingPromises.clear();
  }

  private isExternalUrl(url: string): boolean {
    try {
      const assetUrl = new URL(url);
      const currentUrl = new URL(window.location.href);
      return assetUrl.origin !== currentUrl.origin;
    } catch {
      // If URL parsing fails, assume it's a relative URL
      return false;
    }
  }

  // Get optimal image size based on container
  getOptimalImageUrl(
    originalUrl: string,
    containerWidth: number,
    containerHeight: number
  ): string {
    // If the backend supports image resizing, append size parameters
    const url = new URL(originalUrl);
    
    // Calculate DPR-aware dimensions
    const dpr = window.devicePixelRatio || 1;
    const optimalWidth = Math.ceil(containerWidth * dpr);
    const optimalHeight = Math.ceil(containerHeight * dpr);

    // Add size parameters if not already present
    if (!url.searchParams.has('w')) {
      url.searchParams.set('w', optimalWidth.toString());
    }
    if (!url.searchParams.has('h')) {
      url.searchParams.set('h', optimalHeight.toString());
    }

    return url.toString();
  }
}

// Create singleton instance
export const slideAssetLoader = new SlideAssetLoader();

// React hook for asset loading
import { useEffect, useState } from 'react';

export function useSlideAssets(assets: SlideAsset[]) {
  const [loadedAssets, setLoadedAssets] = useState<Map<string, AssetLoadResult>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadAssets = async () => {
      setLoading(true);
      setError(null);

      try {
        const results = await slideAssetLoader.loadMultiple(assets);
        
        if (!cancelled) {
          const resultMap = new Map<string, AssetLoadResult>();
          results.forEach(result => {
            resultMap.set(result.asset.asset_id, result);
          });
          setLoadedAssets(resultMap);
          
          // Check for any errors
          const failedAssets = results.filter(r => !r.loaded);
          if (failedAssets.length > 0) {
            setError(`Failed to load ${failedAssets.length} asset(s)`);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load assets');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (assets.length > 0) {
      loadAssets();
    } else {
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [assets]);

  return { loadedAssets, loading, error };
}