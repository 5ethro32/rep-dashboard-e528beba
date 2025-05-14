
/**
 * Storage utilities for optimized data handling
 * Provides better alternatives to localStorage for large datasets
 */

/**
 * Save data to IndexedDB for better performance with large datasets
 */
export const saveToIndexedDB = async (storeName: string, key: string, data: any): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open('engineRoomDB', 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      };
      
      request.onerror = (event) => {
        console.error('IndexedDB error:', event);
        reject(new Error('Failed to open IndexedDB'));
      };
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        const saveRequest = store.put(data, key);
        
        saveRequest.onsuccess = () => resolve(true);
        saveRequest.onerror = () => reject(new Error('Failed to save to IndexedDB'));
        
        transaction.oncomplete = () => db.close();
      };
    } catch (error) {
      console.error('IndexedDB save error:', error);
      // Fallback to localStorage if IndexedDB fails
      try {
        localStorage.setItem(key, JSON.stringify(data));
        resolve(true);
      } catch (fallbackError) {
        console.error('localStorage fallback error:', fallbackError);
        reject(fallbackError);
      }
    }
  });
};

/**
 * Load data from IndexedDB
 */
export const loadFromIndexedDB = async (storeName: string, key: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open('engineRoomDB', 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      };
      
      request.onerror = (event) => {
        console.error('IndexedDB error:', event);
        reject(new Error('Failed to open IndexedDB'));
      };
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Check if the store exists
        if (!db.objectStoreNames.contains(storeName)) {
          db.close();
          resolve(null);
          return;
        }
        
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        
        const getRequest = store.get(key);
        
        getRequest.onsuccess = () => {
          db.close();
          resolve(getRequest.result);
        };
        
        getRequest.onerror = () => {
          db.close();
          reject(new Error('Failed to get data from IndexedDB'));
        };
      };
    } catch (error) {
      console.error('IndexedDB load error:', error);
      // Fallback to localStorage if IndexedDB fails
      try {
        const data = localStorage.getItem(key);
        resolve(data ? JSON.parse(data) : null);
      } catch (fallbackError) {
        console.error('localStorage fallback error:', fallbackError);
        reject(fallbackError);
      }
    }
  });
};

/**
 * Clear data from IndexedDB and localStorage
 */
export const clearStoredData = async (storeName: string, key: string): Promise<boolean> => {
  // Clear from localStorage first as fallback
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
  
  // Then clear from IndexedDB
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open('engineRoomDB', 1);
      
      request.onerror = () => resolve(false);
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Check if the store exists
        if (!db.objectStoreNames.contains(storeName)) {
          db.close();
          resolve(true);
          return;
        }
        
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        const deleteRequest = store.delete(key);
        
        deleteRequest.onsuccess = () => resolve(true);
        deleteRequest.onerror = () => resolve(false);
        
        transaction.oncomplete = () => db.close();
      };
    } catch (error) {
      console.error('Failed to clear IndexedDB:', error);
      resolve(false);
    }
  });
};
