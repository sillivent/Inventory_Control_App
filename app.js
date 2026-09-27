/**
 * DC Materials Vault - Master Application Orchestrator
 */

import { STATE } from './state/state.js';
import { loadFromLocalStorage, handleConnectDualStorage } from './services/storageService.js';
import { initScannerListener, triggerManualSimulatedScan } from './services/scannerService.js';
import { findLocationByBarcode } from './models/locationModel.js';
import { findItemByBarcode } from './models/catalogModel.js';
import { calculateStockMatrix, recordQuickAdjustment } from './models/inventoryModel.js';
import { showToast } from './components/toast.js';
import { openPrintModal, closePrintModal } from './components/printModal.js';
import { initInventoryChart, populateChartDropdowns, updateInventoryChart } from './components/chartManager.js';
import { renderDashboardTable, renderCategoryFilters, selectCategoryFilter, exportSnapshotCsv } from './views/dashboardView.js';
import { renderCatalogTable, handleCreateCatalogItem, prefillNewCatalogItem } from './views/catalogView.js';
import { renderLocationTable, handleCreateLocation } from './views/locationView.js';
import { populateMassMoveDropdowns, refreshMassMoveAvailableItems, addStageItemToManifest, removeManifestItem, commitMassRelocation } from './views/massMoveView.js';
import { renderLedgerTable, generateShiftHandoffDigest } from './views/ledgerView.js';

// Expose event handlers to window for inline HTML integration
window.switchView = switchView;
window.handleConnectDualStorage = () => handleConnectDualStorage(refreshAllViews);
window.syncTechId = syncTechId;
window.setActiveLocation = setActiveLocation;
window.triggerManualSimulatedScan = () => triggerManualSimulatedScan(executeBarcodeResolution);
window.dismissScannerBanner = dismissScannerBanner;
window.recordQuickAdjustment = handleQuickAdjustment;
window.updateInventoryChart = updateInventoryChart;
window.renderDashboardTable = renderDashboardTable;
window.selectCategoryFilter = selectCategoryFilter;
window.exportSnapshotCsv = exportSnapshotCsv;
window.openPrintModal = openPrintModal;
window.closePrintModal = closePrintModal;
window.handleCreateCatalogItem = (e) => handleCreateCatalogItem(e, () => {
  renderCatalogTable();
  renderDashboardTable();
  populateMassMoveDropdowns();
  populateChartDropdowns();
});
window.prefillNewCatalogItem = prefillNewCatalogItem;
window.handleCreateLocation = (e) => handleCreateLocation(e, () => {
  renderLocationTable();
  populateMassMoveDropdowns();
  populateChartDropdowns();
});
window.refreshMassMoveAvailableItems = refreshMassMoveAvailableItems;
window.addStageItemToManifest = addStageItemToManifest;
window.removeManifestItem = removeManifestItem;
window.commitMassRelocation = () => commitMassRelocation(() => {
  renderDashboardTable();
  renderLedgerTable();
  updateInventoryChart();
});
window.generateShiftHandoffDigest = generateShiftHandoffDigest;

export function switchView(viewName) {
  STATE.activeView = viewName;

  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.remove('bg-sky-600', 'text-white', 'shadow-sm');
    tab.classList.add('text-slate-400');
  });
  const activeTab = document.getElementById(`tab-${viewName}`);
  if (activeTab) {
    activeTab.classList.add('bg-sky-600', 'text-white', 'shadow-sm');
    activeTab.classList.remove('text-slate-400');
  }

  ['dashboard', 'catalog', 'locations', 'massMove', 'ledger'].forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if (el) el.classList.add('hidden');
  });

  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) targetView.classList.remove('hidden');

  if (viewName === 'dashboard') {
    renderDashboardTable();
    updateInventoryChart();
  }
  if (viewName === 'catalog') renderCatalogTable();
  if (viewName === 'locations') renderLocationTable();
  if (viewName === 'massMove') populateMassMoveDropdowns();
  if (viewName === 'ledger') renderLedgerTable();
}

export function setActiveLocation(locId) {
  STATE.activeLocationId = locId;
  const select = document.getElementById('headerActiveLocationSelect');
  if (select) select.value = locId;
  const bannerTarget = document.getElementById('scannedLocationTarget');
  if (bannerTarget) bannerTarget.textContent = locId;
}

