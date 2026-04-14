type DraftRecord = Record<number, { code?: string; audio?: Blob }>;

const DB_NAME = "ai-interview-db";
const STORE_NAME = "session-drafts";

function initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (e) => {
            const db = (e.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
        request.onerror = (e) => reject((e.target as IDBOpenDBRequest).error);
    });
}

export async function saveDrafts(sessionId: string, drafts: DraftRecord) {
    try {
        const db = await initDB();
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        store.put(drafts, sessionId);
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error);
        });
    } catch (error) {
        console.error("IndexedDB Save Error:", error);
    }
}

export async function getDrafts(sessionId: string): Promise<DraftRecord> {
    try {
        const db = await initDB();
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(sessionId);
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result || {});
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error("IndexedDB Get Error:", error);
        return {};
    }
}

export async function deleteDrafts(sessionId: string) {
    try {
        const db = await initDB();
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        store.delete(sessionId);
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error);
        });
    } catch (error) {
        console.error("IndexedDB Delete Error:", error);
    }
}
