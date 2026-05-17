export class DatabaseManager {
  constructor() {
    this.dbName = 'ChessGameDB';
    this.dbVersion = 1;
    this.db = null;
  }

  open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('gameRecords')) {
          const store = db.createObjectStore('gameRecords', { keyPath: 'id' });
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('mode', 'mode', { unique: false });
          store.createIndex('result', 'result', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        reject(new Error('Failed to open database: ' + event.target.error.message));
      };
    });
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  _createTransaction(storeName, mode) {
    if (!this.db) {
      throw new Error('Database not opened. Call open() first.');
    }
    return this.db.transaction(storeName, mode).objectStore(storeName);
  }

  add(storeName, item) {
    return new Promise((resolve, reject) => {
      try {
        const store = this._createTransaction(storeName, 'readwrite');
        const request = store.put(item);

        request.onsuccess = (event) => {
          resolve(event.target.result);
        };

        request.onerror = (event) => {
          reject(new Error('Failed to add item: ' + event.target.error.message));
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  getAll(storeName) {
    return new Promise((resolve, reject) => {
      try {
        const store = this._createTransaction(storeName, 'readonly');
        const request = store.getAll();

        request.onsuccess = (event) => {
          resolve(event.target.result);
        };

        request.onerror = (event) => {
          reject(new Error('Failed to get all items: ' + event.target.error.message));
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  getById(storeName, id) {
    return new Promise((resolve, reject) => {
      try {
        const store = this._createTransaction(storeName, 'readonly');
        const request = store.get(id);

        request.onsuccess = (event) => {
          resolve(event.target.result || null);
        };

        request.onerror = (event) => {
          reject(new Error('Failed to get item: ' + event.target.error.message));
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  deleteById(storeName, id) {
    return new Promise((resolve, reject) => {
      try {
        const store = this._createTransaction(storeName, 'readwrite');
        const request = store.delete(id);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = (event) => {
          reject(new Error('Failed to delete item: ' + event.target.error.message));
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  clear(storeName) {
    return new Promise((resolve, reject) => {
      try {
        const store = this._createTransaction(storeName, 'readwrite');
        const request = store.clear();

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = (event) => {
          reject(new Error('Failed to clear store: ' + event.target.error.message));
        };
      } catch (err) {
        reject(err);
      }
    });
  }
}
