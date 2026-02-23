import API from './BaseAPI';

const getSiteInfo = async ({site_id}) => {
  return await API({
    method: 'GET',
    url: `/sites/${site_id}`,
  });
};

const getSiteEnergy = async ({ site_id, granularity = 'day' }) => {
  return await API({
    method: 'GET',
    url: `/sites/${site_id}`,
    params: {granularity: granularity}
  });
};

const getGroupList = async ({site_id}) => {
  return await API({
    method: 'GET',
    url: `/groups`,
    params: { site_owner_id: site_id },
  });
};

const getGroupGraph = async ({group_id, time_range}) => {
  return await API({
    method: 'GET',
    url: `/groups/${group_id}/gantt-chart`,
    params: {
      data_set: time_range,
      granularity: "hour",
      date: 29,
      timeZone: "Asia/Ho_Chi_Minh",
    },
  });
};

const ElectricUsageAPI = {
  getSiteInfo,
  getSiteEnergy,
  getGroupList,
  getGroupGraph
};

export default ElectricUsageAPI;
