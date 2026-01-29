/**
 * Map a backend gantt series array to a simple number[] by preferred key.
 * No aggregation; preserves backend ordering.
 * @param {Array<{key: string, value: Array<{key: string, value: number}>}>} series
 * @param {string[]} preferredKeys ordered list of keys to select
 * @returns {number[]}
 */
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

/**
 * Map group gantt series into categorized arrays for UI consumption.
 * Keys mapped deterministically: grid -> grid, load -> home_load, battery -> bess, meter/solar -> pv.
 * @param {Array<{key: string, value: Array<{key: string, value: number}>}>} series
 * @returns {{ grid: Array<{key: string, value: number}>, pv: Array<{key: string, value: number}>, bess: Array<{key: string, value: number}>, home_load: Array<{key: string, value: number}> }}
 */
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

/**
 * Resolve gantt granularity from UI time range.
 */
export function resolveGranularity(timeRange) {
  const range = String(timeRange || "").toLowerCase();
  if (range === "month") return "day";
  if (range === "lifetime") return "month";
  if (range === "day") return "hour";
  return null;
}

/**
 * Get an ISO date string for today (YYYY-MM-DD) to use as anchor.
 */
export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}
