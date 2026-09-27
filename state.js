import { DEFAULT_CATALOG, DEFAULT_LOCATIONS, getSeedEvents } from '../config/defaults.js';

export const STATE = {
  activeView: 'dashboard',
  techId: 'TECH-774',
  activeLocationId: 'LOC-HALL1-A01',
  selectedCategory: 'All',
  manifestQueue: [],

  // Dual Directory Storage Handles
  storage: {
    rootHandle: null,
    catalogsLocalHandle: null,
    materialsLocalHandle: null,
    catalogsSharedHandle: null,
    materialsSharedHandle: null,
    isConnected: false
  },

  catalog: [...DEFAULT_CATALOG],
  locations: [...DEFAULT_LOCATIONS],
  events: getSeedEvents()
};
