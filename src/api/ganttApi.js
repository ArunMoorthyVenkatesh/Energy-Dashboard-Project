import API from "./BaseAPI";

const DEFAULT_TZ = "Asia/Ho_Chi_Minh";

export async function fetchSiteGanttChart({ siteId, granularity, date, tz = DEFAULT_TZ }) {
  if (!siteId || !granularity || !date) return null;
  const res = await API({
    method: "GET",
    url: `/sites/${siteId}/gantt-chart`,
    params: { granularity, date, tz }
  });
  return res?.data?.data ?? null;
}

export async function fetchGroupGanttChart({ groupId, granularity, date, tz = DEFAULT_TZ }) {
  if (!groupId || !granularity || !date) return null;
  const res = await API({
    method: "GET",
    url: `/groups/${groupId}/gantt-chart`,
    params: { granularity, date, tz }
  });
  return res?.data?.data ?? null;
}
