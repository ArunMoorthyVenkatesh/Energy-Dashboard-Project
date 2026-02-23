export function mapSiteRealtimeEvent(event) {
  if (!event || event.type !== "site_realtime_state") return null;

  const payload = event.payload || {};
  const power = payload.power || {};
  const energySaving = payload.energy_saving || {};
  const carbonCredit = payload.carbon_credit || {};

  const toKw = (value) => {
    if (value === null || value === undefined) return 0;
    const num = Number(value);
    return Number.isFinite(num) ? num / 1000 : 0;
  };

  const toMWh = (value) => {
    if (value === null || value === undefined) return 0;
    const num = Number(value);
    return Number.isFinite(num) ? num / 1000000 : 0;
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

    return {
      pv: toKw(bucket.solar),
      bess: toKw(bucket.battery_discharge) - toKw(bucket.battery_charge),
      grid_import: toKw(bucket.grid_import),
      grid_export: toKw(bucket.grid_export),
      load: toKw(bucket.load)
    };
  };

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
      grid_import: toKw(nowBucket.grid_import),
      load: toKw(nowBucket.load),
      grid_export: toKw(nowBucket.grid_export),
    };
  };

  const siteLevelSolarData = {
    power: {
      now: {
        online: (payload.devices?.online ?? 0) > 0,
        solar: toKw(power.now?.solar),
      },
      day: {
        import_kwh: toMWh(power.day?.solar),
      },
      month: {
        import_kwh: toMWh(power.month?.solar),
      },
      lifetime: {
        import_kwh: toMWh(power.lifetime?.solar),
      }
    }
  };

  const solarPanels = Array.isArray(payload.solar_panels)
    ? payload.solar_panels.map((panel) => ({
        id: panel.id ?? panel.deviceId ?? null,
        deviceId: panel.deviceId ?? panel.id ?? null,
        name: panel.name ?? panel.deviceId ?? 'Solar Panel',
        role: 'solar',
        status: panel.status ?? 'unknown',
        power: {
          now: {
            online: panel.status === 'active' || panel.status === 'online',
            solar: panel.power_kw ?? panel.power ?? 0,
          },
          day: {
            import_kwh: panel.daily ?? 0,
          },
          month: {
            import_kwh: panel.monthly ?? 0,
          },
          lifetime: {
            import_kwh: panel.lifetime ?? 0,
          }
        }
      }))
    : [];

  const batteries = Array.isArray(payload.batteries)
    ? payload.batteries.map((batt) => ({
        id: batt.id ?? batt.deviceId ?? null,
        deviceId: batt.deviceId ?? batt.id ?? null,
        name: batt.name ?? batt.deviceId ?? 'Battery',
        role: 'battery',
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
      power: {
        now: mapLiveData(power.now),
        row: mapLiveData(power.now),
      },
      daily: mapBucket(power.day),
      monthly: mapBucket(power.month),
      lifetime: {
        ...mapBucket(power.year),
        solarPanels: solarPanels,
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
        lifetime_ratio: (power.year?.solar / (power.year?.solar + power.year?.grid_import)) || 0,
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
        lifetime_ratio: (power.year?.solar / (power.year?.solar + power.year?.grid_import)) || 0
      }
    },

    batteryData: [...solarPanels, ...batteries],

    siteLevelSolarData: siteLevelSolarData,
  };
}
