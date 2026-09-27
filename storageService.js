import { STATE } from '../state/state.js';
import { showToast } from '../components/toast.js';

export async function handleConnectDualStorage(onSuccessCallback) {
  try {
    if (!('showDirectoryPicker' in window)) {
      showToast("File System API not supported in this frame. Falling back to persistent browser storage.", "info");
      saveToLocalStorage();
      updateStorageStatusUI(true, "Local & Shared Storage Active");
      if (onSuccessCallback) onSuccessCallback();
      return;
    }

    // Request root workspace directory
    const rootHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
    STATE.storage.rootHandle = rootHandle;

    // Create or bind the required local and shared folder pairs
    STATE.storage.catalogsLocalHandle = await rootHandle.getDirectoryHandle('catalogs_local', { create: true });
    STATE.storage.materialsLocalHandle = await rootHandle.getDirectoryHandle('materials_local', { create: true });
    STATE.storage.catalogsSharedHandle = await rootHandle.getDirectoryHandle('catalogs_shared', { create: true });
    STATE.storage.materialsSharedHandle = await rootHandle.getDirectoryHandle('materials_shared', { create: true });

    // Synchronize definitions into both directories
    await writeDualFile('catalogs_local', 'catalogs_shared', 'catalog_items.json', STATE.catalog);
    await writeDualFile('catalogs_local', 'catalogs_shared', 'locations.json', STATE.locations);

    updateStorageStatusUI(true, `✓ Synced: ${rootHandle.name}`);
    showToast(`Connected: catalogs_local/shared & materials_local/shared ready.`, "success");
    if (onSuccessCallback) onSuccessCallback();
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.warn("Storage connection notification:", err);
      saveToLocalStorage();
      updateStorageStatusUI(true, "Local Cache Active");
      showToast("Browser persistent storage enabled.", "info");
      if (onSuccessCallback) onSuccessCallback();
    }
  }
}

export function updateStorageStatusUI(connected, label) {
  STATE.storage.isConnected = connected;
  const btn = document.getElementById('connectStorageBtn');
  const text = document.getElementById('storageBtnText');
  if (text) text.textContent = label;
  if (connected && btn) {
    btn.classList.replace('bg-amber-500/10', 'bg-emerald-500/10');
    btn.classList.replace('border-amber-500/40', 'border-emerald-500/40');
    btn.classList.replace('text-amber-300', 'text-emerald-300');
  }
}

export async function writeDualFile(localDirKey, sharedDirKey, filename, data) {
  const payloadStr = JSON.stringify(data, null, 2);

  // Write to Local folder handle
  const localDir = STATE.storage[localDirKey + 'Handle'];
  if (localDir) {
    try {
      const fileHandle = await localDir.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(payloadStr);
      await writable.close();
    } catch (e) {
      console.warn(`Write failure in ${localDirKey}:`, e);
    }
  }

  // Write to Shared folder handle
  const sharedDir = STATE.storage[sharedDirKey + 'Handle'];
  if (sharedDir) {
    try {
      const fileHandle = await sharedDir.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(payloadStr);
      await writable.close();
    } catch (e) {
      console.warn(`Write failure in ${sharedDirKey}:`, e);
    }
  }
}

export async function appendAtomicMaterialEvent(eventData, onEventAppended) {
  STATE.events.push(eventData);
  saveToLocalStorage();

  // Write atomic transaction receipt to materials_local and materials_shared
  const timestamp = Date.now();
  const rand = Math.random().toString(36).substring(2, 7);
  const filename = `${timestamp}_${rand}_${eventData.type}_${eventData.sku || 'BATCH'}.json`;

  await writeDualFile('materials_local', 'materials_shared', filename, eventData);

  if (onEventAppended) {
    onEventAppended(eventData);
  }
}

export function saveToLocalStorage() {
  localStorage.setItem('DC_VAULT_CATALOG_LOCAL', JSON.stringify(STATE.catalog));
  localStorage.setItem('DC_VAULT_CATALOG_SHARED', JSON.stringify(STATE.catalog));
  localStorage.setItem('DC_VAULT_LOCATIONS_LOCAL', JSON.stringify(STATE.locations));
  localStorage.setItem('DC_VAULT_LOCATIONS_SHARED', JSON.stringify(STATE.locations));
  localStorage.setItem('DC_VAULT_MATERIALS_EVENTS', JSON.stringify(STATE.events));
}

export function loadFromLocalStorage() {
  const c = localStorage.getItem('DC_VAULT_CATALOG_LOCAL') || localStorage.getItem('DC_VAULT_CATALOG_SHARED');
  const l = localStorage.getItem('DC_VAULT_LOCATIONS_LOCAL') || localStorage.getItem('DC_VAULT_LOCATIONS_SHARED');
  const e = localStorage.getItem('DC_VAULT_MATERIALS_EVENTS');
  if (c) STATE.catalog = JSON.parse(c);
  if (l) STATE.locations = JSON.parse(l);
  if (e) STATE.events = JSON.parse(e);
}
