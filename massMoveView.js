import { STATE } from '../state/state.js';
import { calculateStockMatrix } from '../models/inventoryModel.js';
import { appendAtomicMaterialEvent } from '../services/storageService.js';
import { showToast } from '../components/toast.js';

export function populateMassMoveDropdowns() {
  const src = document.getElementById('massMoveSourceSelect');
  const tgt = document.getElementById('massMoveTargetSelect');
  const itemSelect = document.getElementById('massMoveItemSelect');

  if (!src || !tgt || !itemSelect) return;

  const locOptions = STATE.locations.map(l => `<option value="${l.id}">${l.room} - ${l.zone} (${l.id})</option>`).join('');
  src.innerHTML = locOptions;
  tgt.innerHTML = locOptions;

  if (STATE.locations.length > 1) {
    tgt.selectedIndex = 1;
  }

  itemSelect.innerHTML = STATE.catalog.map(i => `<option value="${i.sku}">${i.name} (${i.sku})</option>`).join('');
  refreshMassMoveAvailableItems();
}

export function refreshMassMoveAvailableItems() {
  const srcId = document.getElementById('massMoveSourceSelect')?.value;
  const matrix = calculateStockMatrix();
  const itemSku = document.getElementById('massMoveItemSelect')?.value;
  
  const available = matrix[itemSku]?.byLocation[srcId] || 0;
  const label = document.getElementById('sourceAvailableStockNotice');
  if (label) label.textContent = `Available at source: ${available} EA`;
}

export function addStageItemToManifest() {
  const itemSku = document.getElementById('massMoveItemSelect').value;
  const count = parseInt(document.getElementById('massMoveQtyInput').value, 10);
  const srcId = document.getElementById('massMoveSourceSelect').value;
  
  if (!count || count <= 0) {
    showToast("Enter a valid quantity greater than zero.", "error");
    return;
  }

  const matrix = calculateStockMatrix();
  const available = matrix[itemSku]?.byLocation[srcId] || 0;

  if (count > available) {
    showToast(`Warning: Requested ${count} exceeds on-hand balance (${available}) at source.`, "error");
    return;
  }

  const item = STATE.catalog.find(i => i.sku === itemSku);
  STATE.manifestQueue.push({
    sku: itemSku,
    name: item.name,
    count
  });

  renderManifestTable();
}

export function renderManifestTable() {
  const tbody = document.getElementById('massMoveManifestBody');
  if (!tbody) return;

  if (STATE.manifestQueue.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="py-4 text-center text-slate-500 font-sans">No items added to relocation manifest yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = STATE.manifestQueue.map((entry, idx) => `
    <tr class="hover:bg-slate-800/40">
      <td class="py-2.5 px-4 text-sky-400 font-bold">${entry.sku}</td>
      <td class="py-2.5 px-4 font-sans text-xs text-slate-300">${entry.name}</td>
      <td class="py-2.5 px-4 text-center font-bold text-white">${entry.count}</td>
      <td class="py-2.5 px-4 text-right font-sans">
        <button onclick="window.removeManifestItem(${idx})" class="text-rose-400 hover:text-rose-300 font-semibold text-xs">Remove</button>
      </td>
    </tr>
  `).join('');
}

export function removeManifestItem(idx) {
  STATE.manifestQueue.splice(idx, 1);
  renderManifestTable();
}

export async function commitMassRelocation(onCommitted) {
  if (STATE.manifestQueue.length === 0) {
    showToast("Manifest is empty. Add items before committing.", "error");
    return;
  }

  const src = document.getElementById('massMoveSourceSelect').value;
  const tgt = document.getElementById('massMoveTargetSelect').value;

  if (src === tgt) {
    showToast("Source and Target location bins cannot be identical.", "error");
    return;
  }

  const activeTech = document.getElementById('techIdInput')?.value || STATE.techId;
  const moveEvent = {
    id: "RELOC-" + Date.now().toString().slice(-6),
    type: "MASS_RELOCATE",
    sourceLocationId: src,
    targetLocationId: tgt,
    transfers: STATE.manifestQueue.map(m => ({ sku: m.sku, count: m.count })),
    techId: activeTech,
    timestamp: new Date().toISOString()
  };

  await appendAtomicMaterialEvent(moveEvent, onCommitted);
  STATE.manifestQueue = [];
  renderManifestTable();
  refreshMassMoveAvailableItems();
  showToast("Mass relocation committed to materials_local and materials_shared.", "success");
}
