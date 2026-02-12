import React, { useState, useEffect, useCallback } from 'react';
import { Network, MapPin, Cpu, ChevronDown, ChevronUp, Zap, RefreshCw, AlertCircle, Loader2, BarChart3, X, Activity } from 'lucide-react';
import { fetchSiteMetadata, fetchGroupsForSite, fetchSiteDevices } from '../api';
import { fetchGroupGanttChart } from '../api/ganttApi';
import API from '../api/BaseAPI';
import { loadRuntimeConfig } from '../config/RuntimeConfig';

export default function GroupSiteManagementPage() {
  const [siteId, setSiteId] = useState('TKKHEAD01');
  const [siteInfo, setSiteInfo] = useState(null);
  const [groups, setGroups] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [groupGanttData, setGroupGanttData] = useState({});
  const [ganttLoading, setGanttLoading] = useState({});
  const [expandedDevice, setExpandedDevice] = useState(null);
  const [deviceEnergyData, setDeviceEnergyData] = useState({});
  const [deviceEnergyLoading, setDeviceEnergyLoading] = useState({});
  // Store raw group data from energy-usage-list (unmapped, with full device info)
  const [rawGroupData, setRawGroupData] = useState([]);

  const loadData = useCallback(async (currentSiteId) => {
    setLoading(true);
    setError(null);
    try {
      const [siteMeta, groupList, deviceList] = await Promise.all([
        fetchSiteMetadata(currentSiteId),
        fetchGroupsForSite(currentSiteId),
        fetchSiteDevices(currentSiteId),
      ]);

      // Also fetch raw energy-usage-list for device-level data
      let rawItems = [];
      try {
        const rawRes = await API({
          method: 'GET',
          url: '/groups/energy-usage-list',
          params: { site_owner_id: currentSiteId },
        });
        rawItems = rawRes?.data?.data?.items ?? rawRes?.data?.items ?? [];
      } catch (e) {
        console.warn('Failed to fetch raw energy-usage-list:', e);
      }

      setSiteInfo(siteMeta);
      setGroups(groupList);
      setDevices(deviceList);
      setRawGroupData(rawItems);
    } catch (err) {
      console.error('Failed to load group & site data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const cfg = await loadRuntimeConfig();
        if (cfg?.SITE_ID) setSiteId(cfg.SITE_ID);
      } catch {
        // use default siteId
      }
    })();
  }, []);

  useEffect(() => {
    if (siteId) loadData(siteId);
  }, [siteId, loadData]);

  const toggleGroup = async (groupId) => {
    if (expandedGroup === groupId) {
      setExpandedGroup(null);
      setExpandedDevice(null);
      return;
    }
    setExpandedGroup(groupId);
    setExpandedDevice(null);

    if (!groupGanttData[groupId]) {
      setGanttLoading((prev) => ({ ...prev, [groupId]: true }));
      try {
        const todayIso = new Date().toISOString().slice(0, 10);
        const data = await fetchGroupGanttChart({
          groupId,
          granularity: 'hour',
          date: todayIso,
          tz: 'Asia/Ho_Chi_Minh',
        });
        setGroupGanttData((prev) => ({ ...prev, [groupId]: data }));
      } catch (err) {
        console.error(`Failed to load gantt for group ${groupId}:`, err);
        setGroupGanttData((prev) => ({ ...prev, [groupId]: null }));
      } finally {
        setGanttLoading((prev) => ({ ...prev, [groupId]: false }));
      }
    }
  };

  const toggleDevice = async (deviceId, groupId) => {
    if (expandedDevice === deviceId) {
      setExpandedDevice(null);
      return;
    }
    setExpandedDevice(deviceId);

    // Load device energy data from the energy-usage-list if not cached
    if (!deviceEnergyData[deviceId]) {
      setDeviceEnergyLoading((prev) => ({ ...prev, [deviceId]: true }));
      try {
        // Find this device's data from the raw energy-usage-list response
        const rawGroup = rawGroupData.find((g) => String(g.groupId) === String(groupId));
        const rawDevice = rawGroup?.devices?.find((d) => String(d.deviceId) === String(deviceId));

        // Also get site-level device data (power info)
        const siteDevice = devices.find((d) => String(d.deviceId) === String(deviceId));

        const combined = {
          ...(rawDevice || {}),
          ...(siteDevice || {}),
          groupName: rawGroup?.name || null,
          groupUsage: rawGroup?.usage_energy || null,
        };

        setDeviceEnergyData((prev) => ({ ...prev, [deviceId]: combined }));
      } catch (err) {
        console.error(`Failed to load energy data for device ${deviceId}:`, err);
        setDeviceEnergyData((prev) => ({ ...prev, [deviceId]: null }));
      } finally {
        setDeviceEnergyLoading((prev) => ({ ...prev, [deviceId]: false }));
      }
    }
  };

  // Group's devices are a flat array: { deviceId, deviceType, name, role }
  // Group them by deviceType for display
  const getDevicesByType = (group) => {
    if (!group?.devices || !Array.isArray(group.devices)) return [];
    const typeMap = {};
    for (const dev of group.devices) {
      const type = dev.deviceType || 'unknown';
      if (!typeMap[type]) typeMap[type] = [];
      typeMap[type].push(dev);
    }
    return Object.entries(typeMap).map(([type, devs]) => ({ type, devices: devs }));
  };

  const getGroupDeviceIds = (group) => {
    if (!group?.devices || !Array.isArray(group.devices)) return [];
    return group.devices.map((d) => String(d.deviceId));
  };

  const getMatchedSiteDevices = (group) => {
    const ids = getGroupDeviceIds(group);
    return devices.filter((d) => ids.includes(String(d.deviceId)) || ids.includes(String(d.id)));
  };

  const onlineDevices = devices.filter((d) => d.power?.now?.online);

  const ROLE_COLORS = {
    load: 'bg-orange-100 text-orange-700 border-orange-200',
    solar: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    grid: 'bg-blue-100 text-blue-700 border-blue-200',
    none: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-10 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
          <p className="text-slate-500 font-medium">Loading group & site data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-10">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button
            onClick={() => loadData(siteId)}
            className="px-5 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl text-white shadow-lg">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Group & Site Management</h1>
            <p className="text-sm text-slate-500 font-medium">Manage your groups and sites</p>
          </div>
        </div>
        <button
          onClick={() => loadData(siteId)}
          className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-slate-700"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Site Info Card */}
      {siteInfo && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl shadow-sm border border-emerald-200/60 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-3 shadow-lg">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{siteInfo.name || 'Unknown Site'}</h2>
                <p className="text-sm text-slate-500">
                  Site ID: <span className="font-semibold text-slate-700">{siteId}</span>
                  {siteInfo.address && <span className="ml-2">• {siteInfo.address}</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-emerald-200/60 text-center">
                <p className="text-2xl font-black text-emerald-700">{groups.length}</p>
                <p className="text-xs text-slate-500 font-medium">Groups</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-emerald-200/60 text-center">
                <p className="text-2xl font-black text-teal-700">{devices.length}</p>
                <p className="text-xs text-slate-500 font-medium">Devices</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-emerald-200/60 text-center">
                <p className="text-2xl font-black text-cyan-700">{onlineDevices.length}</p>
                <p className="text-xs text-slate-500 font-medium">Online</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Groups List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Network className="w-5 h-5 text-emerald-600" />
          Groups ({groups.length})
        </h2>

        {groups.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-8 text-center">
            <Network className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No groups found for this site.</p>
          </div>
        ) : (
          groups.map((group) => {
            const isExpanded = expandedGroup === group.id;
            const devicesByType = getDevicesByType(group);
            const matchedSiteDevices = getMatchedSiteDevices(group);
            const groupOnline = matchedSiteDevices.filter((d) => d.power?.now?.online).length;
            const totalDevices = group.devices?.length || 0;

            return (
              <div
                key={group.id}
                className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md">
                          {group.id || 'G'}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{group.name || `Group ${group.id}`}</h3>
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Cpu className="w-3.5 h-3.5" />
                          {totalDevices} device{totalDevices !== 1 ? 's' : ''}
                        </span>
                        {group.usage != null && (
                          <span className="flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5" />
                            {typeof group.usage === 'number' ? `${group.usage.toFixed(2)} kWh` : `${group.usage} kWh`}
                          </span>
                        )}
                        {matchedSiteDevices.length > 0 && (
                          <span className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${groupOnline > 0 ? 'bg-green-500' : 'bg-red-400'}`} />
                            {groupOnline}/{matchedSiteDevices.length} online
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Group Details */}
                {isExpanded && (
                  <div className="border-t border-slate-200/60 p-5 bg-slate-50/30 space-y-5">
                    {/* Devices grouped by type - horizontal scroll */}
                    {devicesByType.length > 0 && devicesByType.map((entry) => (
                      <div key={entry.type}>
                        <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2 capitalize">
                          <Cpu className="w-4 h-4" />
                          {entry.type}
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                            {entry.devices.length}
                          </span>
                        </h4>

                        {/* Horizontal scroll container */}
                        <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin">
                          {entry.devices.map((dev) => {
                            const siteDevice = devices.find((d) => String(d.deviceId) === String(dev.deviceId));
                            const isOnline = siteDevice?.power?.now?.online;
                            const isDevExpanded = expandedDevice === dev.deviceId;
                            const roleColor = ROLE_COLORS[dev.role] || ROLE_COLORS.none;

                            return (
                              <button
                                key={dev.deviceId}
                                onClick={() => toggleDevice(dev.deviceId, group.id)}
                                className={`flex-shrink-0 w-48 rounded-xl border p-4 text-left transition-all duration-200 ${
                                  isDevExpanded
                                    ? 'bg-emerald-50 border-emerald-300 shadow-md ring-2 ring-emerald-200'
                                    : 'bg-white border-slate-200/60 hover:shadow-md hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? 'bg-green-500 animate-pulse' : isOnline === false ? 'bg-red-400' : 'bg-slate-300'}`} />
                                  {dev.role && dev.role !== 'none' && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold capitalize ${roleColor}`}>
                                      {dev.role}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm font-bold text-slate-800 truncate">{dev.name || `Device ${dev.deviceId}`}</p>
                                <p className="text-xs text-slate-400 mt-0.5">ID: {dev.deviceId}</p>
                              </button>
                            );
                          })}
                        </div>

                        {/* Expanded device detail panel */}
                        {entry.devices.some((dev) => expandedDevice === dev.deviceId) && (
                          <div className="mt-3 bg-white rounded-xl border border-emerald-200 p-5 shadow-sm animate-in">
                            {(() => {
                              const dev = entry.devices.find((d) => expandedDevice === d.deviceId);
                              if (!dev) return null;
                              const devData = deviceEnergyData[dev.deviceId];
                              const isLoading = deviceEnergyLoading[dev.deviceId];

                              if (isLoading) {
                                return (
                                  <div className="flex items-center gap-2 text-sm text-slate-500 py-4 justify-center">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Loading device data...
                                  </div>
                                );
                              }

                              if (!devData) {
                                return <p className="text-sm text-slate-400 text-center py-4">No data available for this device.</p>;
                              }

                              const siteDevice = devices.find((d) => String(d.deviceId) === String(dev.deviceId));
                              const isOnline = siteDevice?.power?.now?.online;

                              return (
                                <div>
                                  {/* Device header */}
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white shadow-md">
                                        <Cpu className="w-5 h-5" />
                                      </div>
                                      <div>
                                        <h5 className="text-base font-bold text-slate-900">{devData.name || dev.name}</h5>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                          <span>ID: {dev.deviceId}</span>
                                          <span>•</span>
                                          <span className="capitalize">{dev.deviceType}</span>
                                          {dev.role && dev.role !== 'none' && (
                                            <>
                                              <span>•</span>
                                              <span className="capitalize">{dev.role}</span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setExpandedDevice(null); }}
                                      className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>

                                  {/* Device data grid */}
                                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {/* Status */}
                                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                      <p className="text-xs text-slate-500 font-medium mb-1">Status</p>
                                      <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`} />
                                        <span className={`text-sm font-bold ${isOnline ? 'text-green-700' : 'text-red-600'}`}>
                                          {isOnline ? 'Online' : 'Offline'}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Last Seen */}
                                    {siteDevice?.power?.now?.last_seen && (
                                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                        <p className="text-xs text-slate-500 font-medium mb-1">Last Seen</p>
                                        <p className="text-sm font-bold text-slate-800">
                                          {new Date(siteDevice.power.now.last_seen).toLocaleTimeString()}
                                        </p>
                                      </div>
                                    )}

                                    {/* Group */}
                                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                      <p className="text-xs text-slate-500 font-medium mb-1">Group</p>
                                      <p className="text-sm font-bold text-slate-800 truncate">{devData.groupName || '—'}</p>
                                    </div>

                                    {/* Role */}
                                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                      <p className="text-xs text-slate-500 font-medium mb-1">Role</p>
                                      <p className="text-sm font-bold text-slate-800 capitalize">{dev.role || 'none'}</p>
                                    </div>

                                    {/* Power Now - Import */}
                                    {siteDevice?.power?.now && (
                                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                                        <p className="text-xs text-blue-600 font-medium mb-1 flex items-center gap-1">
                                          <Activity className="w-3 h-3" /> Import Now
                                        </p>
                                        <p className="text-sm font-bold text-blue-800">
                                          {siteDevice.power.now.import_kw != null
                                            ? `${Number(siteDevice.power.now.import_kw).toLocaleString(undefined, { maximumFractionDigits: 2 })} kW`
                                            : '—'}
                                        </p>
                                      </div>
                                    )}

                                    {/* Power Now - Export */}
                                    {siteDevice?.power?.now?.export_kw > 0 && (
                                      <div className="bg-cyan-50 rounded-lg p-3 border border-cyan-100">
                                        <p className="text-xs text-cyan-600 font-medium mb-1 flex items-center gap-1">
                                          <Activity className="w-3 h-3" /> Export Now
                                        </p>
                                        <p className="text-sm font-bold text-cyan-800">
                                          {`${Number(siteDevice.power.now.export_kw).toLocaleString(undefined, { maximumFractionDigits: 2 })} kW`}
                                        </p>
                                      </div>
                                    )}

                                    {/* Today - Import */}
                                    {siteDevice?.power?.day && (
                                      <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
                                        <p className="text-xs text-indigo-600 font-medium mb-1">Today Import</p>
                                        <p className="text-sm font-bold text-indigo-800">
                                          {siteDevice.power.day.import_kwh != null
                                            ? `${Number(siteDevice.power.day.import_kwh).toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh`
                                            : '—'}
                                        </p>
                                      </div>
                                    )}

                                    {/* Today - Export */}
                                    {siteDevice?.power?.day?.export_kwh > 0 && (
                                      <div className="bg-sky-50 rounded-lg p-3 border border-sky-100">
                                        <p className="text-xs text-sky-600 font-medium mb-1">Today Export</p>
                                        <p className="text-sm font-bold text-sky-800">
                                          {`${Number(siteDevice.power.day.export_kwh).toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh`}
                                        </p>
                                      </div>
                                    )}

                                    {/* Month - Import */}
                                    {siteDevice?.power?.month && (
                                      <div className="bg-violet-50 rounded-lg p-3 border border-violet-100">
                                        <p className="text-xs text-violet-600 font-medium mb-1">Month Import</p>
                                        <p className="text-sm font-bold text-violet-800">
                                          {siteDevice.power.month.import_kwh != null
                                            ? `${Number(siteDevice.power.month.import_kwh).toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh`
                                            : '—'}
                                        </p>
                                      </div>
                                    )}

                                    {/* Month - Export */}
                                    {siteDevice?.power?.month?.export_kwh > 0 && (
                                      <div className="bg-fuchsia-50 rounded-lg p-3 border border-fuchsia-100">
                                        <p className="text-xs text-fuchsia-600 font-medium mb-1">Month Export</p>
                                        <p className="text-sm font-bold text-fuchsia-800">
                                          {`${Number(siteDevice.power.month.export_kwh).toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh`}
                                        </p>
                                      </div>
                                    )}

                                    {/* Year - Import */}
                                    {siteDevice?.power?.year && (
                                      <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                                        <p className="text-xs text-amber-600 font-medium mb-1">Year Import</p>
                                        <p className="text-sm font-bold text-amber-800">
                                          {siteDevice.power.year.import_kwh != null
                                            ? `${Number(siteDevice.power.year.import_kwh).toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh`
                                            : '—'}
                                        </p>
                                      </div>
                                    )}

                                    {/* Year - Export */}
                                    {siteDevice?.power?.year?.export_kwh > 0 && (
                                      <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                                        <p className="text-xs text-orange-600 font-medium mb-1">Year Export</p>
                                        <p className="text-sm font-bold text-orange-800">
                                          {`${Number(siteDevice.power.year.export_kwh).toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh`}
                                        </p>
                                      </div>
                                    )}

                                    {/* Lifetime - Import */}
                                    {siteDevice?.power?.lifetime && (
                                      <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                                        <p className="text-xs text-purple-600 font-medium mb-1">Lifetime Import</p>
                                        <p className="text-sm font-bold text-purple-800">
                                          {siteDevice.power.lifetime.import_kwh != null
                                            ? `${Number(siteDevice.power.lifetime.import_kwh).toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh`
                                            : '—'}
                                        </p>
                                      </div>
                                    )}

                                    {/* Lifetime - Export */}
                                    {siteDevice?.power?.lifetime?.export_kwh > 0 && (
                                      <div className="bg-pink-50 rounded-lg p-3 border border-pink-100">
                                        <p className="text-xs text-pink-600 font-medium mb-1">Lifetime Export</p>
                                        <p className="text-sm font-bold text-pink-800">
                                          {`${Number(siteDevice.power.lifetime.export_kwh).toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh`}
                                        </p>
                                      </div>
                                    )}

                                    {/* Group Energy Usage */}
                                    <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                                      <p className="text-xs text-emerald-600 font-medium mb-1">Group Total Energy</p>
                                      <p className="text-sm font-bold text-emerald-800">
                                        {devData.groupUsage?.value != null
                                          ? `${Number(devData.groupUsage.value).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${devData.groupUsage.unit || 'kWh'}`
                                          : '—'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Gantt Chart Data */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Today's Energy Timeline
                      </h4>
                      {ganttLoading[group.id] ? (
                        <div className="flex items-center gap-2 text-sm text-slate-500 py-4">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading timeline data...
                        </div>
                      ) : groupGanttData[group.id] ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {[
                            { key: 'grid', label: 'Grid', color: 'from-blue-500 to-indigo-600', bgColor: 'bg-blue-50 border-blue-200/60' },
                            { key: 'load', label: 'Load', color: 'from-orange-500 to-red-600', bgColor: 'bg-orange-50 border-orange-200/60' },
                            { key: 'battery', label: 'Battery', color: 'from-green-500 to-emerald-600', bgColor: 'bg-green-50 border-green-200/60' },
                            { key: 'meter', label: 'PV/Solar', color: 'from-yellow-500 to-amber-600', bgColor: 'bg-yellow-50 border-yellow-200/60' },
                          ].map(({ key, label, color, bgColor }) => {
                            const seriesData = groupGanttData[group.id];
                            const series = Array.isArray(seriesData)
                              ? seriesData.find((s) => s.key?.toLowerCase() === key)
                              : null;
                            const points = series?.value || [];
                            const total = points.reduce((sum, p) => sum + (p?.value || 0), 0);

                            return (
                              <div key={key} className={`rounded-xl border p-4 ${bgColor}`}>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${color}`} />
                                  <span className="text-sm font-bold text-slate-700">{label}</span>
                                </div>
                                <p className="text-xl font-black text-slate-900">
                                  {total > 0 ? `${total.toFixed(2)} kWh` : '—'}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                  {points.length} data points
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400 py-2">No timeline data available.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
