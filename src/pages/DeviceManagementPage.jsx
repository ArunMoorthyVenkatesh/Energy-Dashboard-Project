import React, { useState, useEffect } from 'react';
import { Settings, Thermometer, Droplets, Wind, Clock, Plus, Edit2, Trash2, Power, ChevronDown, ChevronUp, Filter, Sunrise, Sun, Sunset, Moon, X, Search } from 'lucide-react';
import DeviceAPI from '../api/DeviceAPI';

// Vibrant Scene Presets
const SCENE_PRESETS = {
  Eco: {
    name: 'Eco',
    description: 'Energy-efficient cooling',
    targetTemp: 26,
    fanSpeed: 'low',
    mode: 'cooling',
    color: 'bg-gradient-to-br from-emerald-100 via-teal-100 to-cyan-100 text-emerald-800 border-emerald-400/70'
  },
  Comfort: {
    name: 'Comfort',
    description: 'Balanced comfort',
    targetTemp: 23,
    fanSpeed: 'medium',
    mode: 'cooling',
    color: 'bg-gradient-to-br from-blue-100 via-indigo-100 to-violet-100 text-blue-800 border-blue-400/70'
  },
  Cool: {
    name: 'Cool',
    description: 'Maximum cooling',
    targetTemp: 20,
    fanSpeed: 'high',
    mode: 'cooling',
    color: 'bg-gradient-to-br from-violet-100 via-purple-100 to-fuchsia-100 text-violet-800 border-violet-400/70'
  }
};

const STORAGE_KEYS = {
  DEVICES: 'device_management_devices',
  SCHEDULES: 'device_management_schedules'
};

// Time period configuration with vibrant gradients
const TIME_PERIODS = {
  morning: { 
    icon: Sunrise, 
    label: 'Morning', 
    range: '5AM - 12PM',
    gradient: 'from-amber-400 to-orange-500'
  },
  afternoon: { 
    icon: Sun, 
    label: 'Afternoon', 
    range: '12PM - 5PM',
    gradient: 'from-orange-400 to-red-500'
  },
  evening: { 
    icon: Sunset, 
    label: 'Evening', 
    range: '5PM - 9PM',
    gradient: 'from-violet-400 to-purple-600'
  },
  night: { 
    icon: Moon, 
    label: 'Night', 
    range: '9PM - 5AM',
    gradient: 'from-indigo-500 to-blue-700'
  }
};

