// Mock API implementation - Replace with actual API calls later

class DeviceAPI {
    static async getDevices() {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return [
        {
          id: 'device-1',
          name: 'Living Room AC',
          type: 'air_conditioner',
          status: 'online',
          currentTemp: 24,
          targetTemp: 22,
          humidity: 65,
          mode: 'cooling',
          fanSpeed: 'medium',
          powerState: 'on',
          schedules: [
            {
              id: 'sched-1',
              name: 'Morning Comfort',
              time: '07:00',
              days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
              scene: 'Comfort',
              enabled: true
            }
          ]
        },
        {
          id: 'device-2',
          name: 'Bedroom AC',
          type: 'air_conditioner',
          status: 'online',
          currentTemp: 26,
          targetTemp: 23,
          humidity: 60,
          mode: 'cooling',
          fanSpeed: 'low',
          powerState: 'on',
          schedules: []
        },
        {
          id: 'device-3',
          name: 'Office AC',
          type: 'air_conditioner',
          status: 'offline',
          currentTemp: null,
          targetTemp: 22,
          humidity: null,
          mode: 'cooling',
          fanSpeed: 'auto',
          powerState: 'off',
          schedules: []
        }
      ];
    }
  
    // Add more API methods as needed
    static async updateDevice(deviceId, updates) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    }
  
    static async createSchedule(deviceId, schedule) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true, schedule };
    }
  }
  
  export default DeviceAPI;