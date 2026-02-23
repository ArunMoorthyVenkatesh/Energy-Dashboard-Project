import API from './BaseAPI';

const getData = async () => {
  return await API({
    method: 'GET',
    url: '/group/16/iot-usage',
  });
};

const GroupDataAPI = {
  getData,
};

export default GroupDataAPI;
