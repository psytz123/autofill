/**
 * Mobile Storage Adapter
 * Implements the storage adapter interface for mobile apps using AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { IStorageAdapter } from '../../shared/utils/storage';

/**
 * AsyncStorage Adapter for React Native
 */
export class AsyncStorageAdapter implements IStorageAdapter {
  /**
   * Get an item from AsyncStorage
   */
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error getting item ${key} from AsyncStorage:`, error);
      return null;
    }
  }
  
  /**
   * Set an item in AsyncStorage
   */
  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error(`Error setting item ${key} in AsyncStorage:`, error);
      throw error;
    }
  }
  
  /**
   * Remove an item from AsyncStorage
   */
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item ${key} from AsyncStorage:`, error);
      throw error;
    }
  }
  
  /**
   * Clear all items from AsyncStorage
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing AsyncStorage:', error);
      throw error;
    }
  }
  
  /**
   * Get all keys from AsyncStorage
   */
  async getAllKeys(): Promise<string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Error getting all keys from AsyncStorage:', error);
      return [];
    }
  }
}

/**
 * Memory Storage Adapter for mobile
 * Useful for temporary storage or for tests
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
 * Factory function to create a storage adapter
 */
export function createStorageAdapter(): IStorageAdapter {
  try {
    // Verify AsyncStorage is available
    if (AsyncStorage) {
      return new AsyncStorageAdapter();
    }
  } catch (error) {
    console.warn('AsyncStorage is not available, falling back to memory storage');
  }
  
  // Fall back to memory storage
  return new MemoryStorageAdapter();
}