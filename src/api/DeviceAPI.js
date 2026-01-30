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
      },
      {
        id: 'device-4',
        name: 'Kitchen AC',
        type: 'air_conditioner',
        status: 'online',
        currentTemp: 25,
        targetTemp: 24,
        humidity: 55,
        mode: 'cooling',
        fanSpeed: 'high',
        powerState: 'on',
        schedules: [
          {
            id: 'sched-2',
            name: 'Evening Cool',
            time: '18:00',
            days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            scene: 'Cool',
            enabled: true
          }
        ]
      },
      {
        id: 'device-5',
        name: 'Guest Room AC',
        type: 'air_conditioner',
        status: 'online',
        currentTemp: 27,
        targetTemp: 25,
        humidity: 70,
        mode: 'cooling',
        fanSpeed: 'medium',
        powerState: 'off',
        schedules: []
      },
      {
        id: 'device-6',
        name: 'Master Bedroom AC',
        type: 'air_conditioner',
        status: 'online',
        currentTemp: 23,
        targetTemp: 21,
        humidity: 58,
        mode: 'cooling',
        fanSpeed: 'auto',
        powerState: 'on',
        schedules: [
          {
            id: 'sched-3',
            name: 'Night Mode',
            time: '22:00',
            days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            scene: 'Sleep',
            enabled: true
          }
        ]
      },
      {
        id: 'device-7',
        name: 'Basement AC',
        type: 'air_conditioner',
        status: 'online',
        currentTemp: 22,
        targetTemp: 20,
        humidity: 75,
        mode: 'dehumidify',
        fanSpeed: 'low',
        powerState: 'on',
        schedules: []
      },
      {
        id: 'device-8',
        name: 'Garage AC',
        type: 'air_conditioner',
        status: 'offline',
        currentTemp: null,
        targetTemp: 26,
        humidity: null,
        mode: 'fan',
        fanSpeed: 'high',
        powerState: 'off',
        schedules: []
      },
      {
        id: 'device-9',
        name: 'Dining Room AC',
        type: 'air_conditioner',
        status: 'online',
        currentTemp: 24,
        targetTemp: 23,
        humidity: 62,
        mode: 'cooling',
        fanSpeed: 'medium',
        powerState: 'on',
        schedules: [
          {
            id: 'sched-4',
            name: 'Dinner Time',
            time: '17:30',
            days: ['Sat', 'Sun'],
            scene: 'Comfort',
            enabled: false
          }
        ]
      },
      {
        id: 'device-10',
        name: 'Gym AC',
        type: 'air_conditioner',
        status: 'online',
        currentTemp: 28,
        targetTemp: 20,
        humidity: 68,
        mode: 'cooling',
        fanSpeed: 'high',
        powerState: 'on',
        schedules: [
          {
            id: 'sched-5',
            name: 'Workout Cool',
            time: '06:00',
            days: ['Mon', 'Wed', 'Fri'],
            scene: 'Cool',
            enabled: true
          }
        ]
      },
      {
        id: 'device-11',
        name: 'Sunroom AC',
        type: 'air_conditioner',
        status: 'online',
        currentTemp: 29,
        targetTemp: 24,
        humidity: 72,
        mode: 'cooling',
        fanSpeed: 'high',
        powerState: 'on',
        schedules: []
      },
      {
        id: 'device-12',
        name: 'Library AC',
        type: 'air_conditioner',
        status: 'online',
        currentTemp: 23,
        targetTemp: 22,
        humidity: 50,
        mode: 'auto',
        fanSpeed: 'low',
        powerState: 'on',
        schedules: [
          {
            id: 'sched-6',
            name: 'Reading Hours',
            time: '14:00',
            days: ['Sat', 'Sun'],
            scene: 'Comfort',
            enabled: true
          }
        ]
      },
      {
        id: 'device-13',
        name: 'Attic AC',
        type: 'air_conditioner',
        status: 'offline',
        currentTemp: null,
        targetTemp: 28,
        humidity: null,
        mode: 'cooling',
        fanSpeed: 'medium',
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