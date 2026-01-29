/**
 * @typedef {Object} EnergyInOutBucket
 * @property {number|null} pv
 * @property {number|null} bess
 * @property {number|null} grid_import
 * @property {number|null} grid_export
 * @property {number|null} load
 */

/**
 * Site-level energy input/output view model for dashboard widgets.
 * @typedef {Object} EnergyInOutViewModel
 * @property {EnergyInOutBucket} daily
 * @property {EnergyInOutBucket} monthly
 * @property {EnergyInOutBucket} lifetime
 */

/**
 * Carbon credit view model consumed by CarbonCreditWidget.
 * @typedef {Object} CarbonCreditViewModel
 * @property {{ today_co2_saving: number|null, month_co2_saving: number|null, lifetime_co2_saving: number|null }} saving_summary
 * @property {{ today_pv_energy: number|null, month_pv_energy: number|null, lifetime_pv_energy: number|null, lifetime_ratio: number|null }} energy_summary
 */

/**
 * Realtime summary view model consumed by RealTimeWidget.
 * @typedef {Object} SiteRealtimeViewModel
 * @property {{ saving_summary: { today_saving: number|null, month_saving: number|null, year_saving: number|null }, energy_summary: CarbonCreditViewModel["energy_summary"] }} summary
 * @property {{ daily: number|null }} houseLoad
 * @property {EnergyInOutViewModel} energyData
 * @property {CarbonCreditViewModel} carbonCredit
 * @property {{ latitude: number|null, longitude: number|null, name?: string|null }} site_data
 * @property {Array<BatteryViewModel>} batteryData
 */

/**
 * Battery status view model consumed by BatteryWidget.
 * @typedef {Object} BatteryViewModel
 * @property {number|string|null} id
 * @property {string|null} name
 * @property {number|null} battery_percent
 * @property {number|null} voltage
 * @property {number|null} current
 * @property {number|null} temperature
 * @property {number|null} active_power
 * @property {number|null} daily
 * @property {number|null} monthly
 * @property {number|null} lifetime
 */

/**
 * Group timeline series keyed by UI categories.
 * @typedef {Object} GroupTimelineViewModel
 * @property {Array<{ key: string, value: number }>} grid
 * @property {Array<{ key: string, value: number }>} pv
 * @property {Array<{ key: string, value: number }>} bess
 * @property {Array<{ key: string, value: number }>} home_load
 */
