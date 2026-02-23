import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, Cpu, ChevronDown, Zap, RefreshCw, AlertCircle, Loader2, BarChart3, X, Activity, Clock, Shield, Search } from 'lucide-react';
import { fetchGroupsForSite, fetchSiteDevices } from '../api';
import { fetchGroupGanttChart } from '../api/ganttApi';
import API from '../api/BaseAPI';
import { loadRuntimeConfig } from '../config/RuntimeConfig';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

const expandVariants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: { height: 'auto', opacity: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  exit: { height: 0, opacity: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

const DataTile = ({ label, value, icon: Icon, colorClass, labelColor }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.93 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.35 }}
    whileHover={{ scale: 1.04, y: -2 }}
    className={`rounded-xl p-3.5 border transition-all duration-200 hover:shadow-lg ${colorClass}`}
  >
    <p className={`text-[10px] font-bold mb-1.5 flex items-center gap-1.5 uppercase tracking-widest ${labelColor || 'text-emerald-600'}`}>
      {Icon && <Icon className="w-3 h-3" />} {label}
    </p>
    <div className="text-sm font-bold text-emerald-950">{value}</div>
  </motion.div>
);

export default function GroupManagementPage() {
  const [siteId, setSiteId] = useState('TKKHEAD01');
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
  const [rawGroupData, setRawGroupData] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [groupDeviceSearchQuery, setGroupDeviceSearchQuery] = useState('');

  const loadData = useCallback(async (currentSiteId) => {
    setLoading(true);
    setError(null);
    try {
      const [groupList, deviceList] = await Promise.all([
        fetchGroupsForSite(currentSiteId),
        fetchSiteDevices(currentSiteId),
      ]);

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

      setGroups(groupList);
      setDevices(deviceList);
      setRawGroupData(rawItems);
    } catch (err) {
      console.error('Failed to load group data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData(siteId);
    setIsRefreshing(false);
  };

  useEffect(() => {
    (async () => {
      try {
        const cfg = await loadRuntimeConfig();
        if (cfg?.SITE_ID) setSiteId(cfg.SITE_ID);
      } catch {

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
    setGroupDeviceSearchQuery('');

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

    if (!deviceEnergyData[deviceId]) {
      setDeviceEnergyLoading((prev) => ({ ...prev, [deviceId]: true }));
      try {
        const rawGroup = rawGroupData.find((g) => String(g.groupId) === String(groupId));
        const rawDevice = rawGroup?.devices?.find((d) => String(d.deviceId) === String(deviceId));
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

  const ROLE_COLORS = {
    load: 'bg-orange-100 text-orange-700 border-orange-300',
    solar: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    grid: 'bg-blue-100 text-blue-700 border-blue-300',
    none: 'bg-teal-50 text-teal-600 border-teal-200',
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-10 flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center gap-5"
        >
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-100 via-teal-100 to-cyan-100 flex items-center justify-center shadow-lg shadow-emerald-200/30">
              <Loader2 className="w-9 h-9 text-emerald-600 animate-spin" />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-emerald-400/15 animate-ping" />
          </div>
          <div className="text-center">
            <p className="text-emerald-800 font-bold text-base">Loading data...</p>
            <p className="text-teal-600 text-sm mt-1">Fetching group information</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 border border-red-200/60 rounded-3xl p-10 text-center shadow-lg shadow-red-100/30"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-100 to-rose-100 flex items-center justify-center mx-auto mb-5 shadow-md">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-red-800 font-bold text-xl mb-2">Something went wrong</p>
          <p className="text-rose-600 text-sm mb-7 max-w-sm mx-auto">{error}</p>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => loadData(siteId)}
            className="px-7 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-bold shadow-lg shadow-red-300/40 hover:shadow-xl hover:shadow-red-300/50 transition-all"
          >
            Try Again
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 lg:p-10 min-h-screen">
      {}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="flex items-center justify-between mb-6 sm:mb-10 gap-3"
      >
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <motion.div
            whileHover={{ rotate: 8, scale: 1.08 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="p-2.5 sm:p-4 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 rounded-xl sm:rounded-2xl text-white shadow-xl shadow-emerald-300/40 flex-shrink-0"
          >
            <Network className="w-5 h-5 sm:w-7 sm:h-7" />
          </motion.div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-emerald-950 tracking-tight truncate">
              Group Management
            </h1>
            <p className="text-xs sm:text-sm text-teal-600 font-semibold mt-0.5">Manage your energy groups and devices</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.12, rotate: 90 }}
          whileTap={{ scale: 0.88 }}
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-3 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all text-emerald-500 hover:text-emerald-700 disabled:opacity-50 shadow-sm hover:shadow-md"
          title="Refresh"
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </motion.button>
      </motion.div>

      {}
      <motion.div initial="hidden" animate="visible" custom={2} variants={fadeIn}>
        <h2 className="text-lg font-extrabold text-emerald-950 flex items-center gap-2.5 mb-6">
          <div className="p-2 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl shadow-sm">
            <Network className="w-4.5 h-4.5 text-emerald-600" />
          </div>
          Groups
          <span className="text-sm font-bold text-emerald-500 bg-emerald-50 px-2.5 py-0.5 rounded-full">
            {groups.length}
          </span>
        </h2>

        {}
        <div className="relative mb-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
          <input
            type="text"
            placeholder="Search groups by name or ID..."
            value={groupSearchQuery}
            onChange={(e) => setGroupSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-emerald-200/60 rounded-xl text-sm text-emerald-900 placeholder-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 transition-all shadow-sm"
          />
        </div>

        {(() => {
          const filteredGroups = groups.filter((g) => {
            if (!groupSearchQuery) return true;
            const q = groupSearchQuery.toLowerCase();
            return (g.name || '').toLowerCase().includes(q) || String(g.id || '').toLowerCase().includes(q);
          });

          if (groups.length === 0) return (
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              className="bg-white/80 backdrop-blur-sm rounded-3xl border border-emerald-100 p-12 text-center shadow-sm"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center mx-auto mb-5 shadow-md">
                <Network className="w-8 h-8 text-emerald-300" />
              </div>
              <p className="text-emerald-700 font-semibold text-base">No groups found for this site</p>
              <p className="text-teal-500 text-sm mt-1">Groups will appear here once configured</p>
            </motion.div>
          );

          if (filteredGroups.length === 0) return (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-emerald-100 p-8 text-center shadow-sm">
              <Search className="w-6 h-6 text-emerald-200 mx-auto mb-2" />
              <p className="text-sm text-teal-600 font-medium">No groups match "{groupSearchQuery}"</p>
            </div>
          );

          return (
          <div className="space-y-5">
            {filteredGroups.map((group, groupIndex) => {
              const isExpanded = expandedGroup === group.id;
              const devicesByType = getDevicesByType(group);
              const matchedSiteDevices = getMatchedSiteDevices(group);
              const groupOnline = matchedSiteDevices.filter((d) => d.power?.now?.online).length;
              const totalDevices = group.devices?.length || 0;

              return (
                <motion.div
                  key={group.id}
                  initial="hidden"
                  animate="visible"
                  custom={groupIndex + 3}
                  variants={fadeIn}
                  layout
                  className={`bg-white/90 backdrop-blur-sm rounded-3xl border overflow-hidden transition-all duration-400 ${
                    isExpanded
                      ? 'border-emerald-300/60 shadow-xl shadow-emerald-100/40 ring-1 ring-emerald-200/30'
                      : 'border-emerald-100/60 hover:shadow-lg hover:border-emerald-200/60 shadow-sm'
                  }`}
                >
                  <div className={`h-0.5 transition-all duration-300 ${isExpanded ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400' : 'bg-transparent'}`} />

                  {}
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center justify-between p-6 text-left hover:bg-emerald-50/30 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <motion.div
                        animate={isExpanded ? { scale: 1.08 } : { scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg transition-all duration-300 ${
                          isExpanded
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-300/40'
                            : 'bg-gradient-to-br from-emerald-400 to-teal-500 group-hover:from-emerald-500 group-hover:to-teal-600 shadow-emerald-200/30'
                        }`}
                      >
                        {group.id || 'G'}
                      </motion.div>
                      <div>
                        <h3 className="text-base font-bold text-emerald-950">{group.name || `Group ${group.id}`}</h3>
                        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm mt-1 flex-wrap">
                          <span className="flex items-center gap-1.5 text-teal-600 font-medium">
                            <Cpu className="w-3.5 h-3.5" />
                            {totalDevices} device{totalDevices !== 1 ? 's' : ''}
                          </span>
                          {group.usage != null && (
                            <span className="flex items-center gap-1.5 text-amber-600 font-semibold">
                              <Zap className="w-3.5 h-3.5" />
                              {typeof group.usage === 'number' ? `${group.usage.toFixed(2)} kWh` : `${group.usage} kWh`}
                            </span>
                          )}
                          {matchedSiteDevices.length > 0 && (
                            <span className="flex items-center gap-1.5 font-medium">
                              <span className="relative flex h-2.5 w-2.5">
                                {groupOnline > 0 && (
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                )}
                                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${groupOnline > 0 ? 'bg-green-500' : 'bg-red-400'}`} />
                              </span>
                              <span className={groupOnline > 0 ? 'text-green-700' : 'text-red-600'}>
                                {groupOnline}/{matchedSiteDevices.length} online
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className={`p-2 rounded-lg transition-colors ${isExpanded ? 'bg-emerald-100' : 'bg-emerald-50 group-hover:bg-emerald-100'}`}
                    >
                      <ChevronDown className={`w-5 h-5 transition-colors ${isExpanded ? 'text-emerald-600' : 'text-emerald-400 group-hover:text-emerald-600'}`} />
                    </motion.div>
                  </button>

                  {}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        variants={expandVariants}
                        initial="collapsed"
                        animate="expanded"
                        exit="exit"
                        className="overflow-hidden"
                      >
                        <div className="border-t border-emerald-100 p-3 sm:p-6 bg-gradient-to-b from-emerald-50/40 via-white/60 to-white/40 space-y-5 sm:space-y-7">
                          {}
                          <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                            <input
                              type="text"
                              placeholder="Search devices in this group..."
                              value={groupDeviceSearchQuery}
                              onChange={(e) => setGroupDeviceSearchQuery(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full pl-11 pr-4 py-2.5 bg-white/80 backdrop-blur-sm border border-emerald-200/60 rounded-xl text-sm text-emerald-900 placeholder-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 transition-all shadow-sm"
                            />
                          </div>

                          {}
                          {devicesByType.length > 0 && devicesByType.map((entry, typeIdx) => {
                            const filteredEntryDevices = entry.devices.filter((dev) => {
                              if (!groupDeviceSearchQuery) return true;
                              const q = groupDeviceSearchQuery.toLowerCase();
                              return (dev.name || '').toLowerCase().includes(q) || String(dev.deviceId || '').toLowerCase().includes(q);
                            });
                            if (filteredEntryDevices.length === 0) return null;
                            return (
                            <motion.div
                              key={entry.type}
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: typeIdx * 0.1, duration: 0.35 }}
                            >
                              <h4 className="text-sm font-bold text-emerald-800 mb-4 flex items-center gap-2.5 capitalize">
                                <div className="p-1.5 bg-emerald-100 rounded-lg">
                                  <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                                </div>
                                {entry.type}
                                <span className="text-[11px] bg-teal-100 text-teal-700 px-2.5 py-0.5 rounded-full font-bold">
                                  {filteredEntryDevices.length}
                                </span>
                              </h4>

                              <div className="grid grid-cols-2 sm:flex sm:gap-3 sm:overflow-x-auto gap-2 pb-3 scrollbar-thin">
                                {filteredEntryDevices.map((dev, devIdx) => {
                                  const siteDevice = devices.find((d) => String(d.deviceId) === String(dev.deviceId));
                                  const isOnline = siteDevice?.power?.now?.online;
                                  const isDevExpanded = expandedDevice === dev.deviceId;
                                  const roleColor = ROLE_COLORS[dev.role] || ROLE_COLORS.none;

                                  return (
                                    <motion.button
                                      key={dev.deviceId}
                                      initial={{ opacity: 0, x: 24 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: devIdx * 0.05, duration: 0.35 }}
                                      whileHover={{ y: -4, scale: 1.03 }}
                                      whileTap={{ scale: 0.97 }}
                                      onClick={() => toggleDevice(dev.deviceId, group.id)}
                                      className={`sm:flex-shrink-0 sm:w-52 rounded-xl sm:rounded-2xl border p-3 sm:p-4 text-left transition-all duration-200 ${
                                        isDevExpanded
                                          ? 'bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-emerald-300 shadow-xl shadow-emerald-100/50 ring-2 ring-emerald-200/60'
                                          : 'bg-white border-emerald-100 hover:shadow-xl hover:border-emerald-200 shadow-sm'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between mb-3">
                                        <span className="relative flex h-3 w-3">
                                          {isOnline && (
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                          )}
                                          <span className={`relative inline-flex rounded-full h-3 w-3 ${isOnline ? 'bg-green-500' : isOnline === false ? 'bg-red-400' : 'bg-emerald-200'}`} />
                                        </span>
                                        {dev.role && dev.role !== 'none' && (
                                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold capitalize ${roleColor}`}>
                                            {dev.role}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-sm font-bold text-emerald-900 truncate">{dev.name || `Device ${dev.deviceId}`}</p>
                                      <p className="text-[11px] text-teal-500 mt-1 font-mono font-semibold">ID: {dev.deviceId}</p>
                                    </motion.button>
                                  );
                                })}
                              </div>

                              {}
                              <AnimatePresence>
                                {filteredEntryDevices.some((dev) => expandedDevice === dev.deviceId) && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -10, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                                    exit={{ opacity: 0, y: -10, height: 0 }}
                                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                    className="overflow-hidden"
                                  >
                                    <div className="mt-4 bg-white rounded-2xl border border-emerald-200/50 p-6 shadow-lg shadow-emerald-50/50">
                                      {(() => {
                                        const dev = filteredEntryDevices.find((d) => expandedDevice === d.deviceId);
                                        if (!dev) return null;
                                        const devData = deviceEnergyData[dev.deviceId];
                                        const isLoading = deviceEnergyLoading[dev.deviceId];

                                        if (isLoading) {
                                          return (
                                            <div className="flex items-center gap-3 text-sm text-emerald-700 py-8 justify-center">
                                              <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                                              <span className="font-medium">Loading device data...</span>
                                            </div>
                                          );
                                        }

                                        if (!devData) {
                                          return (
                                            <div className="text-center py-8">
                                              <Cpu className="w-8 h-8 text-emerald-200 mx-auto mb-3" />
                                              <p className="text-sm text-teal-600 font-medium">No data available for this device</p>
                                            </div>
                                          );
                                        }

                                        const siteDevice = devices.find((d) => String(d.deviceId) === String(dev.deviceId));
                                        const isOnline = siteDevice?.power?.now?.online;

                                        return (
                                          <div>
                                            <div className="flex items-center justify-between mb-6">
                                              <div className="flex items-center gap-4">
                                                <motion.div
                                                  whileHover={{ rotate: 10, scale: 1.05 }}
                                                  className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-emerald-300/30"
                                                >
                                                  <Cpu className="w-5.5 h-5.5" />
                                                </motion.div>
                                                <div>
                                                  <h5 className="text-base font-bold text-emerald-950">{devData.name || dev.name}</h5>
                                                  <div className="flex items-center gap-2 text-xs mt-1 flex-wrap">
                                                    <span className="font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md text-[11px] font-bold border border-emerald-100">
                                                      {dev.deviceId}
                                                    </span>
                                                    <span className="text-emerald-300 font-bold">|</span>
                                                    <span className="capitalize text-teal-600 font-semibold">{dev.deviceType}</span>
                                                    {dev.role && dev.role !== 'none' && (
                                                      <>
                                                        <span className="text-emerald-300 font-bold">|</span>
                                                        <span className="capitalize text-teal-600 font-semibold">{dev.role}</span>
                                                      </>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                              <motion.button
                                                whileHover={{ scale: 1.2, rotate: 90 }}
                                                whileTap={{ scale: 0.85 }}
                                                onClick={(e) => { e.stopPropagation(); setExpandedDevice(null); }}
                                                className="p-2.5 bg-red-50 hover:bg-red-100 rounded-xl transition-all text-red-400 hover:text-red-600 shadow-sm"
                                              >
                                                <X className="w-4 h-4" />
                                              </motion.button>
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                              <DataTile
                                                label="Status"
                                                value={
                                                  <div className="flex items-center gap-2">
                                                    <span className="relative flex h-2.5 w-2.5">
                                                      {isOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />}
                                                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isOnline ? 'bg-green-500' : 'bg-red-400'}`} />
                                                    </span>
                                                    <span className={`text-sm font-bold ${isOnline ? 'text-green-700' : 'text-red-600'}`}>
                                                      {isOnline ? 'Online' : 'Offline'}
                                                    </span>
                                                  </div>
                                                }
                                                colorClass={`${isOnline ? 'bg-green-50/80 border-green-100' : 'bg-red-50/80 border-red-100'}`}
                                                labelColor={isOnline ? 'text-green-600' : 'text-red-500'}
                                              />

                                              {siteDevice?.power?.now?.last_seen && (
                                                <DataTile
                                                  label="Last Seen"
                                                  icon={Clock}
                                                  value={new Date(siteDevice.power.now.last_seen).toLocaleTimeString()}
                                                  colorClass="bg-emerald-50/80 border-emerald-100"
                                                  labelColor="text-emerald-600"
                                                />
                                              )}

                                              <DataTile
                                                label="Group"
                                                icon={Network}
                                                value={devData.groupName || '\u2014'}
                                                colorClass="bg-teal-50/80 border-teal-100"
                                                labelColor="text-teal-600"
                                              />

                                              <DataTile
                                                label="Role"
                                                icon={Shield}
                                                value={<span className="capitalize">{dev.role || 'none'}</span>}
                                                colorClass="bg-cyan-50/80 border-cyan-100"
                                                labelColor="text-cyan-600"
                                              />

                                              {siteDevice?.power?.now && (
                                                <DataTile
                                                  label="Import Now"
                                                  icon={Activity}
                                                  value={siteDevice.power.now.import_kw != null
                                                    ? `${Number(siteDevice.power.now.import_kw).toLocaleString(undefined, { maximumFractionDigits: 2 })} kW`
                                                    : '\u2014'}
                                                  colorClass="bg-blue-50/80 border-blue-100"
                                                  labelColor="text-blue-600"
                                                />
                                              )}

                                              {siteDevice?.power?.now?.export_kw > 0 && (
                                                <DataTile
                                                  label="Export Now"
                                                  icon={Activity}
                                                  value={`${Number(siteDevice.power.now.export_kw).toLocaleString(undefined, { maximumFractionDigits: 2 })} kW`}
                                                  colorClass="bg-cyan-50/80 border-cyan-100"
                                                  labelColor="text-cyan-600"
                                                />
                                              )}

                                              {siteDevice?.power?.day && (
                                                <DataTile
                                                  label="Today Import"
                                                  value={siteDevice.power.day.import_kwh != null
                                                    ? `${Number(siteDevice.power.day.import_kwh).toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh`
                                                    : '\u2014'}
                                                  colorClass="bg-indigo-50/80 border-indigo-100"
                                                  labelColor="text-indigo-600"
                                                />
                                              )}

                                              {siteDevice?.power?.day?.export_kwh > 0 && (
                                                <DataTile
                                                  label="Today Export"
                                                  value={`${Number(siteDevice.power.day.export_kwh).toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh`}
                                                  colorClass="bg-sky-50/80 border-sky-100"
                                                  labelColor="text-sky-600"
                                                />
                                              )}

                                              {siteDevice?.power?.month && (
                                                <DataTile
                                                  label="Month Import"
                                                  value={siteDevice.power.month.import_kwh != null
                                                    ? `${Number(siteDevice.power.month.import_kwh).toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh`
                                                    : '\u2014'}
                                                  colorClass="bg-violet-50/80 border-violet-100"
                                                  labelColor="text-violet-600"
                                                />
                                              )}

                                              {siteDevice?.power?.month?.export_kwh > 0 && (
                                                <DataTile
                                                  label="Month Export"
                                                  value={`${Number(siteDevice.power.month.export_kwh).toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh`}
                                                  colorClass="bg-fuchsia-50/80 border-fuchsia-100"
                                                  labelColor="text-fuchsia-600"
                                                />
                                              )}

                                              {siteDevice?.power?.year && (
                                                <DataTile
                                                  label="Year Import"
                                                  value={siteDevice.power.year.import_kwh != null
                                                    ? `${Number(siteDevice.power.year.import_kwh).toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh`
                                                    : '\u2014'}
                                                  colorClass="bg-amber-50/80 border-amber-100"
                                                  labelColor="text-amber-600"
                                                />
                                              )}

                                              {siteDevice?.power?.year?.export_kwh > 0 && (
                                                <DataTile
                                                  label="Year Export"
                                                  value={`${Number(siteDevice.power.year.export_kwh).toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh`}
                                                  colorClass="bg-orange-50/80 border-orange-100"
                                                  labelColor="text-orange-600"
                                                />
                                              )}

                                              {siteDevice?.power?.lifetime && (
                                                <DataTile
                                                  label="Lifetime Import"
                                                  value={siteDevice.power.lifetime.import_kwh != null
                                                    ? `${Number(siteDevice.power.lifetime.import_kwh).toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh`
                                                    : '\u2014'}
                                                  colorClass="bg-purple-50/80 border-purple-100"
                                                  labelColor="text-purple-600"
                                                />
                                              )}

                                              {siteDevice?.power?.lifetime?.export_kwh > 0 && (
                                                <DataTile
                                                  label="Lifetime Export"
                                                  value={`${Number(siteDevice.power.lifetime.export_kwh).toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh`}
                                                  colorClass="bg-pink-50/80 border-pink-100"
                                                  labelColor="text-pink-600"
                                                />
                                              )}

                                              <DataTile
                                                label="Group Total Energy"
                                                icon={Zap}
                                                value={devData.groupUsage?.value != null
                                                  ? `${Number(devData.groupUsage.value).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${devData.groupUsage.unit || 'kWh'}`
                                                  : '\u2014'}
                                                colorClass="bg-emerald-50/80 border-emerald-100"
                                                labelColor="text-emerald-600"
                                              />
                                            </div>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                            );
                          })}

                          {}
                          <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15, duration: 0.35 }}
                          >
                            <h4 className="text-sm font-bold text-emerald-800 mb-4 flex items-center gap-2.5">
                              <div className="p-1.5 bg-emerald-100 rounded-lg">
                                <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                              </div>
                              Today's Energy Timeline
                            </h4>
                            {ganttLoading[group.id] ? (
                              <div className="flex items-center gap-3 text-sm text-emerald-700 py-8 justify-center">
                                <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                                <span className="font-medium">Loading timeline data...</span>
                              </div>
                            ) : groupGanttData[group.id] ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {[
                                  { key: 'grid', label: 'Grid', color: 'from-blue-500 to-indigo-600', bgColor: 'bg-blue-50/80 border-blue-200/50', textColor: 'text-blue-800', labelColor: 'text-blue-600' },
                                  { key: 'load', label: 'Load', color: 'from-orange-500 to-red-600', bgColor: 'bg-orange-50/80 border-orange-200/50', textColor: 'text-orange-800', labelColor: 'text-orange-600' },
                                  { key: 'battery', label: 'Battery', color: 'from-green-500 to-emerald-600', bgColor: 'bg-green-50/80 border-green-200/50', textColor: 'text-green-800', labelColor: 'text-green-600' },
                                  { key: 'meter', label: 'PV/Solar', color: 'from-yellow-500 to-amber-600', bgColor: 'bg-yellow-50/80 border-yellow-200/50', textColor: 'text-yellow-800', labelColor: 'text-yellow-600' },
                                ].map(({ key, label, color, bgColor, textColor, labelColor }, idx) => {
                                  const seriesData = groupGanttData[group.id];
                                  const series = Array.isArray(seriesData)
                                    ? seriesData.find((s) => s.key?.toLowerCase() === key)
                                    : null;
                                  const points = series?.value || [];
                                  const total = points.reduce((sum, p) => sum + (p?.value || 0), 0);

                                  return (
                                    <motion.div
                                      key={key}
                                      initial={{ opacity: 0, y: 12 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: idx * 0.07, duration: 0.35 }}
                                      whileHover={{ y: -3, scale: 1.03 }}
                                      className={`rounded-2xl border p-5 transition-all hover:shadow-lg ${bgColor}`}
                                    >
                                      <div className="flex items-center gap-2.5 mb-3">
                                        <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${color} shadow-sm`} />
                                        <span className={`text-sm font-bold ${labelColor}`}>{label}</span>
                                      </div>
                                      <p className={`text-2xl font-black ${textColor}`}>
                                        {total > 0 ? `${total.toFixed(2)} kWh` : '\u2014'}
                                      </p>
                                      <p className={`text-[11px] ${labelColor} mt-2 font-semibold`}>
                                        {points.length} data points
                                      </p>
                                    </motion.div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-center py-6">
                                <BarChart3 className="w-8 h-8 text-emerald-200 mx-auto mb-2" />
                                <p className="text-sm text-teal-600 font-medium">No timeline data available</p>
                              </div>
                            )}
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
          );
        })()}
      </motion.div>
    </div>
  );
}
