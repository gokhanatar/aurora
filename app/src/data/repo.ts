/** Repository — IndexedDB (fallback: bellek). Tüm store'lar docs/DATA_MODEL.md ile aynı adlarda. */
import type { Candidate, JournalEntry, PatternRecord, Stimulus, Study, Trial } from "./types";

const DB_NAME = "aurora";
const VERSION = 1;
const STORES = ["candidates", "stimuli", "studies", "trials", "journal", "patterns"] as const;
type StoreName = (typeof STORES)[number];
type KeyOf = { candidates: "id"; stimuli: "id"; studies: "id"; trials: "id"; journal: "date"; patterns: "id" };

const memory: Record<StoreName, Map<string, unknown>> = Object.fromEntries(STORES.map((s) => [s, new Map()])) as never;
let dbPromise: Promise<IDBDatabase | null> | null = null;

const open = (): Promise<IDBDatabase | null> => {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") return resolve(null);
      const req = indexedDB.open(DB_NAME, VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        const keys: KeyOf = { candidates: "id", stimuli: "id", studies: "id", trials: "id", journal: "date", patterns: "id" };
        for (const s of STORES) if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: keys[s] });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
};

const tx = async <T>(store: StoreName, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | null> => {
  const db = await open();
  if (!db) return null;
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(store, mode).objectStore(store));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

const makeRepo = <T extends object>(store: StoreName, key: keyof T) => ({
  async all(): Promise<T[]> {
    const r = await tx<T[]>(store, "readonly", (s) => s.getAll() as IDBRequest<T[]>);
    return r ?? ([...memory[store].values()] as T[]);
  },
  async get(id: string): Promise<T | undefined> {
    const r = await tx<T | undefined>(store, "readonly", (s) => s.get(id) as IDBRequest<T | undefined>);
    return r ?? (memory[store].get(id) as T | undefined);
  },
  async put(item: T): Promise<T> {
    const db = await open();
    if (db) await tx(store, "readwrite", (s) => s.put(item));
    else memory[store].set(String(item[key]), item);
    return item;
  },
  async remove(id: string): Promise<void> {
    const db = await open();
    if (db) await tx(store, "readwrite", (s) => s.delete(id));
    else memory[store].delete(id);
  },
  async clear(): Promise<void> {
    const db = await open();
    if (db) await tx(store, "readwrite", (s) => s.clear());
    else memory[store].clear();
  },
});

export const candidates = makeRepo<Candidate>("candidates", "id");
export const stimuli = makeRepo<Stimulus>("stimuli", "id");
export const studies = makeRepo<Study>("studies", "id");
export const trials = makeRepo<Trial>("trials", "id");
export const journal = makeRepo<JournalEntry>("journal", "date");
export const patterns = makeRepo<PatternRecord>("patterns", "id");

export const uid = (prefix: string): string => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
