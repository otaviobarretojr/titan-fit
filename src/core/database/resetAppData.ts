import { clearStore } from './indexedDb';
import { STORE_NAMES } from './schema';

export async function resetAllAppData(): Promise<void> {
  localStorage.clear();
  await Promise.all(Object.values(STORE_NAMES).map((storeName) => clearStore(storeName)));
}
