export function mapGanttToNumberArray(series, preferredKeys = []) {
  if (!Array.isArray(series) || !preferredKeys.length) return [];
  const lowered = preferredKeys.map((k) => String(k).toLowerCase());
  const target = series.find((s) => lowered.includes(String(s?.key || "").toLowerCase()));
  const values = Array.isArray(target?.value) ? target.value : [];
  return values.map((v) => (Number.isFinite(v?.value) ? v.value : 0));
}

export function mapGanttToTimelineData(series, preferredKeys) {
  if (!Array.isArray(series)) return [];

  const selected = series.find((s) =>
    preferredKeys.includes(s.key)
  );

  if (!selected || !Array.isArray(selected.value)) return [];

  return selected.value.map((point) => ({
    key: String(point.key),
    value: Number.isFinite(Number(point.value)) ? Number(point.value) : 0,
  }));
}

export function mapGroupGanttSeries(series) {
  const mapped = { grid: [], pv: [], bess: [], home_load: [] };
  if (!Array.isArray(series)) return mapped;
  console.log(series);
  const keyMap = {
    grid: "grid",
    load: "home_load",
    battery: "bess",
    solar: "pv"
  };
  for (const item of series) {
    const targetKey = keyMap[String(item?.key || "").toLowerCase()];
    if (!targetKey) continue;
    const points = Array.isArray(item.value) ? item.value : [];
    mapped[targetKey] = points.map((p) => ({
      key: p?.key ?? "",
      value: Number.isFinite(p?.value) ? p.value : 0
    }));
  }
  return mapped;
}

export function resolveGranularity(timeRange) {
  const range = String(timeRange || "").toLowerCase();
  if (range === "month") return "day";
  if (range === "lifetime") return "month";
  if (range === "day") return "hour";
  return null;
}

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}
