import { STORE_NAMES, TITAN_DB_NAME, TITAN_DB_VERSION, type DatabaseRecord, type StoreName } from './schema';

let databasePromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise;
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('IndexedDB não está disponível neste navegador.'));

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

    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () => {
      databasePromise = null;
      reject(request.error ?? new Error('Não foi possível abrir o banco TITAN FIT.'));
    };
    request.onblocked = () => {
      databasePromise = null;
      reject(new Error('A atualização do banco está bloqueada por outra aba aberta.'));
    };
  });

  return databasePromise;
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Falha ao acessar o banco local.'));
  });
}

function transactionToPromise(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Falha na transação do banco local.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('A transação do banco local foi cancelada.'));
  });
}

export async function putRecord<T>(storeName: StoreName, id: string, value: T): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(storeName, 'readwrite');
  const record: DatabaseRecord<T> = { id, value, updatedAt: new Date().toISOString() };
  transaction.objectStore(storeName).put(record);
  await transactionToPromise(transaction);
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
  transaction.objectStore(storeName).delete(id);
  await transactionToPromise(transaction);
}

export async function clearStore(storeName: StoreName): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(storeName, 'readwrite');
  transaction.objectStore(storeName).clear();
  await transactionToPromise(transaction);
}

export async function replaceAllStores(stores: Partial<Record<StoreName, Array<DatabaseRecord<unknown>>>>): Promise<void> {
  const database = await openDatabase();
  const storeNames = Object.values(STORE_NAMES);
  const transaction = database.transaction(storeNames, 'readwrite');

  for (const storeName of storeNames) {
    const objectStore = transaction.objectStore(storeName);
    objectStore.clear();
    for (const record of stores[storeName] ?? []) {
      objectStore.put(record);
    }
  }

  await transactionToPromise(transaction);
}

export async function isDatabaseAvailable(): Promise<boolean> {
  if (typeof indexedDB === 'undefined') return false;
  try {
    await openDatabase();
    return true;
  } catch {
    return false;
  }
}
