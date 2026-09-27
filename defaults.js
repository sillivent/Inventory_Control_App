/**
 * Default Seed Configurations & Catalog Definitions
 */

export const DEFAULT_CATALOG = [
  {
    sku: "FBR-LC-LC-OM4-3M",
    name: "Fiber Patch LC-LC OM4 3m Aqua",
    category: "Fiber Cabling",
    vendorBarcode: "01088712398412",
    uom: "EA",
    unitsPerCarton: 10,
    cartonsPerBox: 5,
    minThreshold: 20,
    defaultLocationId: "LOC-HALL1-A01"
  },
  {
    sku: "FBR-LC-LC-SM-5M",
    name: "Fiber Patch LC-LC OS2 Single-Mode 5m Yellow",
    category: "Fiber Cabling",
    vendorBarcode: "01088712398999",
    uom: "EA",
    unitsPerCarton: 10,
    cartonsPerBox: 5,
    minThreshold: 15,
    defaultLocationId: "LOC-HALL1-A01"
  },
  {
    sku: "OPT-10G-SR-SFP",
    name: "10GBASE-SR SFP+ 850nm Transceiver",
    category: "Optics",
    vendorBarcode: "889523001928",
    uom: "EA",
    unitsPerCarton: 10,
    cartonsPerBox: 10,
    minThreshold: 30,
    defaultLocationId: "LOC-STOR-OPT01"
  },
  {
    sku: "OPT-100G-SR4-QSFP28",
    name: "100GBASE-SR4 QSFP28 Transceiver",
    category: "Optics",
    vendorBarcode: "889523004455",
    uom: "EA",
    unitsPerCarton: 5,
    cartonsPerBox: 4,
    minThreshold: 10,
    defaultLocationId: "LOC-STOR-OPT01"
  },
  {
    sku: "LBL-FBR-FLAG-ROLL",
    name: "Self-Laminating Fiber Flag Labels (Roll of 250)",
    category: "Labels",
    vendorBarcode: "772341992011",
    uom: "ROLL",
    unitsPerCarton: 4,
    cartonsPerBox: 6,
    minThreshold: 8,
    defaultLocationId: "LOC-ADMIN-SH1"
  },
  {
    sku: "LOCK-COMBO-RACK-01",
    name: "Server Cabinet Combination Cam Lock",
    category: "Cabinet Locks",
    vendorBarcode: "664319881120",
    uom: "EA",
    unitsPerCarton: 12,
    cartonsPerBox: 4,
    minThreshold: 10,
    defaultLocationId: "LOC-STOR-HW12"
  },
  {
    sku: "AIR-BLANKING-1U-BLK",
    name: "1U Snap-In Toolless Blanking Panels",
    category: "Air Containment",
    vendorBarcode: "553198229100",
    uom: "EA",
    unitsPerCarton: 10,
    cartonsPerBox: 5,
    minThreshold: 25,
    defaultLocationId: "LOC-INBOUND-DOCK"
  }
];

export const DEFAULT_LOCATIONS = [
  { id: "LOC-INBOUND-DOCK", site: "DC-01 (DFW)", room: "Inbound Staging", zone: "Dock Receiving Cage", barcode: "LOC-INBOUND-DOCK" },
  { id: "LOC-HALL1-A01", site: "DC-01 (DFW)", room: "Data Hall 1", zone: "Row 02 - Rack 04 - Bin A", barcode: "LOC-HALL1-A01" },
  { id: "LOC-HALL2-C14", site: "DC-01 (DFW)", room: "Data Hall 2", zone: "Row 14 - EPS Frame Bin", barcode: "LOC-HALL2-C14" },
  { id: "LOC-STOR-OPT01", site: "DC-01 (DFW)", room: "Storage Room 102", zone: "Optics Secure Cabinet - Bin 4", barcode: "LOC-STOR-OPT01" },
  { id: "LOC-STOR-HW12", site: "DC-01 (DFW)", room: "Storage Room 102", zone: "Hardware Spares - Bin 12", barcode: "LOC-STOR-HW12" },
  { id: "LOC-ADMIN-SH1", site: "DC-01 (DFW)", room: "Admin Tech Office", zone: "Supply Cabinet - Shelf 1", barcode: "LOC-ADMIN-SH1" }
];

