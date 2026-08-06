import { STORE_NAMES, TITAN_DB_NAME, TITAN_DB_VERSION, type DatabaseRecord, type StoreName } from './schema';

let databasePromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(TITAN_DB_NAME, TITAN_DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      Object.values(STORE_NAMES).forEach((storeName) => {
        if (!database.objectStoreNames.contains(storeName)) {
          database.createObjectStore(storeName, { keyPath: 'id' });
        }
      });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Não foi possível abrir o banco TITAN FIT.'));
    request.onblocked = () => reject(new Error('A atualização do banco está bloqueada por outra aba aberta.'));
  });

  return databasePromise;
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Falha ao acessar o banco local.'));
  });
}

export async function putRecord<T>(storeName: StoreName, id: string, value: T): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(storeName, 'readwrite');
  const record: DatabaseRecord<T> = { id, value, updatedAt: new Date().toISOString() };
  await requestToPromise(transaction.objectStore(storeName).put(record));
}

export async function getRecord<T>(storeName: StoreName, id: string): Promise<T | null> {
  const database = await openDatabase();
  const transaction = database.transaction(storeName, 'readonly');
  const record = await requestToPromise(transaction.objectStore(storeName).get(id)) as DatabaseRecord<T> | undefined;
  return record?.value ?? null;
}

export async function getAllRecords<T>(storeName: StoreName): Promise<Array<DatabaseRecord<T>>> {
  const database = await openDatabase();
  const transaction = database.transaction(storeName, 'readonly');
  return requestToPromise(transaction.objectStore(storeName).getAll()) as Promise<Array<DatabaseRecord<T>>>;
}

export async function deleteRecord(storeName: StoreName, id: string): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(storeName, 'readwrite');
  await requestToPromise(transaction.objectStore(storeName).delete(id));
}

export async function clearStore(storeName: StoreName): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(storeName, 'readwrite');
  await requestToPromise(transaction.objectStore(storeName).clear());
}

export async function isDatabaseAvailable(): Promise<boolean> {
  if (!('indexedDB' in window)) return false;
  try {
    await openDatabase();
    return true;
  } catch {
    return false;
  }
}
