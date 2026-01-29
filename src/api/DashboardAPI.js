import API from "./BaseAPI";
import { mapGroupGanttResponse, mapGroupList, mapSiteMetadata } from "../mappers/restMappers.js";

const DEFAULT_TIMEZONE = "Asia/Ho_Chi_Minh";

/**
 * Fetch site metadata and map it for dashboard consumption.
 * @param {number|string} siteId
 * @returns {Promise<ReturnType<typeof mapSiteMetadata>>}
 */
export async function fetchSiteMetadata(siteId) {
  if (!siteId) return mapSiteMetadata(null);
  const res = await API({
    method: "GET",
    url: `/sites/${siteId}`
  });
  const payload = res?.data?.data ?? res?.data ?? null;
  return mapSiteMetadata(payload);
}

/**
 * Fetch groups scoped to a site and map them for UI dropdowns and usage widgets.
 * @param {number|string} siteId
 * @returns {Promise<ReturnType<typeof mapGroupList>>}
 */
export async function fetchGroupsForSite(siteId) {
  const res = await API({
    method: "GET",
    url: "/groups/energy-usage-list",
    params: siteId ? { site_owner_id: siteId } : {}
  });
  const payload = res?.data?.data?.items ?? res?.data?.items ?? [];
  return mapGroupList(payload);
}

/**
 * Map dashboard time range to gantt granularity and anchor date.
 * @param {"day"|"month"|"lifetime"} timeRange
 * @returns {{ granularity: "hour"|"day"|"month"|"year", date: string }}
 */
function resolveGanttParams(timeRange) {
  const todayIso = new Date().toISOString().slice(0, 10);
  if (timeRange === "month") return { granularity: "day", date: todayIso };
  if (timeRange === "lifetime") return { granularity: "year", date: todayIso };
  return { granularity: "hour", date: todayIso };
}

/**
 * Fetch group gantt timeline and map deviceType series into UI categories.
 * @param {{ groupId: number|string, timeRange: "day"|"month"|"lifetime", timeZone?: string }} params
 * @returns {Promise<import("../mappers/viewModels.js").GroupTimelineViewModel>}
 */
export async function fetchGroupTimeline({ groupId, timeRange, timeZone = DEFAULT_TIMEZONE }) {
  if (!groupId) return { grid: [], pv: [], bess: [], home_load: [] };
  const { granularity, date } = resolveGanttParams(timeRange);

  const res = await API({
    method: "GET",
    url: `/groups/${groupId}/gantt-chart`,
    params: { granularity, date, tz: timeZone }
  });
  const payload = res?.data?.data ?? res?.data ?? [];
  return mapGroupGanttResponse(payload);
}
