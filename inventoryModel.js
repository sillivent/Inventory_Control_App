import { STATE } from '../state/state.js';
import { appendAtomicMaterialEvent } from '../services/storageService.js';

export function calculateStockMatrix() {
  const matrix = {};

  STATE.catalog.forEach(item => {
    matrix[item.sku] = {
      total: 0,
      byLocation: {},
      consumedHistory: [],
      receivedHistory: [],
      storedHistory: []
    };
  });

  STATE.events.forEach(evt => {
    const { type, sku, delta, locationId, timestamp } = evt;

    if (type === 'RECEIVED' || type === 'STORED' || type === 'CONSUMED' || type === 'INVENTORY_ADJUST') {
      if (!matrix[sku]) {
        matrix[sku] = { total: 0, byLocation: {}, consumedHistory: [], receivedHistory: [], storedHistory: [] };
      }
      matrix[sku].total += delta;
      matrix[sku].byLocation[locationId] = (matrix[sku].byLocation[locationId] || 0) + delta;

      const timeVal = new Date(timestamp).getTime();

      if (delta < 0 || type === 'CONSUMED') {
        matrix[sku].consumedHistory.push({ count: Math.abs(delta), timestamp: timeVal, locationId });
      } else if (type === 'RECEIVED') {
        matrix[sku].receivedHistory.push({ count: delta, timestamp: timeVal, locationId });
      } else if (type === 'STORED') {
        matrix[sku].storedHistory.push({ count: delta, timestamp: timeVal, locationId });
      }
    } else if (type === 'MASS_RELOCATE') {
      const { sourceLocationId, targetLocationId, transfers } = evt;
      transfers.forEach(({ sku: mSku, count }) => {
        if (matrix[mSku]) {
          matrix[mSku].byLocation[sourceLocationId] = (matrix[mSku].byLocation[sourceLocationId] || 0) - count;
          matrix[mSku].byLocation[targetLocationId] = (matrix[mSku].byLocation[targetLocationId] || 0) + count;
        }
      });
    }
  });

  return matrix;
}

export function getMetricInWindow(historyArray, hours, locationFilter = 'ALL') {
  const cutoff = Date.now() - (hours * 3600000);
  return (historyArray || [])
    .filter(c => c.timestamp >= cutoff && (locationFilter === 'ALL' || c.locationId === locationFilter))
    .reduce((acc, c) => acc + c.count, 0);
}

export async function recordQuickAdjustment(sku, delta, actionType, packagingTier, reason, onDone) {
  const activeTech = document.getElementById('techIdInput')?.value || STATE.techId;
  
  const newEvent = {
    id: "EVT-" + Date.now().toString().slice(-6),
    type: actionType, // STORED, RECEIVED, CONSUMED
    sku,
    delta: parseInt(delta, 10),
    packagingTier: packagingTier || "ITEM",
    locationId: STATE.activeLocationId,
    techId: activeTech,
    reason: reason || `${actionType} via Scanner Wedge`,
    timestamp: new Date().toISOString()
  };

  await appendAtomicMaterialEvent(newEvent, onDone);
}
