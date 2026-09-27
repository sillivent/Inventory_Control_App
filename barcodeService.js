/**
 * JsBarcode Wrapper for Code128 Label Generation
 */

export function renderBarcodeSvg(svgElement, code, options = {}) {
  if (!svgElement || typeof JsBarcode === 'undefined') return;

  const defaultOptions = {
    format: "CODE128",
    lineColor: "#000000",
    width: 2.2,
    height: 55,
    displayValue: true,
    fontSize: 14,
    font: '"JetBrains Mono", monospace',
    margin: 10
  };

  JsBarcode(svgElement, code, { ...defaultOptions, ...options });
}
