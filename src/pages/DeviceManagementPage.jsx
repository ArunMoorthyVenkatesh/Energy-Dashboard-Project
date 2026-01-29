import React, { useState, useEffect } from 'react';
import { Settings, Thermometer, Droplets, Wind, Clock, Plus, Edit2, Trash2, Power, ChevronDown, ChevronUp } from 'lucide-react';
import DeviceAPI from '../api/DeviceAPI';

// Scene Presets
const SCENE_PRESETS = {
  Eco: {
    name: 'Eco',
    description: 'Energy-efficient cooling',
    targetTemp: 26,
    fanSpeed: 'low',
    mode: 'cooling',
    color: 'bg-green-100 text-green-700 border-green-300'
  },
  Comfort: {
    name: 'Comfort',
    description: 'Balanced comfort',
    targetTemp: 23,
    fanSpeed: 'medium',
    mode: 'cooling',
    color: 'bg-blue-100 text-blue-700 border-blue-300'
  },
  Cool: {
    name: 'Cool',
    description: 'Maximum cooling',
    targetTemp: 20,
    fanSpeed: 'high',
    mode: 'cooling',
    color: 'bg-purple-100 text-purple-700 border-purple-300'
  }
};

export default function DeviceManagementPage() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [isDeviceListCollapsed, setIsDeviceListCollapsed] = useState(false);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    setLoading(true);
    try {
      const data = await DeviceAPI.getDevices();
      setDevices(data);
      if (data.length > 0) {
        setSelectedDevice(data[0]);
      }
    } catch (error) {
      console.error('Failed to load devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSchedule = () => {
    setEditingSchedule({
      id: `sched-${Date.now()}`,
      name: '',
      time: '09:00',
      days: [],
      scene: 'Comfort',
      enabled: true
    });
    setShowScheduleModal(true);
  };

  const handleEditSchedule = (schedule) => {
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
      
      let savedSchedule;
      if (scheduleExists) {
        // Update existing schedule
        savedSchedule = await DeviceAPI.updateSchedule(
          selectedDevice.id,
          editingSchedule.id,
          editingSchedule
        );
        console.log('✅ Schedule updated:', savedSchedule);
      } else {
        // Create new schedule
        savedSchedule = await DeviceAPI.createSchedule(
          selectedDevice.id,
          editingSchedule
        );
        console.log('✅ Schedule created:', savedSchedule);
      }

      // Update local state
      const updatedDevices = devices.map(device => {
        if (device.id === selectedDevice.id) {
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
      setSelectedDevice(updatedDevices.find(d => d.id === selectedDevice.id));
      setShowScheduleModal(false);
      setEditingSchedule(null);
      
      alert(scheduleExists ? 'Schedule updated successfully!' : 'Schedule created successfully!');
    } catch (error) {
      console.error('❌ Failed to save schedule:', error);
      alert('Failed to save schedule. The backend endpoint may not be implemented yet. Changes saved locally only.');
      
      // Still update local state even if API fails
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
      setSelectedDevice(updatedDevices.find(d => d.id === selectedDevice.id));
      setShowScheduleModal(false);
      setEditingSchedule(null);
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      try {
        // Call API to delete schedule
        await DeviceAPI.deleteSchedule(selectedDevice.id, scheduleId);
        console.log('✅ Schedule deleted from backend');

        // Update local state
        const updatedDevices = devices.map(device => {
          if (device.id === selectedDevice.id) {
            return {
              ...device,
              schedules: device.schedules.filter(s => s.id !== scheduleId)
            };
          }
          return device;
        });

        setDevices(updatedDevices);
        setSelectedDevice(updatedDevices.find(d => d.id === selectedDevice.id));
        
        alert('Schedule deleted successfully!');
      } catch (error) {
        console.error('❌ Failed to delete schedule:', error);
        alert('Failed to delete schedule. The backend endpoint may not be implemented yet. Changes saved locally only.');
        
        // Still update local state even if API fails
        const updatedDevices = devices.map(device => {
          if (device.id === selectedDevice.id) {
            return {
              ...device,
              schedules: device.schedules.filter(s => s.id !== scheduleId)
            };
          }
          return device;
        });

        setDevices(updatedDevices);
        setSelectedDevice(updatedDevices.find(d => d.id === selectedDevice.id));
      }
    }
  };

  const toggleSchedule = async (scheduleId) => {
    try {
      const schedule = selectedDevice.schedules.find(s => s.id === scheduleId);
      const newEnabledState = !schedule.enabled;

      // Call API to toggle schedule
      await DeviceAPI.toggleSchedule(selectedDevice.id, scheduleId, newEnabledState);
      console.log('✅ Schedule toggled in backend');

      // Update local state
      const updatedDevices = devices.map(device => {
        if (device.id === selectedDevice.id) {
          return {
            ...device,
            schedules: device.schedules.map(s => 
              s.id === scheduleId ? { ...s, enabled: newEnabledState } : s
            )
          };
        }
        return device;
      });

      setDevices(updatedDevices);
      setSelectedDevice(updatedDevices.find(d => d.id === selectedDevice.id));
    } catch (error) {
      console.error('❌ Failed to toggle schedule:', error);
      
      // Still update local state even if API fails
      const updatedDevices = devices.map(device => {
        if (device.id === selectedDevice.id) {
          return {
            ...device,
            schedules: device.schedules.map(s => 
              s.id === scheduleId ? { ...s, enabled: !s.enabled } : s
            )
          };
        }
        return device;
      });

      setDevices(updatedDevices);
      setSelectedDevice(updatedDevices.find(d => d.id === selectedDevice.id));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading devices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Device Management</h1>
          <p className="text-gray-600 mt-1">Manage your devices and schedules</p>
        </div>
        
        {/* Collapsible Device List Section - AT THE TOP */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Header - Clickable to collapse/expand */}
            <button
              onClick={() => setIsDeviceListCollapsed(!isDeviceListCollapsed)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">Your Devices</h2>
                <span className="text-sm text-gray-500">({devices.length})</span>
              </div>
              {isDeviceListCollapsed ? (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              )}
            </button>

            {/* Device List - Collapsible Content */}
            {!isDeviceListCollapsed && (
              <div className="p-4 pt-0 border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {devices.map(device => (
                    <button
                      key={device.id}
                      onClick={() => setSelectedDevice(device)}
                      className={`text-left p-4 rounded-lg border-2 transition-all ${
                        selectedDevice?.id === device.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{device.name}</span>
                        <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                          device.status === 'online' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          <div className={`w-2 h-2 rounded-full ${
                            device.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>
                          {device.status}
                        </span>
                      </div>
                      {device.status === 'online' && device.currentTemp && (
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Thermometer className="w-4 h-4" />
                            {device.currentTemp}°C
                          </span>
                          {device.humidity && (
                            <span className="flex items-center gap-1">
                              <Droplets className="w-4 h-4" />
                              {device.humidity}%
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Device Settings - Below the collapsible list */}
        {selectedDevice && (
          <div className="space-y-6">
            {/* Current Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  {selectedDevice.name}
                </h2>
                <button className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedDevice.powerState === 'on'
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}>
                  <Power className="w-4 h-4 inline mr-2" />
                  {selectedDevice.powerState === 'on' ? 'ON' : 'OFF'}
                </button>
              </div>

              {selectedDevice.status === 'online' ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {selectedDevice.currentTemp && (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                      <div className="flex items-center gap-2 text-blue-700 mb-1">
                        <Thermometer className="w-4 h-4" />
                        <span className="text-sm font-medium">Current</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-900">{selectedDevice.currentTemp}°C</p>
                    </div>
                  )}
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                    <div className="flex items-center gap-2 text-purple-700 mb-1">
                      <Thermometer className="w-4 h-4" />
                      <span className="text-sm font-medium">Target</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-900">{selectedDevice.targetTemp}°C</p>
                  </div>
                  {selectedDevice.humidity && (
                    <div className="bg-teal-50 rounded-lg p-4 border border-teal-100">
                      <div className="flex items-center gap-2 text-teal-700 mb-1">
                        <Droplets className="w-4 h-4" />
                        <span className="text-sm font-medium">Humidity</span>
                      </div>
                      <p className="text-2xl font-bold text-teal-900">{selectedDevice.humidity}%</p>
                    </div>
                  )}
                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                    <div className="flex items-center gap-2 text-orange-700 mb-1">
                      <Wind className="w-4 h-4" />
                      <span className="text-sm font-medium">Fan</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-900 capitalize">{selectedDevice.fanSpeed}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Power className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Device is offline</p>
                </div>
              )}
            </div>

            {/* Scene Presets */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Scene Presets</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.values(SCENE_PRESETS).map(scene => (
                  <button
                    key={scene.name}
                    className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${scene.color}`}
                  >
                    <h4 className="font-semibold text-lg mb-1">{scene.name}</h4>
                    <p className="text-sm opacity-80 mb-3">{scene.description}</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Temperature:</span>
                        <span className="font-medium">{scene.targetTemp}°C</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fan Speed:</span>
                        <span className="font-medium capitalize">{scene.fanSpeed}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Schedule Settings */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Schedule Settings
                </h3>
                <button
                  onClick={handleAddSchedule}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Schedule
                </button>
              </div>

              {selectedDevice.schedules && selectedDevice.schedules.length > 0 ? (
                <div className="space-y-3">
                  {selectedDevice.schedules.map(schedule => (
                    <div
                      key={schedule.id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        schedule.enabled
                          ? 'border-blue-200 bg-blue-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-gray-900">{schedule.name}</h4>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              SCENE_PRESETS[schedule.scene].color
                            }`}>
                              {schedule.scene}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {schedule.time}
                            </span>
                            <span className="flex gap-1 flex-wrap">
                              {schedule.days.map(day => (
                                <span key={day} className="px-2 py-1 bg-white rounded border border-gray-300 text-xs font-medium">
                                  {day}
                                </span>
                              ))}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={schedule.enabled}
                              onChange={() => toggleSchedule(schedule.id)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                          <button
                            onClick={() => handleEditSchedule(schedule)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="mb-2">No schedules configured</p>
                  <p className="text-sm">Click "Add Schedule" to create your first automation</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {editingSchedule?.name ? 'Edit Schedule' : 'New Schedule'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schedule Name *
                </label>
                <input
                  type="text"
                  value={editingSchedule?.name || ''}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="e.g., Morning Comfort"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time *
                </label>
                <input
                  type="time"
                  value={editingSchedule?.time || '09:00'}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
                  style={{ colorScheme: 'light' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        editingSchedule?.days?.includes(day)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scene Preset
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.keys(SCENE_PRESETS).map(sceneName => (
                    <button
                      key={sceneName}
                      type="button"
                      onClick={() => setEditingSchedule({ ...editingSchedule, scene: sceneName })}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        editingSchedule?.scene === sceneName
                          ? SCENE_PRESETS[sceneName].color
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {sceneName}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowScheduleModal(false);
                  setEditingSchedule(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSchedule}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}