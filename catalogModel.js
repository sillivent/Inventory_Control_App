import { STATE } from '../state/state.js';
import { writeDualFile, saveToLocalStorage } from '../services/storageService.js';

export function findItemByBarcode(barcode) {
  const term = barcode.toLowerCase();
  return STATE.catalog.find(i => 
    i.sku.toLowerCase() === term || 
    (i.vendorBarcode && i.vendorBarcode.toLowerCase() === term)
  );
}

export async function addCatalogItem(itemData) {
  STATE.catalog.push(itemData);
  saveToLocalStorage();
  await writeDualFile('catalogs_local', 'catalogs_shared', 'catalog_items.json', STATE.catalog);
}
