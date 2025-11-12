/**
 * Performance Optimization Utilities
 * Tools for monitoring and optimizing app performance
 */

import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { InteractionManager, Platform, Image } from 'react-native';

/**
 * Run expensive operation after interactions complete
 */
export const runAfterInteractions = (callback: () => void): void => {
  InteractionManager.runAfterInteractions(callback);
};

/**
 * Hook to measure component render time
 */
export const useRenderTime = (componentName: string): void => {
  const renderStart = useRef(Date.now());

  useEffect(() => {
    if (__DEV__) {
      const renderTime = Date.now() - renderStart.current;
      if (renderTime > 16) {
        // Log slow renders (>16ms = <60fps)
        console.warn(`Slow render: ${componentName} took ${renderTime}ms`);
      }
      renderStart.current = Date.now();
    }
  });
};

/**
 * Hook to debounce expensive operations
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook to throttle rapid function calls
 */
export const useThrottle = <T extends (...args: never[]) => unknown>(
  callback: T,
  delay: number
): T => {
  const lastRun = useRef(Date.now());

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastRun.current >= delay) {
        lastRun.current = now;
        return callback(...args);
      }
    },
    [callback, delay]
  ) as T;
};

/**
 * Memoized component wrapper
 */
export const memo = <P extends object>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean
): React.MemoExoticComponent<React.ComponentType<P>> => {
  return React.memo(Component, propsAreEqual);
};

/**
 * Performance monitoring utility
 */
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  /**
   * Start measuring an operation
   */
  start(operationName: string): () => void {
    const startTime = Date.now();

    return () => {
      const duration = Date.now() - startTime;
      this.recordMetric(operationName, duration);

      if (__DEV__ && duration > 100) {
        console.warn(`Slow operation: ${operationName} took ${duration}ms`);
      }
    };
  }

  /**
   * Record a metric
   */
  private recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);

    // Keep only last 100 measurements
    const values = this.metrics.get(name)!;
    if (values.length > 100) {
      values.shift();
    }
  }

  /**
   * Get average metric value
   */
  getAverage(name: string): number {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return 0;

    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Record<string, { average: number; count: number }> {
    const result: Record<string, { average: number; count: number }> = {};

    this.metrics.forEach((values, name) => {
      result[name] = {
        average: this.getAverage(name),
        count: values.length,
      };
    });

    return result;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Image optimization utilities
 */
export const ImageOptimization = {
  /**
   * Get optimized image URL for screen size
   */
  getOptimizedImageUrl: (url: string, width: number, height: number): string => {
    // For TMDB images, use appropriate size
    if (url.includes('image.tmdb.org')) {
      const size = width > 500 ? 'original' : 'w500';
      return url.replace(/w\d+/, size);
    }
    return url;
  },

  /**
   * Prefetch images for better performance
   */
  prefetchImages: async (urls: string[]): Promise<void> => {
    if (Platform.OS === 'ios') {
      // Use native prefetching on iOS
      await Promise.all(urls.map((url) => Image.prefetch(url)));
    }
  },
};

/**
 * Memory management utilities
 */
export const MemoryManagement = {
  /**
   * Clear component cache on unmount
   */
  useClearOnUnmount: (clearFn: () => void): void => {
    useEffect(() => {
      return () => {
        clearFn();
      };
    }, [clearFn]);
  },

  /**
   * Limit array size to prevent memory bloat
   */
  limitArraySize: <T>(array: T[], maxSize: number): T[] => {
    return array.slice(-maxSize);
  },
};