export default function DeviceManagementPage() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [modalDevice, setModalDevice] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const [isDeviceListCollapsed, setIsDeviceListCollapsed] = useState(false);
  const [isSchedulesCollapsed, setIsSchedulesCollapsed] = useState(false);
  
  const [scheduleFilter, setScheduleFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [deviceFilter, setDeviceFilter] = useState('all');

  // New device filters
  const [deviceSearchQuery, setDeviceSearchQuery] = useState('');
  const [deviceStatusFilter, setDeviceStatusFilter] = useState('all');

  useEffect(() => {
    loadDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (devices.length > 0) {
      saveToLocalStorage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devices]);

  const loadDevices = async () => {
    setLoading(true);
    try {
      const savedDevices = loadFromLocalStorage();
      
      if (savedDevices && savedDevices.length > 0) {
        console.log('📦 Loaded devices from localStorage:', savedDevices);
        setDevices(savedDevices);
      } else {
        const data = await DeviceAPI.getDevices();
        setDevices(data);
      }
    } catch (error) {
      console.error('Failed to load devices:', error);
      const savedDevices = loadFromLocalStorage();
      if (savedDevices && savedDevices.length > 0) {
        setDevices(savedDevices);
      }
    } finally {
      setLoading(false);
    }
  };

  const saveToLocalStorage = () => {
    try {
      localStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(devices));
      const now = new Date();
      setLastUpdated(now);
      console.log('💾 Saved to localStorage:', devices);
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  };

  const loadFromLocalStorage = () => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEYS.DEVICES);
      if (savedData) {
        return JSON.parse(savedData);
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
    return null;
  };

  const handleAddSchedule = (device) => {
    setSelectedDevice(device);
    setEditingSchedule({
      id: `sched-${Date.now()}`,
      name: '',
      startTime: '09:00',
      endTime: '17:00',
      days: [],
      scene: 'Comfort',
      powerState: 'on',
      enabled: true
    });
    setShowScheduleModal(true);
  };

  const handleDeviceClick = (device) => {
    setModalDevice(device);
    setShowDeviceModal(true);
  };

  const handleEditSchedule = (device, schedule) => {
    setSelectedDevice(device);
    setEditingSchedule({ ...schedule });
    setShowScheduleModal(true);
  };

  const handleSaveSchedule = async () => {
    if (!editingSchedule.name || editingSchedule.days.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate time range
    if (editingSchedule.startTime >= editingSchedule.endTime) {
      alert('End time must be after start time');
      return;
    }

    try {
      const scheduleExists = selectedDevice.schedules?.find(s => s.id === editingSchedule.id);
      
      if (scheduleExists) {
        await DeviceAPI.updateSchedule(
          selectedDevice.id,
          editingSchedule.id,
          editingSchedule
        );
      } else {
        await DeviceAPI.createSchedule(
          selectedDevice.id,
          editingSchedule
        );
      }
    } catch (error) {
      console.warn('⚠️ API save failed, saving locally only:', error);
    }

    const updatedDevices = devices.map(device => {
      if (device.id === selectedDevice.id) {
        const scheduleExists = device.schedules?.find(s => s.id === editingSchedule.id);
        if (scheduleExists) {
          return {
            ...device,
            schedules: device.schedules.map(s => 
              s.id === editingSchedule.id ? editingSchedule : s
            )
          };
        } else {
          return {
            ...device,
            schedules: [...(device.schedules || []), editingSchedule]
          };
        }
      }
      return device;
    });

    setDevices(updatedDevices);
    setShowScheduleModal(false);
    setEditingSchedule(null);
    setSelectedDevice(null);
    
    alert('Schedule saved successfully!');
  };

  const handleDeleteSchedule = async (device, scheduleId) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      try {
        await DeviceAPI.deleteSchedule(device.id, scheduleId);
      } catch (error) {
        console.warn('⚠️ API delete failed, deleting locally only:', error);
      }

      const updatedDevices = devices.map(d => {
        if (d.id === device.id) {
          return {
            ...d,
            schedules: d.schedules.filter(s => s.id !== scheduleId)
          };
        }
        return d;
      });

      setDevices(updatedDevices);
      
      if (modalDevice && modalDevice.id === device.id) {
        const updatedModalDevice = updatedDevices.find(d => d.id === device.id);
        setModalDevice(updatedModalDevice);
      }
      
      alert('Schedule deleted successfully!');
    }
  };

  const toggleSchedule = async (device, scheduleId) => {
    try {
      const schedule = device.schedules.find(s => s.id === scheduleId);
      const newEnabledState = !schedule.enabled;

      await DeviceAPI.toggleSchedule(device.id, scheduleId, newEnabledState);
    } catch (error) {
      console.warn('⚠️ API toggle failed, toggling locally only:', error);
    }

    const updatedDevices = devices.map(d => {
      if (d.id === device.id) {
        return {
          ...d,
          schedules: d.schedules.map(s => 
            s.id === scheduleId ? { ...s, enabled: !s.enabled } : s
          )
        };
      }
      return d;
    });

    setDevices(updatedDevices);
    
    if (modalDevice && modalDevice.id === device.id) {
      const updatedModalDevice = updatedDevices.find(d => d.id === device.id);
      setModalDevice(updatedModalDevice);
    }
  };

  // Filter devices based on search and status
  const getFilteredDevices = () => {
    let filtered = devices;

    // Filter by status
    if (deviceStatusFilter !== 'all') {
      filtered = filtered.filter(d => d.status === deviceStatusFilter);
    }

    // Filter by search query
    if (deviceSearchQuery.trim()) {
      const query = deviceSearchQuery.toLowerCase();
      filtered = filtered.filter(d => 
        d.name.toLowerCase().includes(query) ||
        d.id.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const getAllSchedules = () => {
    const allSchedules = [];
    devices.forEach(device => {
      if (device.schedules && device.schedules.length > 0) {
        device.schedules.forEach(schedule => {
          allSchedules.push({
            ...schedule,
            deviceId: device.id,
            deviceName: device.name
          });
        });
      }
    });
    
    let filteredSchedules = allSchedules;
    if (scheduleFilter === 'active') {
      filteredSchedules = allSchedules.filter(s => s.enabled);
    } else if (scheduleFilter === 'inactive') {
      filteredSchedules = allSchedules.filter(s => !s.enabled);
    }
    
    if (timeFilter !== 'all') {
      filteredSchedules = filteredSchedules.filter(schedule => {
        const hour = parseInt(schedule.startTime?.split(':')[0] || schedule.time?.split(':')[0] || 0);
        
        if (timeFilter === 'morning' && hour >= 5 && hour < 12) return true;
        if (timeFilter === 'afternoon' && hour >= 12 && hour < 17) return true;
        if (timeFilter === 'evening' && hour >= 17 && hour < 21) return true;
        if (timeFilter === 'night' && (hour >= 21 || hour < 5)) return true;
        
        return false;
      });
    }
    
    if (deviceFilter !== 'all') {
      filteredSchedules = filteredSchedules.filter(s => s.deviceId === deviceFilter);
    }
    
    filteredSchedules.sort((a, b) => {
      const timeA = (a.startTime || a.time || '00:00').split(':').map(Number);
      const timeB = (b.startTime || b.time || '00:00').split(':').map(Number);
      
      if (timeA[0] !== timeB[0]) {
        return timeA[0] - timeB[0];
      }
      return timeA[1] - timeB[1];
    });
    
    return filteredSchedules;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          </div>
          <p className="text-indigo-900 font-bold">Loading devices...</p>
        </div>
      </div>
    );
  }

  const filteredDevices = getFilteredDevices();
  const allSchedules = getAllSchedules();
  const activeCount = devices.reduce((sum, d) => sum + (d.schedules?.filter(s => s.enabled).length || 0), 0);
  const inactiveCount = devices.reduce((sum, d) => sum + (d.schedules?.filter(s => !s.enabled).length || 0), 0);
  const onlineCount = devices.filter(d => d.status === 'online').length;
  const offlineCount = devices.filter(d => d.status === 'offline').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Vibrant Header */}
        <div className="bg-gradient-to-br from-blue-100 via-indigo-100 to-violet-100 rounded-xl sm:rounded-2xl shadow-lg border-2 border-blue-300/60 p-4 sm:p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 mb-1 sm:mb-2">
                Device Management
              </h1>
              <p className="text-sm sm:text-base text-slate-700 font-bold">Control and automate your connected devices</p>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-shrink-0">
              <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-100 backdrop-blur-sm border-2 border-emerald-400/70 rounded-xl shadow-sm">
                <div className="relative">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                  <div className="absolute inset-0 w-2 h-2 bg-emerald-600 rounded-full animate-ping opacity-75"></div>
                </div>
                <span className="text-xs sm:text-sm font-black text-emerald-800">Auto-saved</span>
              </div>
              {lastUpdated && (
                <p className="text-xs text-slate-700 font-bold">
                  {lastUpdated.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Device List with Vibrant Cards */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-200/60">
          <button
            onClick={() => setIsDeviceListCollapsed(!isDeviceListCollapsed)}
            className="w-full flex items-center justify-between p-5 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 rounded-t-2xl group"
          >
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 backdrop-blur-sm rounded-xl p-2.5 shadow-md border-2 border-blue-300/60">
                <Settings className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <h2 className="text-base font-black text-slate-900">Your Devices</h2>
                <p className="text-sm text-slate-600 font-bold">
                  {filteredDevices.length} {deviceStatusFilter !== 'all' || deviceSearchQuery ? 'found' : 'connected'}
                </p>
              </div>
            </div>
            {isDeviceListCollapsed ? (
              <ChevronDown className="w-5 h-5 text-slate-500 group-hover:text-slate-700 transition-colors" />
            ) : (
              <ChevronUp className="w-5 h-5 text-slate-500 group-hover:text-slate-700 transition-colors" />
            )}
          </button>

          {!isDeviceListCollapsed && (
            <>
              {/* Device Filters */}
              <div className="border-t-2 border-blue-200/60 p-3 sm:p-5 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 space-y-3 sm:space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-500" />
                  <input
                    type="text"
                    value={deviceSearchQuery}
                    onChange={(e) => setDeviceSearchQuery(e.target.value)}
                    placeholder="Search devices by name or ID..."
                    className="w-full pl-12 pr-4 py-3 border-2 border-indigo-300/60 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 font-bold shadow-md bg-white placeholder-slate-400"
                  />
                  {deviceSearchQuery && (
                    <button
                      onClick={() => setDeviceSearchQuery('')}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Status Filter */}
                <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl shadow-md border-2 border-blue-300/60 w-fit">
                    <Filter className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-black text-blue-900">Status</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setDeviceStatusFilter('all')}
                      className={`px-4 py-2 rounded-xl text-sm font-black transition-all duration-300 border-2 shadow-md ${
                        deviceStatusFilter === 'all'
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-indigo-400'
                          : 'bg-white text-slate-700 hover:bg-indigo-50 border-indigo-200 hover:border-indigo-400'
                      }`}
                    >
                      All · {devices.length}
                    </button>
                    <button
                      onClick={() => setDeviceStatusFilter('online')}
                      className={`px-4 py-2 rounded-xl text-sm font-black transition-all duration-300 border-2 shadow-md ${
                        deviceStatusFilter === 'online'
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-400'
                          : 'bg-white text-slate-700 hover:bg-emerald-50 border-emerald-200 hover:border-emerald-400'
                      }`}
                    >
                      Online · {onlineCount}
                    </button>
                    <button
                      onClick={() => setDeviceStatusFilter('offline')}
                      className={`px-4 py-2 rounded-xl text-sm font-black transition-all duration-300 border-2 shadow-md ${
                        deviceStatusFilter === 'offline'
                          ? 'bg-gradient-to-r from-slate-500 to-slate-700 text-white border-slate-400'
                          : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      Offline · {offlineCount}
                    </button>
                  </div>
                </div>

                {/* Clear Filters */}
                {(deviceStatusFilter !== 'all' || deviceSearchQuery) && (
                  <div className="pt-3 border-t-2 border-slate-200">
                    <button
                      onClick={() => {
                        setDeviceStatusFilter('all');
                        setDeviceSearchQuery('');
                      }}
                      className="px-4 py-2 text-sm bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-black hover:from-violet-600 hover:to-purple-700 transition-all duration-300 shadow-lg border-2 border-violet-400"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>

              <div className="p-3 sm:p-5 pt-0">
                {filteredDevices.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {filteredDevices.map(device => (
                      <div
                        key={device.id}
                        onClick={() => handleDeviceClick(device)}
                        className="group p-5 rounded-xl border-2 border-blue-200/60 bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/50 hover:from-blue-100 hover:via-indigo-100 hover:to-purple-100 hover:border-blue-400 hover:shadow-xl transition-all duration-300 cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span className="font-black text-slate-900 text-base">{device.name}</span>
                          <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-black border-2 shadow-sm ${
                            device.status === 'online' 
                              ? 'bg-emerald-200 text-emerald-800 border-emerald-400/70' 
                              : 'bg-slate-200 text-slate-700 border-slate-400/70'
                          }`}>
                            <div className={`w-2 h-2 rounded-full ${
                              device.status === 'online' ? 'bg-emerald-600' : 'bg-slate-600'
                            }`}></div>
                            {device.status}
                          </span>
                        </div>
                        
                        {/* Online devices - show actual values */}
                        {device.status === 'online' && device.currentTemp && (
                          <div className="flex items-center gap-2 mb-4">
                            <span className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-orange-100 to-amber-100 rounded-lg border-2 border-orange-300/60 shadow-sm">
                              <Thermometer className="w-4 h-4 text-orange-600" />
                              <span className="font-black text-orange-900">{device.currentTemp}°C</span>
                            </span>
                            {device.humidity && (
                              <span className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-cyan-100 to-teal-100 rounded-lg border-2 border-cyan-300/60 shadow-sm">
                                <Droplets className="w-4 h-4 text-cyan-600" />
                                <span className="font-black text-cyan-900">{device.humidity}%</span>
                              </span>
                            )}
                          </div>
                        )}
                        
                        {/* Offline devices - show dashes */}
                        {device.status === 'offline' && (
                          <div className="flex items-center gap-2 mb-4">
                            <span className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg border-2 border-slate-300/60 shadow-sm">
                              <Thermometer className="w-4 h-4 text-slate-500" />
                              <span className="font-black text-slate-600">-°C</span>
                            </span>
                            <span className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg border-2 border-slate-300/60 shadow-sm">
                              <Droplets className="w-4 h-4 text-slate-500" />
                              <span className="font-black text-slate-600">-%</span>
                            </span>
                          </div>
                        )}
                        
                        <div className="pt-4 border-t-2 border-blue-200/60 group-hover:border-blue-300 transition-colors">
                          <div className="flex items-center gap-2 text-sm text-slate-700 font-bold">
                            <Clock className="w-4 h-4" />
                            <span>{device.schedules?.length || 0} schedule{device.schedules?.length !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 text-slate-600 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl border-2 border-dashed border-slate-300">
                    <Search className="w-14 h-14 mx-auto mb-3 opacity-40 text-slate-400" />
                    <p className="mb-2 font-black text-base text-slate-800">No devices found</p>
                    <p className="text-sm text-slate-600 font-bold">
                      Try adjusting your search or filter criteria
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* All Schedules with Vibrant Filters */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-200/60">
          <button
            onClick={() => setIsSchedulesCollapsed(!isSchedulesCollapsed)}
            className="w-full flex items-center justify-between p-5 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300 rounded-t-2xl group"
          >
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-purple-100 to-pink-100 backdrop-blur-sm rounded-xl p-2.5 shadow-md border-2 border-purple-300/60">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-left">
                <h2 className="text-base font-black text-slate-900">All Schedules</h2>
                <p className="text-sm text-slate-600 font-bold">
                  {allSchedules.length} {scheduleFilter !== 'all' ? scheduleFilter : 'total'}
                </p>
              </div>
            </div>
            {isSchedulesCollapsed ? (
              <ChevronDown className="w-5 h-5 text-slate-500 group-hover:text-slate-700 transition-colors" />
            ) : (
              <ChevronUp className="w-5 h-5 text-slate-500 group-hover:text-slate-700 transition-colors" />
            )}
          </button>

          {!isSchedulesCollapsed && (
            <div className="border-t-2 border-purple-200/60">
              {/* Vibrant Filters */}
              <div className="p-3 sm:p-5 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 space-y-3 sm:space-y-4">
                {/* Status Filter */}
                <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl shadow-md border-2 border-indigo-300/60 w-fit">
                    <Filter className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-black text-indigo-900">Status</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setScheduleFilter('all')}
                      className={`px-4 py-2 rounded-xl text-sm font-black transition-all duration-300 border-2 shadow-md ${
                        scheduleFilter === 'all'
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-indigo-400'
                          : 'bg-white text-slate-700 hover:bg-indigo-50 border-indigo-200 hover:border-indigo-400'
                      }`}
                    >
                      All · {activeCount + inactiveCount}
                    </button>
                    <button
                      onClick={() => setScheduleFilter('active')}
                      className={`px-4 py-2 rounded-xl text-sm font-black transition-all duration-300 border-2 shadow-md ${
                        scheduleFilter === 'active'
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-400'
                          : 'bg-white text-slate-700 hover:bg-emerald-50 border-emerald-200 hover:border-emerald-400'
                      }`}
                    >
                      Active · {activeCount}
                    </button>
                    <button
                      onClick={() => setScheduleFilter('inactive')}
                      className={`px-4 py-2 rounded-xl text-sm font-black transition-all duration-300 border-2 shadow-md ${
                        scheduleFilter === 'inactive'
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-orange-400'
                          : 'bg-white text-slate-700 hover:bg-orange-50 border-orange-200 hover:border-orange-400'
                      }`}
                    >
                      Inactive · {inactiveCount}
                    </button>
                  </div>
                </div>

                {/* Time Filter */}
                <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl shadow-md border-2 border-purple-300/60 w-fit">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-black text-purple-900">Period</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setTimeFilter('all')}
                      className={`px-4 py-2 rounded-xl text-sm font-black transition-all duration-300 border-2 shadow-md ${
                        timeFilter === 'all'
                          ? 'bg-gradient-to-r from-slate-600 to-slate-800 text-white border-slate-500'
                          : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      All Day
                    </button>
                    {Object.entries(TIME_PERIODS).map(([key, period]) => {
                      const Icon = period.icon;
                      return (
                        <button
                          key={key}
                          onClick={() => setTimeFilter(key)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all duration-300 border-2 shadow-md ${
                            timeFilter === key
                              ? `bg-gradient-to-r ${period.gradient} text-white border-transparent`
                              : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{period.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Clear Filters */}
                {(scheduleFilter !== 'all' || timeFilter !== 'all' || deviceFilter !== 'all') && (
                  <div className="pt-3 border-t-2 border-slate-200">
                    <button
                      onClick={() => {
                        setScheduleFilter('all');
                        setTimeFilter('all');
                        setDeviceFilter('all');
                      }}
                      className="px-4 py-2 text-sm bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-black hover:from-violet-600 hover:to-purple-700 transition-all duration-300 shadow-lg border-2 border-violet-400"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>

              {/* Schedule List */}
              <div className="p-3 sm:p-5">
                {allSchedules.length > 0 ? (
                  <div className="space-y-3">
                    {allSchedules.map(schedule => {
                      const device = devices.find(d => d.id === schedule.deviceId);
                      return (
                        <div
                          key={`${schedule.deviceId}-${schedule.id}`}
                          className={`group p-5 rounded-xl border-2 transition-all duration-300 hover:shadow-xl ${
                            schedule.enabled
                              ? 'border-blue-300/60 bg-gradient-to-br from-white to-blue-50/30 hover:border-blue-400'
                              : 'border-slate-300/60 bg-gradient-to-br from-slate-50 to-slate-100/30 hover:border-slate-400'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-0">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-3 flex-wrap">
                                <h4 className="font-black text-sm sm:text-base text-slate-900">{schedule.name}</h4>
                                <span className="text-xs px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-800 rounded-lg font-black border-2 border-slate-300/60 shadow-sm">
                                  {schedule.deviceName}
                                </span>
                                {schedule.powerState && (
                                  <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black border-2 shadow-sm ${
                                    schedule.powerState === 'on'
                                      ? 'bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-800 border-emerald-400/70'
                                      : 'bg-gradient-to-br from-rose-100 to-red-100 text-rose-800 border-rose-400/70'
                                  }`}>
                                    <Power className="w-3.5 h-3.5" />
                                    {schedule.powerState.toUpperCase()}
                                  </span>
                                )}
                                {schedule.powerState === 'on' && schedule.scene && (
                                  <span className={`px-3 py-1.5 rounded-lg text-xs font-black border-2 shadow-sm ${
                                    SCENE_PRESETS[schedule.scene].color
                                  }`}>
                                    {schedule.scene}
                                  </span>
                                )}
                                <span className={`px-3 py-1.5 rounded-lg text-xs font-black border-2 shadow-sm ${
                                  schedule.enabled
                                    ? 'bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-800 border-emerald-400/70'
                                    : 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 border-slate-300'
                                }`}>
                                  {schedule.enabled ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg font-black border-2 border-indigo-300/60 shadow-sm">
                                  <Clock className="w-4 h-4 text-indigo-600" />
                                  <span className="text-indigo-900">
                                    {schedule.startTime || schedule.time} - {schedule.endTime || 'N/A'}
                                  </span>
                                </span>
                                <div className="flex gap-2 flex-wrap">
                                  {schedule.days.map(day => (
                                    <span key={day} className="px-3 py-2 bg-white rounded-lg border-2 border-blue-200/60 text-xs font-black text-blue-900 hover:border-blue-400 transition-colors shadow-sm">
                                      {day}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 sm:ml-4 flex-shrink-0">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={schedule.enabled}
                                  onChange={() => toggleSchedule(device, schedule.id)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 sm:w-12 sm:h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-teal-600 shadow-lg"></div>
                              </label>
                              <button
                                onClick={() => handleEditSchedule(device, schedule)}
                                className="p-2 text-slate-600 hover:text-white hover:bg-indigo-600 rounded-lg transition-all hover:shadow-md"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSchedule(device, schedule.id)}
                                className="p-2 text-slate-600 hover:text-white hover:bg-rose-600 rounded-lg transition-all hover:shadow-md"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 text-slate-600 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl border-2 border-dashed border-slate-300">
                    <Clock className="w-14 h-14 mx-auto mb-3 opacity-40 text-slate-400" />
                    <p className="mb-2 font-black text-base text-slate-800">
                      {scheduleFilter === 'all' 
                        ? 'No schedules configured'
                        : `No ${scheduleFilter} schedules`}
                    </p>
                    <p className="text-sm text-slate-600 font-bold">
                      {scheduleFilter === 'all'
                        ? 'Click on a device to create your first automation'
                        : 'Try changing the filter to see other schedules'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Vibrant Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto border-2 border-blue-200/60">
            <h3 className="text-2xl font-black text-slate-900 mb-6">
              {editingSchedule?.name ? 'Edit Schedule' : 'New Schedule'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-black text-slate-800 mb-2">
                  Device
                </label>
                <div className="px-4 py-3 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl text-indigo-900 font-black border-2 border-indigo-300/60 shadow-sm">
                  {selectedDevice?.name}
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-slate-800 mb-2">
                  Schedule Name *
                </label>
                <input
                  type="text"
                  value={editingSchedule?.name || ''}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-indigo-300/60 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 font-bold shadow-sm"
                  placeholder="e.g., Morning Comfort"
                />
              </div>

              {/* Start and End Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-black text-slate-800 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={editingSchedule?.startTime || '09:00'}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, startTime: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-indigo-300/60 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 font-black shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-slate-800 mb-2">
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={editingSchedule?.endTime || '17:00'}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, endTime: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-indigo-300/60 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 font-black shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-slate-800 mb-3">
                  Days *
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        const days = editingSchedule?.days || [];
                        setEditingSchedule({
                          ...editingSchedule,
                          days: days.includes(day)
                            ? days.filter(d => d !== day)
                            : [...days, day]
                        });
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-black transition-all border-2 shadow-md ${
                        editingSchedule?.days?.includes(day)
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-indigo-400'
                          : 'bg-white text-slate-700 hover:bg-indigo-100 border-indigo-200'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-slate-800 mb-3">
                  Power State *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingSchedule({ ...editingSchedule, powerState: 'on' })}
                    className={`p-4 rounded-xl border-2 text-sm font-black transition-all flex items-center justify-center gap-2 shadow-md ${
                      editingSchedule?.powerState === 'on'
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-emerald-400'
                        : 'bg-white border-emerald-200 text-slate-700 hover:border-emerald-400 hover:bg-emerald-50'
                    }`}
                  >
                    <Power className="w-5 h-5" />
                    Turn ON
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingSchedule({ ...editingSchedule, powerState: 'off' })}
                    className={`p-4 rounded-xl border-2 text-sm font-black transition-all flex items-center justify-center gap-2 shadow-md ${
                      editingSchedule?.powerState === 'off'
                        ? 'bg-gradient-to-br from-rose-500 to-red-600 text-white border-rose-400'
                        : 'bg-white border-rose-200 text-slate-700 hover:border-rose-400 hover:bg-rose-50'
                    }`}
                  >
                    <Power className="w-5 h-5" />
                    Turn OFF
                  </button>
                </div>
              </div>

              {editingSchedule?.powerState === 'on' && (
                <div>
                  <label className="block text-sm font-black text-slate-800 mb-3">
                    Scene Preset
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.keys(SCENE_PRESETS).map(sceneName => (
                      <button
                        key={sceneName}
                        type="button"
                        onClick={() => setEditingSchedule({ ...editingSchedule, scene: sceneName })}
                        className={`p-3 rounded-xl border-2 text-sm font-black transition-all shadow-md ${
                          editingSchedule?.scene === sceneName
                            ? SCENE_PRESETS[sceneName].color
                            : 'border-slate-200 text-slate-700 hover:border-slate-300 bg-white'
                        }`}
                      >
                        {sceneName}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowScheduleModal(false);
                  setEditingSchedule(null);
                  setSelectedDevice(null);
                }}
                className="flex-1 px-5 py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-black shadow-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSchedule}
                className="flex-1 px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all font-black shadow-lg border-2 border-indigo-400"
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Device Detail Modal - Same as before, just update the schedule time display */}
      {showDeviceModal && modalDevice && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border-2 border-blue-200/60">
            <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 backdrop-blur-xl border-b-2 border-blue-200/60 p-3 sm:p-5 rounded-t-xl sm:rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl p-2.5 shadow-md border-2 border-blue-300/60">
                    <Settings className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">{modalDevice.name}</h3>
                    <p className="text-sm text-slate-600 font-bold">Device Details</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDeviceModal(false);
                    setModalDevice(null);
                  }}
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-3 sm:p-5 space-y-4 sm:space-y-5">
              {/* Current Status */}
              <div>
                <h4 className="text-sm sm:text-base font-black text-slate-900 mb-3">Current Status</h4>
                {modalDevice.status === 'online' ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                    {modalDevice.currentTemp && (
                      <div className="bg-gradient-to-br from-blue-100 via-indigo-100 to-violet-100 rounded-xl p-4 border-2 border-blue-400/70 shadow-md">
                        <div className="flex items-center gap-2 text-blue-700 mb-2">
                          <Thermometer className="w-4 h-4" />
                          <span className="text-xs font-black">Current</span>
                        </div>
                        <p className="text-2xl font-black text-blue-900">{modalDevice.currentTemp}°C</p>
                      </div>
                    )}
                    <div className="bg-gradient-to-br from-violet-100 via-purple-100 to-fuchsia-100 rounded-xl p-4 border-2 border-violet-400/70 shadow-md">
                      <div className="flex items-center gap-2 text-violet-700 mb-2">
                        <Thermometer className="w-4 h-4" />
                        <span className="text-xs font-black">Target</span>
                      </div>
                      <p className="text-2xl font-black text-violet-900">{modalDevice.targetTemp || 24}°C</p>
                    </div>
                    {modalDevice.humidity && (
                      <div className="bg-gradient-to-br from-teal-100 via-cyan-100 to-blue-100 rounded-xl p-4 border-2 border-teal-400/70 shadow-md">
                        <div className="flex items-center gap-2 text-teal-700 mb-2">
                          <Droplets className="w-4 h-4" />
                          <span className="text-xs font-black">Humidity</span>
                        </div>
                        <p className="text-2xl font-black text-teal-900">{modalDevice.humidity}%</p>
                      </div>
                    )}
                    <div className="bg-gradient-to-br from-orange-100 via-amber-100 to-yellow-100 rounded-xl p-4 border-2 border-orange-400/70 shadow-md">
                      <div className="flex items-center gap-2 text-orange-700 mb-2">
                        <Wind className="w-4 h-4" />
                        <span className="text-xs font-black">Fan</span>
                      </div>
                      <p className="text-2xl font-black text-orange-900 capitalize">{modalDevice.fanSpeed || 'medium'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-600 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl border-2 border-slate-300">
                    <Power className="w-14 h-14 mx-auto mb-3 opacity-40" />
                    <p className="font-bold">Device is offline</p>
                  </div>
                )}
              </div>

              {/* Scene Presets */}
              <div>
                <h4 className="text-base font-black text-slate-900 mb-3">Scene Presets</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {Object.values(SCENE_PRESETS).map(scene => (
                    <button
                      key={scene.name}
                      className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-xl hover:scale-105 shadow-md ${scene.color}`}
                    >
                      <h5 className="font-black text-base mb-2">{scene.name}</h5>
                      <p className="text-xs opacity-90 mb-3">{scene.description}</p>
                      <div className="space-y-1 text-xs font-bold">
                        <div className="flex justify-between">
                          <span>Temperature:</span>
                          <span className="font-black">{scene.targetTemp}°C</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fan Speed:</span>
                          <span className="font-black capitalize">{scene.fanSpeed}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Device Schedules */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Schedules ({modalDevice.schedules?.length || 0})
                  </h4>
                  <button
                    onClick={() => {
                      setShowDeviceModal(false);
                      handleAddSchedule(modalDevice);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all text-sm font-black shadow-lg border-2 border-indigo-400"
                  >
                    <Plus className="w-4 h-4" />
                    Add Schedule
                  </button>
                </div>

                {modalDevice.schedules && modalDevice.schedules.length > 0 ? (
                  <div className="space-y-3">
                    {modalDevice.schedules.map(schedule => (
                      <div
                        key={schedule.id}
                        className={`p-4 rounded-xl border-2 transition-all shadow-md ${
                          schedule.enabled
                            ? 'border-blue-300/60 bg-gradient-to-br from-white to-blue-50/30'
                            : 'border-slate-300/60 bg-gradient-to-br from-slate-50 to-slate-100/30'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                              <h5 className="font-black text-slate-900">{schedule.name}</h5>
                              {schedule.powerState && (
                                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black border-2 shadow-sm ${
                                  schedule.powerState === 'on'
                                    ? 'bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-800 border-emerald-400/70'
                                    : 'bg-gradient-to-br from-rose-100 to-red-100 text-rose-800 border-rose-400/70'
                                }`}>
                                  <Power className="w-3.5 h-3.5" />
                                  {schedule.powerState.toUpperCase()}
                                </span>
                              )}
                              {schedule.powerState === 'on' && schedule.scene && (
                                <span className={`px-3 py-1.5 rounded-lg text-xs font-black border-2 shadow-sm ${
                                  SCENE_PRESETS[schedule.scene].color
                                }`}>
                                  {schedule.scene}
                                </span>
                              )}
                              <span className={`px-3 py-1.5 rounded-lg text-xs font-black border-2 shadow-sm ${
                                schedule.enabled
                                  ? 'bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-800 border-emerald-400/70'
                                  : 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 border-slate-300'
                              }`}>
                                {schedule.enabled ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg font-black border-2 border-indigo-300/60 shadow-sm">
                                <Clock className="w-4 h-4 text-indigo-600" />
                                <span className="text-indigo-900">
                                  {schedule.startTime || schedule.time} - {schedule.endTime || 'N/A'}
                                </span>
                              </span>
                              <div className="flex gap-2 flex-wrap">
                                {schedule.days.map(day => (
                                  <span key={day} className="px-3 py-2 bg-white rounded-lg border-2 border-blue-200/60 text-xs font-black text-blue-900 shadow-sm">
                                    {day}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={schedule.enabled}
                                onChange={() => toggleSchedule(modalDevice, schedule.id)}
                                className="sr-only peer"
                              />
                              <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-teal-600 shadow-lg"></div>
                            </label>
                            <button
                              onClick={() => {
                                setShowDeviceModal(false);
                                handleEditSchedule(modalDevice, schedule);
                              }}
                              className="p-2 text-slate-600 hover:text-white hover:bg-indigo-600 rounded-lg transition-all hover:shadow-md"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSchedule(modalDevice, schedule.id)}
                              className="p-2 text-slate-600 hover:text-white hover:bg-rose-600 rounded-lg transition-all hover:shadow-md"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-600 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl border-2 border-dashed border-slate-300">
                    <Clock className="w-14 h-14 mx-auto mb-3 opacity-40" />
                    <p className="mb-2 font-black text-slate-800">No schedules configured</p>
                    <p className="text-sm font-bold">Schedules will appear here once created</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}