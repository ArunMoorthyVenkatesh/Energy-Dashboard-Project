import React, { useState, useEffect } from 'react';
import { Settings, Thermometer, Droplets, Wind, Clock, Plus, Edit2, Trash2, Power, ChevronDown, ChevronUp, Filter, Sunrise, Sun, Sunset, Moon, X } from 'lucide-react';
import DeviceAPI from '../api/DeviceAPI';

// Refined Scene Presets with sophisticated colors
const SCENE_PRESETS = {
  Eco: {
    name: 'Eco',
    description: 'Energy-efficient cooling',
    targetTemp: 26,
    fanSpeed: 'low',
    mode: 'cooling',
    color: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 text-emerald-800 border-emerald-200/60'
  },
  Comfort: {
    name: 'Comfort',
    description: 'Balanced comfort',
    targetTemp: 23,
    fanSpeed: 'medium',
    mode: 'cooling',
    color: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 text-blue-800 border-blue-200/60'
  },
  Cool: {
    name: 'Cool',
    description: 'Maximum cooling',
    targetTemp: 20,
    fanSpeed: 'high',
    mode: 'cooling',
    color: 'bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 text-violet-800 border-violet-200/60'
  }
};

const STORAGE_KEYS = {
  DEVICES: 'device_management_devices',
  SCHEDULES: 'device_management_schedules'
};

