/**
 * Zebra HID Hardware Scanner Listener & Manual Simulation Service
 */

let scanBuffer = "";
let lastKeyTime = 0;

export function initScannerListener(onBarcodeScanned) {
  window.addEventListener('keydown', (e) => {
    if (e.key === "Shift" || e.key === "Control" || e.key === "Alt" || e.key === "Meta") return;
    
    const activeEl = document.activeElement;
    const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'SELECT' || activeEl.tagName === 'TEXTAREA');

    const currentTime = performance.now();
    const delta = currentTime - lastKeyTime;
    lastKeyTime = currentTime;

    // Reset buffer if standard user typing delay (>60ms) detected outside inputs
    if (delta > 60 && !isInput) {
      scanBuffer = "";
    }

    if (e.key === "Enter") {
      if (scanBuffer.length >= 3) {
        e.preventDefault();
        onBarcodeScanned(scanBuffer.trim());
        scanBuffer = "";
      }
    } else if (e.key.length === 1 && !isInput) {
      scanBuffer += e.key;
    }
  });

  const manualInput = document.getElementById('manualBarcodeInput');
  if (manualInput) {
    manualInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = manualInput.value.trim();
        if (val) {
          onBarcodeScanned(val);
          manualInput.value = "";
        }
      }
    });
  }
}

export function triggerManualSimulatedScan(onBarcodeScanned) {
  const input = document.getElementById('manualBarcodeInput');
  if (!input) return;
  const val = input.value.trim();
  if (!val) return;
  onBarcodeScanned(val);
  input.value = "";
}