export function getSeedEvents() {
  const now = Date.now();
  return [
    { id: "EVT-1001", type: "RECEIVED", sku: "FBR-LC-LC-OM4-3M", delta: 120, packagingTier: "BOX", locationId: "LOC-INBOUND-DOCK", techId: "SYSTEM", timestamp: new Date(now - 86400000 * 5).toISOString() },
    { id: "EVT-1002", type: "STORED", sku: "FBR-LC-LC-OM4-3M", delta: 80, packagingTier: "CARTON", locationId: "LOC-HALL1-A01", techId: "TECH-774", timestamp: new Date(now - 86400000 * 3).toISOString() },
    { id: "EVT-1003", type: "CONSUMED", sku: "FBR-LC-LC-OM4-3M", delta: -6, packagingTier: "ITEM", locationId: "LOC-HALL1-A01", techId: "TECH-774", reason: "Decom CR Patching", timestamp: new Date(now - 3600000 * 4).toISOString() },
    { id: "EVT-1004", type: "RECEIVED", sku: "OPT-10G-SR-SFP", delta: 100, packagingTier: "BOX", locationId: "LOC-INBOUND-DOCK", techId: "TECH-774", timestamp: new Date(now - 86400000 * 4).toISOString() },
    { id: "EVT-1005", type: "STORED", sku: "OPT-10G-SR-SFP", delta: 60, packagingTier: "CARTON", locationId: "LOC-STOR-OPT01", techId: "TECH-774", timestamp: new Date(now - 86400000 * 2).toISOString() },
    { id: "EVT-1006", type: "CONSUMED", sku: "OPT-10G-SR-SFP", delta: -4, packagingTier: "ITEM", locationId: "LOC-STOR-OPT01", techId: "TECH-774", timestamp: new Date(now - 3600000 * 8).toISOString() },
    { id: "EVT-1007", type: "RECEIVED", sku: "AIR-BLANKING-1U-BLK", delta: 50, packagingTier: "BOX", locationId: "LOC-INBOUND-DOCK", techId: "SYSTEM", timestamp: new Date(now - 86400000 * 4).toISOString() },
    { id: "EVT-1008", type: "STORED", sku: "AIR-BLANKING-1U-BLK", delta: 40, packagingTier: "CARTON", locationId: "LOC-HALL1-A01", techId: "TECH-774", timestamp: new Date(now - 86400000 * 1).toISOString() },
    { id: "EVT-1009", type: "CONSUMED", sku: "AIR-BLANKING-1U-BLK", delta: -10, packagingTier: "CARTON", locationId: "LOC-HALL1-A01", techId: "TECH-774", reason: "Containment aisle build", timestamp: new Date(now - 3600000 * 2).toISOString() },
    { id: "EVT-1010", type: "RECEIVED", sku: "LBL-FBR-FLAG-ROLL", delta: 16, packagingTier: "CARTON", locationId: "LOC-ADMIN-SH1", techId: "SYSTEM", timestamp: new Date(now - 86400000 * 6).toISOString() },
    { id: "EVT-1011", type: "CONSUMED", sku: "LBL-FBR-FLAG-ROLL", delta: -2, packagingTier: "ITEM", locationId: "LOC-ADMIN-SH1", techId: "TECH-774", reason: "Cabling labeling", timestamp: new Date(now - 3600000 * 14).toISOString() },
    { id: "EVT-1012", type: "RECEIVED", sku: "LOCK-COMBO-RACK-01", delta: 24, packagingTier: "CARTON", locationId: "LOC-STOR-HW12", techId: "SYSTEM", timestamp: new Date(now - 86400000 * 3).toISOString() }
  ];
}
