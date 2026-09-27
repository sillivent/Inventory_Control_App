import { STATE } from '../state/state.js';
import { addCatalogItem } from '../models/catalogModel.js';
import { showToast } from '../components/toast.js';

export function renderCatalogTable() {
  const tbody = document.getElementById('catalogTableBody');
  const badge = document.getElementById('catalogCountBadge');
  if (badge) badge.textContent = `${STATE.catalog.length} SKUs`;

  if (!tbody) return;

  tbody.innerHTML = STATE.catalog.map(item => {
    const cartonUnits = item.unitsPerCarton || 1;
    const boxUnits = cartonUnits * (item.cartonsPerBox || 1);

    return `
      <tr class="hover:bg-slate-800/30 transition">
        <td class="py-2.5 px-3">
          <span class="text-sky-400 font-bold">${item.sku}</span>
          ${item.vendorBarcode ? `<div class="text-[10px] text-slate-500 font-sans">OEM: ${item.vendorBarcode}</div>` : ''}
        </td>
        <td class="py-2.5 px-3 font-sans">
          <div class="font-bold text-white text-xs">${item.name}</div>
          <div class="text-[10px] text-slate-400">${item.category} &bull; Par: ${item.minThreshold || 10} ${item.uom}</div>
        </td>
        <td class="py-2.5 px-3 text-[11px]">
          <span class="text-slate-300">1 Ctn = <strong>${cartonUnits}</strong> EA</span> | 
          <span class="text-slate-400">1 Box = <strong>${boxUnits}</strong> EA</span>
        </td>
        <td class="py-2.5 px-3 text-right font-sans">
          <button onclick="window.openPrintModal('${item.sku}', '${item.name}', 'MATERIAL SKU TAG')" class="bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 font-semibold px-2.5 py-1 rounded text-xs transition">
            Print Barcode
          </button>
        </td>
      </tr>
    `;
  }).join('');

  const select = document.getElementById('newDefaultLocationSelect');
  if (select) {
    select.innerHTML = STATE.locations.map(l => `<option value="${l.id}">${l.room} - ${l.zone} (${l.id})</option>`).join('');
  }
}

export async function handleCreateCatalogItem(e, onCreatedCallback) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const sku = fd.get('sku').trim().toUpperCase();

  if (STATE.catalog.some(i => i.sku === sku)) {
    showToast(`SKU '${sku}' already exists in catalog.`, "error");
    return;
  }

  const newItem = {
    sku,
    name: fd.get('name').trim(),
    vendorBarcode: fd.get('vendorBarcode').trim() || null,
    category: fd.get('category'),
    uom: "EA",
    unitsPerCarton: parseInt(fd.get('unitsPerCarton'), 10) || 10,
    cartonsPerBox: parseInt(fd.get('cartonsPerBox'), 10) || 5,
    minThreshold: parseInt(fd.get('minThreshold'), 10) || 15,
    defaultLocationId: fd.get('defaultLocationId')
  };

  await addCatalogItem(newItem);
  e.target.reset();
  showToast(`SKU ${sku} saved to catalogs_local and catalogs_shared.`, "success");

  if (onCreatedCallback) onCreatedCallback(newItem);
}

export function prefillNewCatalogItem(unknownBarcode) {
  if (window.switchView) window.switchView('catalog');
  const input = document.getElementById('newVendorBarcodeInput');
  if (input) input.value = unknownBarcode;
}