// Time period configuration
const TIME_PERIODS = {
  morning: { 
    icon: Sunrise, 
    label: 'Morning', 
    range: '5AM - 12PM',
    gradient: 'from-amber-500 to-orange-500'
  },
  afternoon: { 
    icon: Sun, 
    label: 'Afternoon', 
    range: '12PM - 5PM',
    gradient: 'from-orange-500 to-red-500'
  },
  evening: { 
    icon: Sunset, 
    label: 'Evening', 
    range: '5PM - 9PM',
    gradient: 'from-violet-500 to-purple-600'
  },
  night: { 
    icon: Moon, 
    label: 'Night', 
    range: '9PM - 5AM',
    gradient: 'from-indigo-600 to-blue-700'
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
      time: '09:00',
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
        const hour = parseInt(schedule.time.split(':')[0]);
        
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
      const timeA = a.time.split(':').map(Number);
      const timeB = b.time.split(':').map(Number);
      
      if (timeA[0] !== timeB[0]) {
        return timeA[0] - timeB[0];
      }
      return timeA[1] - timeB[1];
    });
    
    return filteredSchedules;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-violet-50 via-blue-50 to-cyan-50">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          </div>
          <p className="text-slate-600 font-medium tracking-wide">Loading devices</p>
        </div>
      </div>
    );
  }

  const allSchedules = getAllSchedules();
  const activeCount = devices.reduce((sum, d) => sum + (d.schedules?.filter(s => s.enabled).length || 0), 0);
  const inactiveCount = devices.reduce((sum, d) => sum + (d.schedules?.filter(s => !s.enabled).length || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-blue-50 to-cyan-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Refined Header */}
        <div className="mb-8">
          <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/50">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">
                  Device Management
                </h1>
                <p className="text-slate-600 font-medium">Control and automate your connected devices</p>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2.5 px-4 py-2 bg-emerald-50/80 backdrop-blur-sm border border-emerald-200/60 rounded-xl">
                  <div className="relative">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <div className="absolute inset-0 w-2 h-2 bg-emerald-500 rounded-full animate-ping opacity-75"></div>
                  </div>
                  <span className="text-sm font-semibold text-emerald-700 tracking-wide">Auto-saved</span>
                </div>
                {lastUpdated && (
                  <p className="text-xs text-slate-500 font-medium">
                    {lastUpdated.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Device List */}
        <div className="mb-8">
          <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200/60">
            <button
              onClick={() => setIsDeviceListCollapsed(!isDeviceListCollapsed)}
              className="w-full flex items-center justify-between p-6 hover:bg-slate-50/50 transition-all duration-300 rounded-t-3xl group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Your Devices</h2>
                  <p className="text-sm text-slate-500 font-medium">{devices.length} connected</p>
                </div>
              </div>
              {isDeviceListCollapsed ? (
                <ChevronDown className="w-6 h-6 text-slate-400 group-hover:text-slate-600 transition-colors" />
              ) : (
                <ChevronUp className="w-6 h-6 text-slate-400 group-hover:text-slate-600 transition-colors" />
              )}
            </button>

            {!isDeviceListCollapsed && (
              <div className="p-6 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {devices.map(device => (
                    <div
                      key={device.id}
                      onClick={() => handleDeviceClick(device)}
                      className="group p-6 rounded-2xl border border-slate-200 bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:via-indigo-50 hover:to-purple-50 hover:border-blue-300 hover:shadow-xl transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-bold text-slate-900 group-hover:text-slate-800 transition-colors text-lg">{device.name}</span>
                        <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold ${
                          device.status === 'online' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' 
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            device.status === 'online' ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}></div>
                          {device.status}
                        </span>
                      </div>
                      {device.status === 'online' && device.currentTemp && (
                        <div className="flex items-center gap-3 mb-4">
                          <span className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200/60">
                            <Thermometer className="w-4 h-4 text-slate-600" />
                            <span className="font-semibold text-slate-800">{device.currentTemp}°C</span>
                          </span>
                          {device.humidity && (
                            <span className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200/60">
                              <Droplets className="w-4 h-4 text-slate-600" />
                              <span className="font-semibold text-slate-800">{device.humidity}%</span>
                            </span>
                          )}
                        </div>
                      )}
                      <div className="pt-4 border-t border-slate-200 group-hover:border-slate-300 transition-colors">
                        <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                          <Clock className="w-4 h-4" />
                          <span>{device.schedules?.length || 0} schedule{device.schedules?.length !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* All Schedules - continuing in next part due to length */}
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200/60">
          <button
            onClick={() => setIsSchedulesCollapsed(!isSchedulesCollapsed)}
            className="w-full flex items-center justify-between p-6 hover:bg-slate-50/50 transition-all duration-300 rounded-t-3xl group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">All Schedules</h2>
                <p className="text-sm text-slate-500 font-medium">
                  {allSchedules.length} {scheduleFilter !== 'all' ? scheduleFilter : 'total'}
                </p>
              </div>
            </div>
            {isSchedulesCollapsed ? (
              <ChevronDown className="w-6 h-6 text-slate-400 group-hover:text-slate-600 transition-colors" />
            ) : (
              <ChevronUp className="w-6 h-6 text-slate-400 group-hover:text-slate-600 transition-colors" />
            )}
          </button>

          {!isSchedulesCollapsed && (
            <div className="border-t border-slate-200/60">
              {/* Refined Filters */}
              <div className="p-6 bg-slate-50/50 space-y-5">
                {/* Status Filter */}
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl shadow-sm border border-slate-200/60 min-w-fit">
                    <Filter className="w-4 h-4 text-slate-600" />
                    <span className="text-sm font-bold text-slate-700">Status</span>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={() => setScheduleFilter('all')}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                        scheduleFilter === 'all'
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                          : 'bg-white text-slate-700 hover:bg-blue-50 border border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      All · {activeCount + inactiveCount}
                    </button>
                    <button
                      onClick={() => setScheduleFilter('active')}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                        scheduleFilter === 'active'
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                          : 'bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      Active · {activeCount}
                    </button>
                    <button
                      onClick={() => setScheduleFilter('inactive')}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                        scheduleFilter === 'inactive'
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                          : 'bg-white text-slate-700 hover:bg-orange-50 border border-slate-200 hover:border-orange-300'
                      }`}
                    >
                      Inactive · {inactiveCount}
                    </button>
                  </div>
                </div>

                {/* Time Filter */}
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl shadow-sm border border-slate-200/60 min-w-fit">
                    <Clock className="w-4 h-4 text-slate-600" />
                    <span className="text-sm font-bold text-slate-700">Period</span>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    {Object.entries(TIME_PERIODS).map(([key, period]) => {
                      const Icon = period.icon;
                      return (
                        <button
                          key={key}
                          onClick={() => setTimeFilter(key)}
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                            timeFilter === key
                              ? `bg-gradient-to-r ${period.gradient} text-white shadow-lg`
                              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300'
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
                  <div className="pt-4 border-t border-slate-200">
                    <button
                      onClick={() => {
                        setScheduleFilter('all');
                        setTimeFilter('all');
                        setDeviceFilter('all');
                      }}
                      className="px-5 py-2.5 text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>

              {/* Schedule List */}
              <div className="p-6">
                {allSchedules.length > 0 ? (
                  <div className="space-y-4">
                    {allSchedules.map(schedule => {
                      const device = devices.find(d => d.id === schedule.deviceId);
                      return (
                        <div
                          key={`${schedule.deviceId}-${schedule.id}`}
                          className={`group p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg ${
                            schedule.enabled
                              ? 'border-slate-300 bg-white hover:border-slate-400'
                              : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-4 flex-wrap">
                                <h4 className="font-bold text-lg text-slate-900">{schedule.name}</h4>
                                <span className="text-xs px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-bold border border-slate-200">
                                  {schedule.deviceName}
                                </span>
                                {schedule.powerState && (
                                  <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${
                                    schedule.powerState === 'on'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                                      : 'bg-rose-50 text-rose-700 border-rose-200/60'
                                  }`}>
                                    <Power className="w-3.5 h-3.5" />
                                    {schedule.powerState.toUpperCase()}
                                  </span>
                                )}
                                {schedule.powerState === 'on' && schedule.scene && (
                                  <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                                    SCENE_PRESETS[schedule.scene].color
                                  }`}>
                                    {schedule.scene}
                                  </span>
                                )}
                                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                                  schedule.enabled
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}>
                                  {schedule.enabled ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 flex-wrap">
                                <span className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl font-bold border border-slate-200">
                                  <Clock className="w-4 h-4 text-slate-600" />
                                  <span className="text-slate-900">{schedule.time}</span>
                                </span>
                                <div className="flex gap-2 flex-wrap">
                                  {schedule.days.map(day => (
                                    <span key={day} className="px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:border-slate-300 transition-colors">
                                      {day}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 ml-6">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={schedule.enabled}
                                  onChange={() => toggleSchedule(device, schedule.id)}
                                  className="sr-only peer"
                                />
                                <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-emerald-600 peer-checked:to-teal-600 shadow-inner"></div>
                              </label>
                              <button
                                onClick={() => handleEditSchedule(device, schedule)}
                                className="p-2.5 text-slate-600 hover:text-white hover:bg-slate-700 rounded-xl transition-all hover:shadow-md"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSchedule(device, schedule.id)}
                                className="p-2.5 text-slate-600 hover:text-white hover:bg-rose-600 rounded-xl transition-all hover:shadow-md"
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
                  <div className="text-center py-20 text-slate-500 bg-slate-50/50 rounded-2xl border border-dashed border-slate-300">
                    <Clock className="w-16 h-16 mx-auto mb-4 opacity-40 text-slate-400" />
                    <p className="mb-2 font-bold text-lg text-slate-700">
                      {scheduleFilter === 'all' 
                        ? 'No schedules configured'
                        : `No ${scheduleFilter} schedules`}
                    </p>
                    <p className="text-sm text-slate-500 font-medium">
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

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">
              {editingSchedule?.name ? 'Edit Schedule' : 'New Schedule'}
            </h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Device
                </label>
                <div className="px-4 py-3 bg-slate-50 rounded-xl text-slate-900 font-semibold border border-slate-200">
                  {selectedDevice?.name}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Schedule Name *
                </label>
                <input
                  type="text"
                  value={editingSchedule?.name || ''}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 text-slate-900 font-medium"
                  placeholder="e.g., Morning Comfort"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Time *
                </label>
                <input
                  type="time"
                  value={editingSchedule?.time || '09:00'}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, time: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
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
                      className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        editingSchedule?.days?.includes(day)
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                          : 'bg-slate-100 text-slate-700 hover:bg-blue-100 hover:text-blue-700 border border-slate-200'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  Power State *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingSchedule({ ...editingSchedule, powerState: 'on' })}
                    className={`p-4 rounded-2xl border-2 text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                      editingSchedule?.powerState === 'on'
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-emerald-400 shadow-xl'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50'
                    }`}
                  >
                    <Power className="w-5 h-5" />
                    Turn ON
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingSchedule({ ...editingSchedule, powerState: 'off' })}
                    className={`p-4 rounded-2xl border-2 text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                      editingSchedule?.powerState === 'off'
                        ? 'bg-gradient-to-br from-rose-500 to-red-600 text-white border-rose-400 shadow-xl'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-rose-300 hover:bg-rose-50'
                    }`}
                  >
                    <Power className="w-5 h-5" />
                    Turn OFF
                  </button>
                </div>
              </div>

              {editingSchedule?.powerState === 'on' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">
                    Scene Preset
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.keys(SCENE_PRESETS).map(sceneName => (
                      <button
                        key={sceneName}
                        type="button"
                        onClick={() => setEditingSchedule({ ...editingSchedule, scene: sceneName })}
                        className={`p-4 rounded-2xl border-2 text-sm font-bold transition-all ${
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

            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={() => {
                  setShowScheduleModal(false);
                  setEditingSchedule(null);
                  setSelectedDevice(null);
                }}
                className="flex-1 px-5 py-3 border-2 border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSchedule}
                className="flex-1 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-bold shadow-lg"
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Device Detail Modal */}
      {showDeviceModal && modalDevice && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-slate-200 p-6 rounded-t-3xl z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">{modalDevice.name}</h3>
                    <p className="text-sm text-slate-500 font-medium">Device Details</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDeviceModal(false);
                    setModalDevice(null);
                  }}
                  className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Current Status */}
              <div>
                <h4 className="text-lg font-bold text-slate-900 mb-4">Current Status</h4>
                {modalDevice.status === 'online' ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {modalDevice.currentTemp && (
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-200/60">
                        <div className="flex items-center gap-2 text-blue-700 mb-2">
                          <Thermometer className="w-5 h-5" />
                          <span className="text-sm font-bold">Current</span>
                        </div>
                        <p className="text-3xl font-bold text-blue-900">{modalDevice.currentTemp}°C</p>
                      </div>
                    )}
                    <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-5 border border-violet-200/60">
                      <div className="flex items-center gap-2 text-violet-700 mb-2">
                        <Thermometer className="w-5 h-5" />
                        <span className="text-sm font-bold">Target</span>
                      </div>
                      <p className="text-3xl font-bold text-violet-900">{modalDevice.targetTemp || 24}°C</p>
                    </div>
                    {modalDevice.humidity && (
                      <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-5 border border-teal-200/60">
                        <div className="flex items-center gap-2 text-teal-700 mb-2">
                          <Droplets className="w-5 h-5" />
                          <span className="text-sm font-bold">Humidity</span>
                        </div>
                        <p className="text-3xl font-bold text-teal-900">{modalDevice.humidity}%</p>
                      </div>
                    )}
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-5 border border-orange-200/60">
                      <div className="flex items-center gap-2 text-orange-700 mb-2">
                        <Wind className="w-5 h-5" />
                        <span className="text-sm font-bold">Fan</span>
                      </div>
                      <p className="text-3xl font-bold text-orange-900 capitalize">{modalDevice.fanSpeed || 'medium'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                    <Power className="w-16 h-16 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">Device is offline</p>
                  </div>
                )}
              </div>

              {/* Scene Presets */}
              <div>
                <h4 className="text-lg font-bold text-slate-900 mb-4">Scene Presets</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.values(SCENE_PRESETS).map(scene => (
                    <button
                      key={scene.name}
                      className={`p-5 rounded-2xl border-2 text-left transition-all hover:shadow-lg hover:scale-105 ${scene.color}`}
                    >
                      <h5 className="font-bold text-lg mb-2">{scene.name}</h5>
                      <p className="text-sm opacity-80 mb-4">{scene.description}</p>
                      <div className="space-y-2 text-sm font-medium">
                        <div className="flex justify-between">
                          <span>Temperature:</span>
                          <span className="font-bold">{scene.targetTemp}°C</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fan Speed:</span>
                          <span className="font-bold capitalize">{scene.fanSpeed}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Device Schedules */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Schedules ({modalDevice.schedules?.length || 0})
                  </h4>
                  <button
                    onClick={() => {
                      setShowDeviceModal(false);
                      handleAddSchedule(modalDevice);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all text-sm font-bold shadow-lg"
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
                        className={`p-5 rounded-2xl border-2 transition-all ${
                          schedule.enabled
                            ? 'border-slate-300 bg-white'
                            : 'border-slate-200 bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3 flex-wrap">
                              <h5 className="font-bold text-slate-900">{schedule.name}</h5>
                              {schedule.powerState && (
                                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${
                                  schedule.powerState === 'on'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                                    : 'bg-rose-50 text-rose-700 border-rose-200/60'
                                }`}>
                                  <Power className="w-3.5 h-3.5" />
                                  {schedule.powerState.toUpperCase()}
                                </span>
                              )}
                              {schedule.powerState === 'on' && schedule.scene && (
                                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                                  SCENE_PRESETS[schedule.scene].color
                                }`}>
                                  {schedule.scene}
                                </span>
                              )}
                              <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                                schedule.enabled
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}>
                                {schedule.enabled ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 flex-wrap">
                              <span className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl font-bold border border-slate-200">
                                <Clock className="w-4 h-4 text-slate-600" />
                                <span className="text-slate-900">{schedule.time}</span>
                              </span>
                              <div className="flex gap-2 flex-wrap">
                                {schedule.days.map(day => (
                                  <span key={day} className="px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
                                    {day}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 ml-6">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={schedule.enabled}
                                onChange={() => toggleSchedule(modalDevice, schedule.id)}
                                className="sr-only peer"
                              />
                              <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-emerald-600 peer-checked:to-teal-600 shadow-inner"></div>
                            </label>
                            <button
                              onClick={() => {
                                setShowDeviceModal(false);
                                handleEditSchedule(modalDevice, schedule);
                              }}
                              className="p-2.5 text-slate-600 hover:text-white hover:bg-slate-700 rounded-xl transition-all hover:shadow-md"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSchedule(modalDevice, schedule.id)}
                              className="p-2.5 text-slate-600 hover:text-white hover:bg-rose-600 rounded-xl transition-all hover:shadow-md"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500 bg-slate-50/50 rounded-2xl border border-dashed border-slate-300">
                    <Clock className="w-16 h-16 mx-auto mb-3 opacity-40" />
                    <p className="mb-2 font-bold text-slate-700">No schedules configured</p>
                    <p className="text-sm">Schedules will appear here once created</p>
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