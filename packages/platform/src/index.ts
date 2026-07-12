export interface SaveStorage {
  load(key: string): Promise<string | null>;
  remove(key: string): Promise<void>;
  save(key: string, value: string): Promise<void>;
}

export class MemorySaveStorage implements SaveStorage {
  readonly #entries = new Map<string, string>();
  async load(key: string): Promise<string | null> {
    return this.#entries.get(key) ?? null;
  }
  async remove(key: string): Promise<void> {
    this.#entries.delete(key);
  }
  async save(key: string, value: string): Promise<void> {
    this.#entries.set(key, value);
  }
}

export class IndexedDbSaveStorage implements SaveStorage {
  constructor(private readonly database = 'dont-stop-the-line') {}
  async load(key: string): Promise<string | null> {
    return this.run('readonly', (store) => store.get(key));
  }
  async remove(key: string): Promise<void> {
    await this.run('readwrite', (store) => store.delete(key));
  }
  async save(key: string, value: string): Promise<void> {
    await this.run('readwrite', (store) => store.put(value, key));
  }
  private async run<T>(
    mode: IDBTransactionMode,
    action: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(this.database, 1);
      request.onupgradeneeded = () => request.result.createObjectStore('saves');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return new Promise<T>((resolve, reject) => {
      const request = action(database.transaction('saves', mode).objectStore('saves'));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}
