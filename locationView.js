import { STATE } from '../state/state.js';
import { addLocation } from '../models/locationModel.js';
import { showToast } from '../components/toast.js';

export function renderLocationTable() {
  const tbody = document.getElementById('locationTableBody');
  const badge = document.getElementById('locationCountBadge');
  if (badge) badge.textContent = `${STATE.locations.length} Bins`;

  if (!tbody) return;

  tbody.innerHTML = STATE.locations.map(loc => `
    <tr class="hover:bg-slate-800/30 transition">
      <td class="py-2.5 px-3">
        <span class="text-emerald-400 font-bold">${loc.barcode}</span>
      </td>
      <td class="py-2.5 px-3 font-sans">
        <div class="font-bold text-white text-xs">${loc.room}</div>
        <div class="text-[10px] text-slate-500">${loc.site}</div>
      </td>
      <td class="py-2.5 px-3 font-sans text-xs text-slate-300">
        ${loc.zone}
      </td>
      <td class="py-2.5 px-3 text-right font-sans">
        <button onclick="window.openPrintModal('${loc.barcode}', '${loc.room} [${loc.zone}]', 'SHELF LOCATION BARCODE')" class="bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-semibold px-2.5 py-1 rounded text-xs transition">
          Print Bin Tag
        </button>
      </td>
    </tr>
  `).join('');

  const headerSelect = document.getElementById('headerActiveLocationSelect');
  if (headerSelect) {
    headerSelect.innerHTML = STATE.locations.map(l => `<option value="${l.id}">${l.id} (${l.room})</option>`).join('');
    headerSelect.value = STATE.activeLocationId;
  }
}

export async function handleCreateLocation(e, onCreatedCallback) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const id = fd.get('id').trim().toUpperCase();

  if (STATE.locations.some(l => l.id === id || l.barcode === id)) {
    showToast(`Location ID '${id}' already registered.`, "error");
    return;
  }

  const newLoc = {
    id,
    site: fd.get('site').trim(),
    room: fd.get('room').trim(),
    zone: fd.get('zone').trim(),
    barcode: id
  };

  await addLocation(newLoc);
  e.target.reset();
  showToast(`Location ${id} saved to catalogs_local and catalogs_shared.`, "success");

  if (onCreatedCallback) onCreatedCallback(newLoc);
}
