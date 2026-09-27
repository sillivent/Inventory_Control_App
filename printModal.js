import { renderBarcodeSvg } from '../services/barcodeService.js';

export function openPrintModal(code, title, tagType) {
  const root = document.getElementById('printModalRoot');
  const svg = document.getElementById('modalBarcodeSvg');
  
  if (!root || !svg) return;

  document.getElementById('printModalTypeTag').textContent = tagType;
  document.getElementById('printModalTitle').textContent = title;
  document.getElementById('printModalSubtitle').textContent = code;

  renderBarcodeSvg(svg, code);

  root.classList.remove('hidden');
}

export function closePrintModal() {
  const root = document.getElementById('printModalRoot');
  if (root) root.classList.add('hidden');
}
