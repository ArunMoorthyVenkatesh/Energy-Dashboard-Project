/**
 * Map a site_realtime_state WebSocket event into dashboard view models without computing new values.
 * @param {any} event
 * @returns {import("./viewModels.js").SiteRealtimeViewModel|null}
 */
export function mapSiteRealtimeEvent(event) {
  if (!event || event.type !== "site_realtime_state") return null;

  const payload = event.payload || {};
  const power = payload.power || {};
  const energySaving = payload.energy_saving || {};
  const carbonCredit = payload.carbon_credit || {};

  // ✅ Helper to safely convert watts to kW
  const toKw = (value) => {
    if (value === null || value === undefined) return 0;
    const num = Number(value);
    return Number.isFinite(num) ? num / 1000 : 0;
  };

  const mapBucket = (bucket) => {
    if (!bucket) {
      return {
        pv: 0,
        bess: 0,
        grid_import: 0,
        grid_export: 0,
        load: 0
      };
    }

    // ✅ FIXED: Use actual WebSocket field names
    return {
      pv: toKw(bucket.solar),
      bess: toKw(bucket.battery_discharge) - toKw(bucket.battery_charge), // Net battery (discharge - charge)
      grid_import: toKw(bucket.grid_import),      // ✅ FIXED: was bucket.grid
      grid_export: toKw(bucket.grid_export),      // ✅ FIXED: now using actual field
      load: toKw(bucket.load)
    };
  };

  // ✅ Map live/real-time data for the Energy In/Out widget
  const mapLiveData = (nowBucket) => {
    if (!nowBucket) {
      return {
        solar: 0,
        battery: 0,
        battery_charge: 0,
        grid_import: 0,
        load: 0,
        grid_export: 0,
      };
    }

    return {
      solar: toKw(nowBucket.solar),
      battery: toKw(nowBucket.battery_discharge) - toKw(nowBucket.battery_charge),
      battery_charge: toKw(nowBucket.battery_charge),
      grid_import: toKw(nowBucket.grid_import),   // ✅ FIXED
      load: toKw(nowBucket.load),
      grid_export: toKw(nowBucket.grid_export),   // ✅ FIXED
    };
  };

  // ✅ Map solar panels (PV devices)
  const solarPanels = Array.isArray(payload.solar_panels)
    ? payload.solar_panels.map((panel) => ({
        id: panel.id ?? panel.deviceId ?? null,
        name: panel.name ?? panel.deviceId ?? 'Solar Panel',
        status: panel.status ?? 'unknown',
        power_kw: panel.power_kw ?? panel.power ?? null,
        daily: panel.daily ?? null,
        monthly: panel.monthly ?? null,
        lifetime: panel.lifetime ?? null,
      }))
    : [];

  // ✅ Map batteries with proper structure
  const batteries = Array.isArray(payload.batteries)
    ? payload.batteries.map((batt) => ({
        id: batt.id ?? batt.deviceId ?? null,
        name: batt.name ?? batt.deviceId ?? 'Battery',
        battery_percent: batt.battery_percent ?? batt.state_of_charge ?? null,
        voltage: batt.voltage ?? null,
        current: batt.current ?? null,
        temperature: batt.temperature ?? null,
        active_power: batt.active_power ?? null,
        capacity: batt.capacity ?? null,
        state: batt.state ?? 'unknown',
        status: batt.status ?? 'unknown',
        daily: batt.daily ?? null,
        monthly: batt.monthly ?? null,
        lifetime: batt.lifetime ?? null
      }))
    : [];

  return {
    energyData: {
      // ✅ Live power data for EnergyInOutWidget
      power: {
        now: mapLiveData(power.now),
        row: mapLiveData(power.now),
      },
      daily: mapBucket(power.day),
      monthly: mapBucket(power.month),
      lifetime: {
        ...mapBucket(power.year),
        solarPanels: solarPanels, // ✅ Add solar panels to lifetime data
      }
    },
    houseLoad: {
      daily: toKw(power.now?.load)
    },
    summary: {
      saving_summary: {
        today_saving: toKw(energySaving.day),
        month_saving: toKw(energySaving.month),
        year_saving: toKw(energySaving.year)
      },
      energy_summary: {
        today_pv_energy: toKw(power.day?.solar),
        month_pv_energy: toKw(power.month?.solar),
        lifetime_pv_energy: toKw(power.year?.solar),
        lifetime_ratio: (power.year?.solar / (power.year?.solar + power.year?.grid_import)) || 0,  // ✅ FIXED
      }
    },
    carbonCredit: {
      saving_summary: {
        today_co2_saving: carbonCredit.day ?? null,
        month_co2_saving: carbonCredit.month ?? null,
        lifetime_co2_saving: carbonCredit.year ?? null
      },
      energy_summary: {
        today_pv_energy: toKw(power.day?.solar),
        month_pv_energy: toKw(power.month?.solar),
        lifetime_pv_energy: toKw(power.year?.solar),
        lifetime_ratio: (power.year?.solar / (power.year?.solar + power.year?.grid_import)) || 0  // ✅ FIXED
      }
    },
    batteryData: batteries,
  };
}