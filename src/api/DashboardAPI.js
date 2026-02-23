import API from "./BaseAPI";
import { mapGroupGanttResponse, mapGroupList, mapSiteMetadata } from "../mappers/restMappers.js";

const DEFAULT_TIMEZONE = "Asia/Ho_Chi_Minh";

export async function fetchSiteMetadata(siteId) {
  if (!siteId) return mapSiteMetadata(null);
  const res = await API({
    method: "GET",
    url: `/sites/${siteId}`
  });
  const payload = res?.data?.data ?? res?.data ?? null;
  return mapSiteMetadata(payload);
}

export async function fetchGroupsForSite(siteId) {
  const res = await API({
    method: "GET",
    url: "/groups/energy-usage-list",
    params: siteId ? { site_owner_id: siteId } : {}
  });
  const payload = res?.data?.data?.items ?? res?.data?.items ?? [];
  return mapGroupList(payload);
}

function resolveGanttParams(timeRange) {
  const todayIso = new Date().toISOString().slice(0, 10);
  if (timeRange === "month") return { granularity: "day", date: todayIso };
  if (timeRange === "lifetime") return { granularity: "year", date: todayIso };
  return { granularity: "hour", date: todayIso };
}

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

export async function fetchSiteDevices(siteId) {
  if (!siteId) return [];
  const res = await API({
    method: "GET",
    url: `/sites/${siteId}/devices`
  });

  const payload = res?.data?.data ?? [];
  return Array.isArray(payload) ? payload : [];
}
