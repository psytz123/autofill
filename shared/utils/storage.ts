/**
 * Shared Storage Utilities
 * Common functionality for storing and retrieving data across web and mobile platforms
 */

/**
 * Storage value types supported for serialization/deserialization
 */
export type StorageValue =
  | string
  | number
  | boolean
  | object
  | null
  | undefined;

/**
 * Storage item interface with expiration support
 */
export interface StorageItem<T extends StorageValue = StorageValue> {
  value: T;
  expiry?: number; // Unix timestamp in milliseconds for when the item expires
}

/**
 * Abstract interface for storage adapters
 * This allows us to use the same API across different platforms
 */
export interface IStorageAdapter {
  getItem<T extends StorageValue = StorageValue>(key: string): Promise<T | null>;
  setItem<T extends StorageValue = StorageValue>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
  getAllKeys(): Promise<string[]>;
}

/**
 * Storage adapter factory - will be implemented by platform-specific code
 */
export type StorageAdapterFactory = () => IStorageAdapter;

/**
 * StorageService provides a unified API for storage across platforms
 * with additional features like expiration, namespacing, and encryption
 */
export class StorageService {
  private adapter: IStorageAdapter;
  private namespace: string;
  
  /**
   * Create a new storage service
   * @param adapterFactory Function that creates a platform-specific adapter
   * @param namespace Optional namespace to prefix all keys
   */
  constructor(adapterFactory: StorageAdapterFactory, namespace = 'autofill') {
    this.adapter = adapterFactory();
    this.namespace = namespace;
  }
  
  /**
   * Generate a namespaced key
   */
  private getNamespacedKey(key: string): string {
    return `${this.namespace}:${key}`;
  }
  
  /**
   * Get a value from storage, respecting expiration
   * @param key The key to get
   * @param defaultValue Value to return if key is not found or expired
   */
  async get<T extends StorageValue = StorageValue>(
    key: string,
    defaultValue: T | null = null
  ): Promise<T | null> {
    const namespacedKey = this.getNamespacedKey(key);
    
    try {
      const itemJson = await this.adapter.getItem<string>(namespacedKey);
      
      if (!itemJson) {
        return defaultValue;
      }
      
      const storageItem: StorageItem<T> = JSON.parse(itemJson);
      
      // Check if the item has expired
      if (storageItem.expiry && storageItem.expiry < Date.now()) {
        // Item has expired, remove it
        await this.remove(key);
        return defaultValue;
      }
      
      return storageItem.value ?? defaultValue;
    } catch (error) {
      console.error(`Error retrieving item ${key} from storage:`, error);
      return defaultValue;
    }
  }
  
  /**
   * Set a value in storage with optional expiration
   * @param key The key to set
   * @param value The value to set
   * @param expiresInMs Optional expiration in milliseconds from now
   */
  async set<T extends StorageValue = StorageValue>(
    key: string,
    value: T,
    expiresInMs?: number
  ): Promise<void> {
    const namespacedKey = this.getNamespacedKey(key);
    
    try {
      const storageItem: StorageItem<T> = {
        value,
        // If expiration is specified, calculate the expiry timestamp
        ...(expiresInMs ? { expiry: Date.now() + expiresInMs } : {})
      };
      
      const itemJson = JSON.stringify(storageItem);
      await this.adapter.setItem(namespacedKey, itemJson);
    } catch (error) {
      console.error(`Error setting item ${key} in storage:`, error);
      throw error;
    }
  }
  
  /**
   * Remove a value from storage
   * @param key The key to remove
   */
  async remove(key: string): Promise<void> {
    const namespacedKey = this.getNamespacedKey(key);
    
    try {
      await this.adapter.removeItem(namespacedKey);
    } catch (error) {
      console.error(`Error removing item ${key} from storage:`, error);
      throw error;
    }
  }
  
  /**
   * Clear all values from the current namespace
   */
  async clearNamespace(): Promise<void> {
    try {
      const allKeys = await this.adapter.getAllKeys();
      const namespacedKeys = allKeys.filter(key => 
        key.startsWith(`${this.namespace}:`)
      );
      
      await Promise.all(namespacedKeys.map(key => 
        this.adapter.removeItem(key)
      ));
    } catch (error) {
      console.error(`Error clearing namespace ${this.namespace} from storage:`, error);
      throw error;
    }
  }
  
  /**
   * Clear all storage (use with caution)
   */
  async clearAll(): Promise<void> {
    try {
      await this.adapter.clear();
    } catch (error) {
      console.error('Error clearing all storage:', error);
      throw error;
    }
  }
  
  /**
   * Get all keys in the current namespace
   */
  async getKeys(): Promise<string[]> {
    try {
      const allKeys = await this.adapter.getAllKeys();
      const prefix = `${this.namespace}:`;
      
      return allKeys
        .filter(key => key.startsWith(prefix))
        .map(key => key.substring(prefix.length));
    } catch (error) {
      console.error(`Error getting keys for namespace ${this.namespace}:`, error);
      return [];
    }
  }
}

/**
 * Common storage keys used across the application
 * Defining them as constants prevents typos and makes refactoring easier
 */
export enum StorageKeys {
  // Auth related
  AUTH_TOKEN = 'auth_token',
  REFRESH_TOKEN = 'refresh_token',
  USER_INFO = 'user_info',
  
  // App preferences
  THEME = 'theme',
  LANGUAGE = 'language',
  NOTIFICATION_PREFERENCES = 'notification_preferences',
  
  // Feature flags
  FEATURE_FLAGS = 'feature_flags',
  
  // App state
  LAST_VIEWED_SCREEN = 'last_viewed_screen',
  ONBOARDING_COMPLETED = 'onboarding_completed',
  
  // Cache keys
  FUEL_PRICES_CACHE = 'fuel_prices_cache',
  LOCATIONS_CACHE = 'locations_cache',
  VEHICLES_CACHE = 'vehicles_cache'
}

/**
 * Default expiration times for different types of data (in milliseconds)
 */
export enum StorageExpiration {
  SHORT = 5 * 60 * 1000, // 5 minutes
  MEDIUM = 60 * 60 * 1000, // 1 hour
  LONG = 24 * 60 * 60 * 1000, // 1 day
  VERY_LONG = 7 * 24 * 60 * 60 * 1000, // 1 week
  PERMANENT = 0 // No expiration
}