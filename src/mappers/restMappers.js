import "./viewModels.js";

const SERIES_KEY_MAP = {
  grid: "grid",
  load: "home_load",
  battery: "bess",
  meter: "pv"
};

/**
 * Map raw site metadata to the shape needed by the dashboard.
 * @param {any} site
 * @returns {{ id: number|null, name: string|null, latitude: number|null, longitude: number|null, status: string|null, address: string|null }}
 */
export function mapSiteMetadata(site) {
  if (!site) return { id: null, name: null, latitude: null, longitude: null, status: null, address: null };
  return {
    id: site.id ?? null,
    name: site.name ?? null,
    // Backend does not provide coordinates yet
    latitude: site.latitude ?? null,
    longitude: site.longitude ?? null,
    status: site.status ?? null,
    address: site.address ?? null
  };
}

/**
 * Map group gantt response series to UI keys (grid, home_load, bess, pv).
 * @param {Array<{ key: string, value: Array<{ key: string, value: number }> }>} series
 * @returns {import("./viewModels.js").GroupTimelineViewModel}
 */
export function mapGroupGanttResponse(series) {
  const mapped = { grid: [], home_load: [], bess: [], pv: [] };
  if (!Array.isArray(series)) return mapped;

  for (const item of series) {
    const targetKey = SERIES_KEY_MAP[String(item?.key || "").toLowerCase()];
    if (!targetKey) continue;
    const points = Array.isArray(item.value) ? item.value : [];
    mapped[targetKey] = points.map((p) => ({
      key: p?.key ?? "",
      value: typeof p?.value === "number" ? p.value : null // Backend does not provide a value; surface as null
    }));
  }

  return mapped;
}

/**
 * Map group list response to UI-friendly entries while acknowledging missing usage totals.
 * @param {Array<any>} groups
 * @returns {Array<{ id: number|null, name: string|null, usage: number|null, devices: Array<{ type: string, names: Array<string>, id: string|number }> }>}
 */
export function mapGroupList(groups) {
  if (!Array.isArray(groups)) return [];
  return groups.map((g) => ({
    id: g?.groupId ?? null,
    name: g?.name ?? null,
    usage: g?.usage_energy?.value, // Backend does not provide aggregated usage totals yet
    devices: g?.devices // Backend does not provide device breakdown for usage rows
  }));
}
