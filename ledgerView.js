import { STATE } from '../state/state.js';
import { calculateStockMatrix } from '../models/inventoryModel.js';
import { showToast } from '../components/toast.js';

export function renderLedgerTable() {
  const tbody = document.getElementById('ledgerTableBody');
  if (!tbody) return;

  const sorted = [...STATE.events].reverse();

  tbody.innerHTML = sorted.map(e => {
    const time = new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const date = new Date(e.timestamp).toLocaleDateString();

    let badgeClass = "bg-sky-950 text-sky-400 border-sky-800";
    if (e.type === 'CONSUMED') badgeClass = "bg-rose-950 text-rose-400 border-rose-800";
    if (e.type === 'RECEIVED') badgeClass = "bg-emerald-950 text-emerald-400 border-emerald-800";
    if (e.type === 'STORED') badgeClass = "bg-blue-950 text-blue-400 border-blue-800";
    if (e.type === 'MASS_RELOCATE') badgeClass = "bg-purple-950 text-purple-400 border-purple-800";

    if (e.type === 'MASS_RELOCATE') {
      const summary = e.transfers.map(t => `${t.sku} (${t.count})`).join(', ');
      return `
        <tr class="hover:bg-slate-800/30">
          <td class="py-2 px-3 text-slate-400 text-[11px]">${date} ${time}</td>
          <td class="py-2 px-3"><span class="px-1.5 py-0.5 rounded text-[10px] border ${badgeClass}">${e.type}</span></td>
          <td class="py-2 px-3 text-purple-300 font-bold">${summary}</td>
          <td class="py-2 px-3 text-slate-300">${e.sourceLocationId} &rarr; <span class="text-emerald-400">${e.targetLocationId}</span></td>
          <td class="py-2 px-3 text-center text-slate-400 font-bold">&bull;</td>
          <td class="py-2 px-3 text-right text-slate-400 text-[11px]">${e.techId}</td>
        </tr>
      `;
    }

    return `
      <tr class="hover:bg-slate-800/30">
        <td class="py-2 px-3 text-slate-400 text-[11px]">${date} ${time}</td>
        <td class="py-2 px-3"><span class="px-1.5 py-0.5 rounded text-[10px] border ${badgeClass}">${e.type}</span></td>
        <td class="py-2 px-3 text-white font-bold">${e.sku} <span class="text-slate-500 font-sans font-normal text-[10px]">(${e.reason || 'Delta'})</span></td>
        <td class="py-2 px-3 text-amber-400">${e.locationId}</td>
        <td class="py-2 px-3 text-center font-bold ${e.delta < 0 ? 'text-rose-400' : 'text-emerald-400'}">
          ${e.delta > 0 ? '+' + e.delta : e.delta} <span class="text-[10px] text-slate-500 font-normal">(${e.packagingTier || 'ITEM'})</span>
        </td>
        <td class="py-2 px-3 text-right text-slate-400 text-[11px]">${e.techId}</td>
      </tr>
    `;
  }).join('');
}

export function generateShiftHandoffDigest() {
  const matrix = calculateStockMatrix();
  const cutoff = Date.now() - (12 * 3600000);
  
  let digest = `### 📋 Shift Material Logistics Digest (${new Date().toLocaleDateString()})\n\n`;
  digest += `**Lead/Tech:** ${document.getElementById('techIdInput')?.value || STATE.techId}\n`;
  digest += `**Total Material SKUs Tracked:** ${STATE.catalog.length}\n\n`;
  
  digest += `#### 🔻 Floor Consumed (Past 12h):\n`;
  let hasConsumed = false;
  STATE.events.forEach(evt => {
    if ((evt.type === 'CONSUMED' || evt.delta < 0) && new Date(evt.timestamp).getTime() >= cutoff) {
      hasConsumed = true;
      digest += `• **${evt.sku}**: ${Math.abs(evt.delta)} EA at \`${evt.locationId}\` (${evt.reason || 'Floor Task'})\n`;
    }
  });
  if (!hasConsumed) digest += `• No floor consumption recorded this shift block.\n`;

  digest += `\n#### 📦 Floor Received / Restocked (Past 12h):\n`;
  let hasReceived = false;
  STATE.events.forEach(evt => {
    if ((evt.type === 'RECEIVED' || evt.type === 'STORED' || evt.delta > 0) && new Date(evt.timestamp).getTime() >= cutoff) {
      hasReceived = true;
      digest += `• **${evt.sku}**: +${evt.delta} EA into \`${evt.locationId}\` (${evt.packagingTier || 'ITEM'})\n`;
    }
  });
  if (!hasReceived) digest += `• No inbound receipts recorded this shift block.\n`;

  digest += `\n#### ⚠️ Current Below-Par Alerts:\n`;
  STATE.catalog.forEach(item => {
    const total = matrix[item.sku]?.total || 0;
    if (total < (item.minThreshold || 10)) {
      digest += `• **${item.name}** (\`${item.sku}\`): **${total} ${item.uom}** (Par: ${item.minThreshold})\n`;
    }
  });

  const dummy = document.createElement("textarea");
  document.body.appendChild(dummy);
  dummy.value = digest;
  dummy.select();
  document.execCommand("copy");
  document.body.removeChild(dummy);

  showToast("Shift Handoff Digest copied to clipboard!", "success");
}
