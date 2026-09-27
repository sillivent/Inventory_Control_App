import { STATE } from '../state/state.js';
import { calculateStockMatrix, getMetricInWindow } from '../models/inventoryModel.js';
import { showToast } from '../components/toast.js';

export function renderDashboardTable() {
  const matrix = calculateStockMatrix();
  const tbody = document.getElementById('dashboardTableBody');
  const search = (document.getElementById('dashboardSearchInput')?.value || "").toLowerCase();
  
  const metricSkus = document.getElementById('metric-total-skus');
  if (metricSkus) metricSkus.textContent = STATE.catalog.length;
  
  let lowStockCount = 0;
  let total24hConsumed = 0;
  let total24hReceived = 0;

  Object.entries(matrix).forEach(([sku, data]) => {
    const item = STATE.catalog.find(i => i.sku === sku);
    if (item && data.total < (item.minThreshold || 10)) {
      lowStockCount++;
    }
    total24hConsumed += getMetricInWindow(data.consumedHistory, 24);
    total24hReceived += getMetricInWindow(data.receivedHistory, 24);
  });

  const lowStockEl = document.getElementById('metric-low-stock');
  const cons24El = document.getElementById('metric-24h-consumption');
  const rec24El = document.getElementById('metric-24h-received');

  if (lowStockEl) lowStockEl.textContent = lowStockCount;
  if (cons24El) cons24El.textContent = total24hConsumed;
  if (rec24El) rec24El.textContent = total24hReceived;

  let filtered = STATE.catalog;
  if (STATE.selectedCategory !== 'All') {
    filtered = filtered.filter(i => i.category === STATE.selectedCategory);
  }
  if (search) {
    filtered = filtered.filter(i => 
      i.name.toLowerCase().includes(search) || 
      i.sku.toLowerCase().includes(search) ||
      (i.vendorBarcode && i.vendorBarcode.toLowerCase().includes(search))
    );
  }

  if (!tbody) return;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-slate-500">No matching materials found in vault.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(item => {
    const data = matrix[item.sku] || { total: 0, byLocation: {}, consumedHistory: [], receivedHistory: [] };
    const rec24 = getMetricInWindow(data.receivedHistory, 24);
    const cons24 = getMetricInWindow(data.consumedHistory, 24);
    const cons7d = getMetricInWindow(data.consumedHistory, 168);
    const isLow = data.total < (item.minThreshold || 10);

    const assignedBins = Object.entries(data.byLocation).filter(([_, qty]) => qty > 0);
    const cartonUnits = item.unitsPerCarton || 1;

    return `
      <tr class="hover:bg-slate-800/40 transition">
        <td class="py-3 px-4">
          <div class="font-bold text-white text-xs">${item.name}</div>
          <div class="text-[11px] font-mono text-sky-400 mt-0.5 flex flex-wrap items-center gap-1.5">
            <span>${item.sku}</span>
            <span class="text-slate-600">&bull;</span>
            <span class="text-slate-400 font-sans">${item.category}</span>
            ${item.vendorBarcode ? `<span class="text-slate-500 text-[10px]">OEM: ${item.vendorBarcode}</span>` : ''}
          </div>
        </td>
        <td class="py-3 px-4">
          ${assignedBins.length === 0 ? '<span class="text-slate-600 italic">No Stock Assigned</span>' : ''}
          <div class="flex flex-wrap gap-1">
            ${assignedBins.map(([loc, count]) => `
              <span class="bg-slate-950 px-2 py-0.5 rounded text-[10px] font-mono border border-slate-800">
                ${loc}: <strong class="text-sky-300">${count}</strong>
              </span>
            `).join('')}
          </div>
        </td>
        <td class="py-3 px-4 text-center font-mono">
          <span class="font-extrabold text-sm ${isLow ? 'text-rose-400' : 'text-emerald-400'}">
            ${data.total}
          </span>
          <span class="text-[10px] text-slate-500">${item.uom}</span>
          ${isLow ? '<span class="block text-[8px] uppercase font-bold text-rose-500">Below Par</span>' : ''}
        </td>
        <td class="py-3 px-4 text-center font-mono text-emerald-300 font-semibold">${rec24}</td>
        <td class="py-3 px-4 text-center font-mono text-amber-300 font-semibold">${cons24}</td>
        <td class="py-3 px-4 text-center font-mono text-slate-400">${cons7d}</td>
        <td class="py-3 px-4 text-right">
          <div class="inline-flex rounded-lg border border-slate-700/80 bg-slate-950 p-0.5">
            <button onclick="window.recordQuickAdjustment('${item.sku}', -1, 'CONSUMED', 'ITEM', 'Manual Consumption')" title="Consume -1 Unit" class="hover:bg-rose-600 text-slate-300 hover:text-white px-2 py-1 rounded text-[11px] font-bold transition">-1</button>
            <button onclick="window.recordQuickAdjustment('${item.sku}', 1, 'STORED', 'ITEM', 'Manual Store')" title="Store +1 Unit" class="hover:bg-sky-600 text-slate-300 hover:text-white px-2 py-1 rounded text-[11px] font-bold transition border-l border-slate-800">+1</button>
            <button onclick="window.recordQuickAdjustment('${item.sku}', ${cartonUnits}, 'STORED', 'CARTON', 'Manual Store Carton')" title="Store +1 Carton (${cartonUnits})" class="hover:bg-emerald-600 text-slate-300 hover:text-white px-2 py-1 rounded text-[10px] font-bold transition border-l border-slate-800">+Ctn</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

export function renderCategoryFilters() {
  const container = document.getElementById('categoryFiltersContainer');
  if (!container) return;
  const categories = ['All', 'Fiber Cabling', 'Copper Cabling', 'Optics', 'Labels', 'Air Containment', 'Cabinet Locks', 'Hardware Spares'];
  
  container.innerHTML = categories.map(cat => `
    <button onclick="window.selectCategoryFilter('${cat}')" class="px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${STATE.selectedCategory === cat ? 'bg-sky-600 text-white shadow-sm' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'}">
      ${cat}
    </button>
  `).join('');
}

export function selectCategoryFilter(cat) {
  STATE.selectedCategory = cat;
  renderCategoryFilters();
  renderDashboardTable();
}

export function exportSnapshotCsv() {
  const matrix = calculateStockMatrix();
  let csv = "SKU,Description,Category,Total_Quantity,UOM,Primary_Bins,Consumed_24h,Received_24h\r\n";

  STATE.catalog.forEach(item => {
    const data = matrix[item.sku] || { total: 0, byLocation: {}, consumedHistory: [], receivedHistory: [] };
    const cons24 = getMetricInWindow(data.consumedHistory, 24);
    const rec24 = getMetricInWindow(data.receivedHistory, 24);
    const bins = Object.entries(data.byLocation).filter(([_, q]) => q > 0).map(([l, q]) => `${l}(${q})`).join('; ');
    
    csv += `"${item.sku}","${item.name}","${item.category}",${data.total},"${item.uom}","${bins}",${cons24},${rec24}\r\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `DC_Materials_Vault_Snapshot_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast("Inventory snapshot exported to CSV.", "success");
}
