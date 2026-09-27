import { STATE } from '../state/state.js';
import { writeDualFile, saveToLocalStorage } from '../services/storageService.js';

export function findLocationByBarcode(barcode) {
  const term = barcode.toLowerCase();
  return STATE.locations.find(l => 
    l.barcode.toLowerCase() === term || 
    l.id.toLowerCase() === term
  );
}

export async function addLocation(locationData) {
  STATE.locations.push(locationData);
  saveToLocalStorage();
  await writeDualFile('catalogs_local', 'catalogs_shared', 'locations.json', STATE.locations);
}
