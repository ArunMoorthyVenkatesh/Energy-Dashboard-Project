import "./viewModels.js";

const SERIES_KEY_MAP = {
  grid: "grid",
  load: "home_load",
  battery: "bess",
  meter: "pv"
};

export function mapSiteMetadata(site) {
  if (!site) return { id: null, name: null, latitude: null, longitude: null, status: null, address: null };
  return {
    id: site.id ?? null,
    name: site.name ?? null,

    latitude: site.latitude ?? null,
    longitude: site.longitude ?? null,
    status: site.status ?? null,
    address: site.address ?? null
  };
}

export function mapGroupGanttResponse(series) {
  const mapped = { grid: [], home_load: [], bess: [], pv: [] };
  if (!Array.isArray(series)) return mapped;

  for (const item of series) {
    const targetKey = SERIES_KEY_MAP[String(item?.key || "").toLowerCase()];
    if (!targetKey) continue;
    const points = Array.isArray(item.value) ? item.value : [];
    mapped[targetKey] = points.map((p) => ({
      key: p?.key ?? "",
      value: typeof p?.value === "number" ? p.value : null
    }));
  }

  return mapped;
}

export function mapGroupList(groups) {
  if (!Array.isArray(groups)) return [];
  return groups.map((g) => ({
    id: g?.groupId ?? null,
    name: g?.name ?? null,
    usage: g?.usage_energy?.value,
    devices: g?.devices
  }));
}
