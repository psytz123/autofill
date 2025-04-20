/**
 * Web Storage Adapter
 * Implements the storage adapter interface for web browsers
 */

import { IStorageAdapter } from '@shared/utils/storage';

/**
 * Local Storage Adapter for web platforms
 */
export class LocalStorageAdapter implements IStorageAdapter {
  /**
   * Get an item from localStorage
   */
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error getting item ${key} from localStorage:`, error);
      return null;
    }
  }
  
  /**
   * Set an item in localStorage
   */
  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error(`Error setting item ${key} in localStorage:`, error);
      throw error;
    }
  }
  
  /**
   * Remove an item from localStorage
   */
  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item ${key} from localStorage:`, error);
      throw error;
    }
  }
  
  /**
   * Clear all items from localStorage
   */
  async clear(): Promise<void> {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      throw error;
    }
  }
  
  /**
   * Get all keys from localStorage
   */
  async getAllKeys(): Promise<string[]> {
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error('Error getting all keys from localStorage:', error);
      return [];
    }
  }
}

/**
 * Session Storage Adapter for web platforms
 */
export class SessionStorageAdapter implements IStorageAdapter {
  /**
   * Get an item from sessionStorage
   */
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const value = sessionStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error getting item ${key} from sessionStorage:`, error);
      return null;
    }
  }
  
  /**
   * Set an item in sessionStorage
   */
  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      sessionStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error(`Error setting item ${key} in sessionStorage:`, error);
      throw error;
    }
  }
  
  /**
   * Remove an item from sessionStorage
   */
  async removeItem(key: string): Promise<void> {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item ${key} from sessionStorage:`, error);
      throw error;
    }
  }
  
  /**
   * Clear all items from sessionStorage
   */
  async clear(): Promise<void> {
    try {
      sessionStorage.clear();
    } catch (error) {
      console.error('Error clearing sessionStorage:', error);
      throw error;
    }
  }
  
  /**
   * Get all keys from sessionStorage
   */
  async getAllKeys(): Promise<string[]> {
    try {
      return Object.keys(sessionStorage);
    } catch (error) {
      console.error('Error getting all keys from sessionStorage:', error);
      return [];
    }
  }
}

/**
 * Memory Storage Adapter for web platforms
 * Useful for environments where localStorage/sessionStorage is not available
 */
export class MemoryStorageAdapter implements IStorageAdapter {
  private storage: Map<string, string> = new Map();
  
  /**
   * Get an item from memory
   */
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const value = this.storage.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error getting item ${key} from memory storage:`, error);
      return null;
    }
  }
  
  /**
   * Set an item in memory
   */
  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      this.storage.set(key, serializedValue);
    } catch (error) {
      console.error(`Error setting item ${key} in memory storage:`, error);
      throw error;
    }
  }
  
  /**
   * Remove an item from memory
   */
  async removeItem(key: string): Promise<void> {
    try {
      this.storage.delete(key);
    } catch (error) {
      console.error(`Error removing item ${key} from memory storage:`, error);
      throw error;
    }
  }
  
  /**
   * Clear all items from memory
   */
  async clear(): Promise<void> {
    try {
      this.storage.clear();
    } catch (error) {
      console.error('Error clearing memory storage:', error);
      throw error;
    }
  }
  
  /**
   * Get all keys from memory
   */
  async getAllKeys(): Promise<string[]> {
    try {
      return Array.from(this.storage.keys());
    } catch (error) {
      console.error('Error getting all keys from memory storage:', error);
      return [];
    }
  }
}

/**
 * Factory function to create a storage adapter based on availability
 */
export function createStorageAdapter(): IStorageAdapter {
  // Check if localStorage is available
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      // Test localStorage
      localStorage.setItem('__test__', '__test__');
      localStorage.removeItem('__test__');
      return new LocalStorageAdapter();
    } catch (error) {
      console.warn('localStorage is not available, falling back to memory storage');
    }
  }
  
  // Check if sessionStorage is available
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      // Test sessionStorage
      sessionStorage.setItem('__test__', '__test__');
      sessionStorage.removeItem('__test__');
      return new SessionStorageAdapter();
    } catch (error) {
      console.warn('sessionStorage is not available, falling back to memory storage');
    }
  }
  
  // Fall back to memory storage
  return new MemoryStorageAdapter();
}