export function syncTechId(val) {
  STATE.techId = val.trim() || 'TECH-774';
  const mobileBadge = document.getElementById('mobileTechBadge');
  if (mobileBadge) mobileBadge.textContent = STATE.techId;
}

export function dismissScannerBanner() {
  const banner = document.getElementById('scannerBanner');
  if (banner) banner.classList.add('hidden');
}

export async function handleQuickAdjustment(sku, delta, actionType, packagingTier, reason) {
  await recordQuickAdjustment(sku, delta, actionType, packagingTier, reason, () => {
    renderDashboardTable();
    renderLedgerTable();
    updateInventoryChart();
  });

  const matrix = calculateStockMatrix();
  const updatedTotal = matrix[sku]?.total || 0;
  const stockBadge = document.getElementById('scannedStockCount');
  if (stockBadge) stockBadge.textContent = `${updatedTotal} EA`;

  showToast(`${actionType}: ${delta > 0 ? '+' + delta : delta} (${sku} at ${STATE.activeLocationId})`, delta > 0 ? "success" : "info");
}

export function executeBarcodeResolution(rawBarcode) {
  const term = rawBarcode.trim();
  const banner = document.getElementById('scannerBanner');
  const actionButtons = document.getElementById('scannerActionButtons');

  if (!banner || !actionButtons) return;

  // 1. Check if scan matches Location Barcode
  const matchedLoc = findLocationByBarcode(term);
  if (matchedLoc) {
    setActiveLocation(matchedLoc.id);
    banner.classList.remove('hidden');
    
    document.getElementById('scannedCategoryBadge').textContent = "LOCATION LOCKED";
    document.getElementById('scannedCategoryBadge').className = "text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800";
    document.getElementById('scannedItemName').textContent = `${matchedLoc.room} • ${matchedLoc.zone}`;
    document.getElementById('scannedSkuText').textContent = matchedLoc.id;
    document.getElementById('scannedLocationTarget').textContent = matchedLoc.site;
    document.getElementById('scannedStockCount').textContent = "READY FOR INGEST / DEPLOY";

    actionButtons.innerHTML = `
      <button onclick="window.dismissScannerBanner()" class="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold">
        Dismiss
      </button>
    `;

    showToast(`Work zone locked to: ${matchedLoc.room} (${matchedLoc.id})`, "success");
    return;
  }

  // 2. Check if matches Item SKU or OEM Vendor Barcode
  const matchedItem = findItemByBarcode(term);
  if (matchedItem) {
    const matrix = calculateStockMatrix();
    const currentStock = matrix[matchedItem.sku]?.total || 0;
    const cartonUnits = matchedItem.unitsPerCarton || 1;
    const boxUnits = cartonUnits * (matchedItem.cartonsPerBox || 1);

    banner.classList.remove('hidden');
    document.getElementById('scannedCategoryBadge').textContent = matchedItem.category;
    document.getElementById('scannedCategoryBadge').className = "text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800";
    document.getElementById('scannedItemName').textContent = matchedItem.name;
    document.getElementById('scannedSkuText').textContent = matchedItem.sku;
    document.getElementById('scannedLocationTarget').textContent = STATE.activeLocationId;
    document.getElementById('scannedStockCount').textContent = `${currentStock} ${matchedItem.uom}`;

    actionButtons.innerHTML = `
      <!-- Consumed -->
      <div class="inline-flex rounded-lg border border-rose-800/60 bg-rose-950/40 p-0.5">
        <button onclick="window.recordQuickAdjustment('${matchedItem.sku}', -1, 'CONSUMED', 'ITEM', 'Unit Deploy')" class="hover:bg-rose-600 text-rose-200 px-2.5 py-1 rounded text-xs font-bold transition">
          Consume -1
        </button>
        ${cartonUnits > 1 ? `
          <button onclick="window.recordQuickAdjustment('${matchedItem.sku}', -${cartonUnits}, 'CONSUMED', 'CARTON', 'Carton Deploy')" class="hover:bg-rose-600 text-rose-200 px-2 py-1 rounded text-[11px] font-bold transition border-l border-rose-800/60">
            -Ctn (${cartonUnits})
          </button>
        ` : ''}
      </div>

      <!-- Stored / Bin Ingest -->
      <div class="inline-flex rounded-lg border border-sky-800/60 bg-sky-950/40 p-0.5">
        <button onclick="window.recordQuickAdjustment('${matchedItem.sku}', 1, 'STORED', 'ITEM', 'Unit Bin Putaway')" class="hover:bg-sky-600 text-sky-200 px-2.5 py-1 rounded text-xs font-bold transition">
          Store +1
        </button>
        ${cartonUnits > 1 ? `
          <button onclick="window.recordQuickAdjustment('${matchedItem.sku}', ${cartonUnits}, 'STORED', 'CARTON', 'Carton Bin Putaway')" class="hover:bg-sky-600 text-sky-200 px-2 py-1 rounded text-[11px] font-bold transition border-l border-sky-800/60">
            +Ctn (${cartonUnits})
          </button>
        ` : ''}
        ${boxUnits > 1 ? `
          <button onclick="window.recordQuickAdjustment('${matchedItem.sku}', ${boxUnits}, 'STORED', 'BOX', 'Box Bin Putaway')" class="hover:bg-sky-600 text-sky-200 px-2 py-1 rounded text-[11px] font-bold transition border-l border-sky-800/60">
            +Box (${boxUnits})
          </button>
        ` : ''}
      </div>

      <!-- Received / Inbound Dock Ingest -->
      <div class="inline-flex rounded-lg border border-emerald-800/60 bg-emerald-950/40 p-0.5">
        <button onclick="window.recordQuickAdjustment('${matchedItem.sku}', 1, 'RECEIVED', 'ITEM', 'Unit Received Inbound')" class="hover:bg-emerald-600 text-emerald-200 px-2.5 py-1 rounded text-xs font-bold transition">
          Receive +1
        </button>
        ${cartonUnits > 1 ? `
          <button onclick="window.recordQuickAdjustment('${matchedItem.sku}', ${cartonUnits}, 'RECEIVED', 'CARTON', 'Carton Received Inbound')" class="hover:bg-emerald-600 text-emerald-200 px-2 py-1 rounded text-[11px] font-bold transition border-l border-emerald-800/60">
            +Ctn (${cartonUnits})
          </button>
        ` : ''}
        ${boxUnits > 1 ? `
          <button onclick="window.recordQuickAdjustment('${matchedItem.sku}', ${boxUnits}, 'RECEIVED', 'BOX', 'Box Received Inbound')" class="hover:bg-emerald-600 text-emerald-200 px-2 py-1 rounded text-[11px] font-bold transition border-l border-emerald-800/60">
            +Box (${boxUnits})
          </button>
        ` : ''}
      </div>

      <button onclick="window.dismissScannerBanner()" class="bg-slate-800 hover:bg-slate-700 text-slate-400 px-2 py-1 rounded-lg text-xs">
        &times;
      </button>
    `;

    showToast(`Recognized: ${matchedItem.name}`, "info");
    return;
  }

  // 3. Unrecognized Barcode
  banner.classList.remove('hidden');
  document.getElementById('scannedCategoryBadge').textContent = "UNKNOWN CODE";
  document.getElementById('scannedCategoryBadge').className = "text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800";
  document.getElementById('scannedItemName').textContent = "Unregistered Barcode Scanned";
  document.getElementById('scannedSkuText').textContent = term;
  document.getElementById('scannedLocationTarget').textContent = "N/A";
  document.getElementById('scannedStockCount').textContent = "0";

  actionButtons.innerHTML = `
    <button onclick="window.prefillNewCatalogItem('${term}')" class="bg-sky-600 hover:bg-sky-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs">
      + Register New SKU
    </button>
    <button onclick="window.dismissScannerBanner()" class="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs">
      Dismiss
    </button>
  `;
  showToast(`Unrecognized barcode: ${term}`, "error");
}

export function refreshAllViews() {
  renderCategoryFilters();
  renderLocationTable();
  renderCatalogTable();
  populateMassMoveDropdowns();
  renderDashboardTable();
  renderLedgerTable();
  initInventoryChart();
}

window.addEventListener('DOMContentLoaded', () => {
  loadFromLocalStorage();
  initScannerListener(executeBarcodeResolution);
  refreshAllViews();
});
