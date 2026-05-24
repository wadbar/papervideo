export class IndexedDBStorage {
  private dbName: string;
  private storeName: string;
  private db: IDBDatabase | null = null;
  private initializationPromise: Promise<void> | null = null;

  constructor(dbName = 'AssetCacheDB', storeName = 'highResFrames') {
    this.dbName = dbName;
    this.storeName = storeName;
  }

  private async init(): Promise<void> {
    if (this.db) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onerror = (event) => {
        console.error('[IndexedDBStorage] Failed to initialize DB', event);
        reject(request.error);
      };
    });

    return this.initializationPromise;
  }

  public async saveFrame(id: string, blob: Blob | ArrayBuffer | string): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) {
         return reject(new Error('DB not initialized'));
      }
      const transaction = this.db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put({ id, data: blob, timestamp: Date.now() });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async getFrame(id: string): Promise<Blob | ArrayBuffer | string | null> {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) {
         return reject(new Error('DB not initialized'));
      }
      const transaction = this.db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result ? request.result.data : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  public async purgeAll(): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
       if (!this.db) {
         return reject(new Error('DB not initialized'));
       }
       const transaction = this.db.transaction(this.storeName, 'readwrite');
       const store = transaction.objectStore(this.storeName);
       const request = store.clear();
       request.onsuccess = () => resolve();
       request.onerror = () => reject(request.error);
    });
  }
}

export const frameStorage = new IndexedDBStorage();
