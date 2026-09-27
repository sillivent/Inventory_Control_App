import { STATE } from '../state/state.js';

let inventoryChartInstance = null;

export function initInventoryChart() {
  const canvas = document.getElementById('inventoryTrendCanvas');
  if (!canvas || typeof Chart === 'undefined') return;

  const ctx = canvas.getContext('2d');
  if (inventoryChartInstance) inventoryChartInstance.destroy();

  inventoryChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Net Quantity Balance',
          data: [],
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.15)',
          borderWidth: 2.5,
          tension: 0.25,
          fill: true,
          yAxisID: 'y'
        },
        {
          label: 'Cumulative Received',
          data: [],
          borderColor: '#34d399',
          borderDash: [5, 5],
          borderWidth: 2,
          tension: 0.1,
          fill: false,
          yAxisID: 'y'
        },
        {
          label: 'Cumulative Consumed',
          data: [],
          borderColor: '#f87171',
          borderDash: [3, 3],
          borderWidth: 2,
          tension: 0.1,
          fill: false,
          yAxisID: 'y'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          labels: {
            color: '#94a3b8',
            font: { family: 'Inter', size: 11, weight: '600' }
          }
        },
        tooltip: {
          backgroundColor: '#0f172a',
          titleColor: '#38bdf8',
          bodyColor: '#e2e8f0',
          borderColor: '#334155',
          borderWidth: 1,
          padding: 10,
          displayColors: true
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(51, 65, 85, 0.3)' },
          ticks: { color: '#64748b', font: { family: 'JetBrains Mono', size: 10 } }
        },
        y: {
          grid: { color: 'rgba(51, 65, 85, 0.4)' },
          ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 10 } },
          title: {
            display: true,
            text: 'Physical Units (EA)',
            color: '#64748b',
            font: { size: 10, weight: 'bold' }
          }
        }
      }
    }
  });

  populateChartDropdowns();
  updateInventoryChart();
}

export function populateChartDropdowns() {
  const itemSelect = document.getElementById('chartItemFilter');
  const locSelect = document.getElementById('chartLocationFilter');

  if (itemSelect) {
    const current = itemSelect.value;
    itemSelect.innerHTML = `<option value="ALL">All Materials (Aggregate)</option>` +
      STATE.catalog.map(i => `<option value="${i.sku}">${i.name} (${i.sku})</option>`).join('');
    if (current) itemSelect.value = current;
  }

  if (locSelect) {
    const currentLoc = locSelect.value;
    locSelect.innerHTML = `<option value="ALL">All Locations Combined</option>` +
      STATE.locations.map(l => `<option value="${l.id}">${l.room} - ${l.zone} (${l.id})</option>`).join('');
    if (currentLoc) locSelect.value = currentLoc;
  }
}

export function updateInventoryChart() {
  if (!inventoryChartInstance) return;

  const itemFilter = document.getElementById('chartItemFilter')?.value || 'ALL';
  const locFilter = document.getElementById('chartLocationFilter')?.value || 'ALL';
  const windowFilter = document.getElementById('chartTimeWindowFilter')?.value || '7d';

  let hours = 168; // default 7 days
  if (windowFilter === '24h') hours = 24;
  if (windowFilter === '30d') hours = 720;

  const cutoffTime = Date.now() - (hours * 3600000);
  const points = 8;
  const stepMs = (hours * 3600000) / points;

  const timeLabels = [];
  const stockTrend = [];
  const receivedTrend = [];
  const consumedTrend = [];

  const relevantEvents = STATE.events.filter(e => {
    const matchItem = itemFilter === 'ALL' || e.sku === itemFilter || (e.transfers && e.transfers.some(t => t.sku === itemFilter));
    const matchLoc = locFilter === 'ALL' || e.locationId === locFilter || e.sourceLocationId === locFilter || e.targetLocationId === locFilter;
    return matchItem && matchLoc;
  });

  for (let i = 0; i <= points; i++) {
    const sampleTimestamp = cutoffTime + (i * stepMs);
    const dateObj = new Date(sampleTimestamp);
    
    let label = dateObj.toLocaleDateString([], { month: 'numeric', day: 'numeric' });
    if (hours <= 24) {
      label = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    timeLabels.push(label);

    let netQty = 0;
    let cumRec = 0;
    let cumCons = 0;

    relevantEvents.forEach(evt => {
      if (new Date(evt.timestamp).getTime() <= sampleTimestamp) {
        if (evt.type === 'RECEIVED' || evt.type === 'STORED' || evt.type === 'CONSUMED' || evt.type === 'INVENTORY_ADJUST') {
          if (itemFilter === 'ALL' || evt.sku === itemFilter) {
            if (locFilter === 'ALL' || evt.locationId === locFilter) {
              netQty += evt.delta;
              if (evt.type === 'RECEIVED' || evt.delta > 0) cumRec += evt.delta;
              if (evt.type === 'CONSUMED' || evt.delta < 0) cumCons += Math.abs(evt.delta);
            }
          }
        } else if (evt.type === 'MASS_RELOCATE') {
          evt.transfers.forEach(t => {
            if (itemFilter === 'ALL' || t.sku === itemFilter) {
              if (locFilter !== 'ALL') {
                if (evt.targetLocationId === locFilter) netQty += t.count;
                if (evt.sourceLocationId === locFilter) netQty -= t.count;
              }
            }
          });
        }
      }
    });

    stockTrend.push(netQty);
    receivedTrend.push(cumRec);
    consumedTrend.push(cumCons);
  }

  inventoryChartInstance.data.labels = timeLabels;
  inventoryChartInstance.data.datasets[0].data = stockTrend;
  inventoryChartInstance.data.datasets[1].data = receivedTrend;
  inventoryChartInstance.data.datasets[2].data = consumedTrend;
  inventoryChartInstance.update();
}
