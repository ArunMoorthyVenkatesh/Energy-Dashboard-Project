import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Cpu, Network, RefreshCw, AlertCircle, Loader2, Activity, Clock, Shield, X, Search } from 'lucide-react';
import { fetchSiteMetadata, fetchSiteDevices, fetchGroupsForSite } from '../api';
import { loadRuntimeConfig } from '../config/RuntimeConfig';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

const StatCard = ({ value, label, color, icon: Icon }) => (
  <motion.div
    whileHover={{ scale: 1.06, y: -3 }}
    transition={{ type: 'spring', stiffness: 400, damping: 18 }}
    className="bg-white/80 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-white/50 text-center shadow-sm hover:shadow-lg transition-all"
  >
    {Icon && <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />}
    <p className={`text-2xl font-black ${color}`}>{value}</p>
    <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-widest mt-0.5">{label}</p>
  </motion.div>
);

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

export default function SiteManagementPage() {
  const navigate = useNavigate();
  const [siteId, setSiteId] = useState('TKKHEAD01');
  const [siteInfo, setSiteInfo] = useState(null);
  const [devices, setDevices] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedDevice, setExpandedDevice] = useState(null);
  const [deviceSearchQuery, setDeviceSearchQuery] = useState('');

  const loadData = useCallback(async (currentSiteId) => {
    setLoading(true);
    setError(null);
    try {
      const [siteMeta, deviceList, groupList] = await Promise.all([
        fetchSiteMetadata(currentSiteId),
        fetchSiteDevices(currentSiteId),
        fetchGroupsForSite(currentSiteId),
      ]);
      setSiteInfo(siteMeta);
      setDevices(deviceList);
      setGroups(groupList);
    } catch (err) {
      console.error('Failed to load site data:', err);
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
        // use default siteId
      }
    })();
  }, []);

  useEffect(() => {
    if (siteId) loadData(siteId);
  }, [siteId, loadData]);
  

  const onlineDevices = devices.filter((d) => d.power?.now?.online);

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
            <p className="text-teal-600 text-sm mt-1">Fetching site information</p>
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
    <div className="p-6 lg:p-10 min-h-screen">
      {/* Header */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="flex items-center justify-between mb-10"
      >
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ rotate: 8, scale: 1.08 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="p-4 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 rounded-2xl text-white shadow-xl shadow-emerald-300/40"
          >
            <MapPin className="w-7 h-7" />
          </motion.div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-emerald-950 tracking-tight">
              Site Management
            </h1>
            <p className="text-sm text-teal-600 font-semibold mt-0.5">Manage your site and monitor devices</p>
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

      {/* Site Info Card */}
      {siteInfo && (
        <motion.div
          initial="hidden"
          animate="visible"
          custom={1}
          variants={fadeIn}
          className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-3xl shadow-md shadow-emerald-100/40 border border-emerald-200/30 p-7 lg:p-9 mb-10"
        >
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-gradient-to-br from-emerald-200/25 to-teal-200/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-gradient-to-br from-cyan-200/20 to-teal-200/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-t-3xl" />

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.1, rotate: -6 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 shadow-xl shadow-emerald-300/30"
              >
                <MapPin className="w-7 h-7 text-white" />
              </motion.div>
              <div>
                <h2 className="text-xl font-extrabold text-emerald-950 tracking-tight">
                  {siteInfo.name || 'Unknown Site'}
                </h2>
                <p className="text-sm text-teal-700 mt-1 flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-emerald-800 bg-white/70 backdrop-blur-sm px-2 py-0.5 rounded-md border border-emerald-200/50 text-xs">
                    {siteId}
                  </span>
                  {siteInfo.address && (
                    <span className="text-teal-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {siteInfo.address}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatCard value={groups.length} label="Groups" color="text-emerald-600" icon={Network} />
              <StatCard value={devices.length} label="Devices" color="text-teal-600" icon={Cpu} />
              <StatCard value={onlineDevices.length} label="Online" color="text-cyan-600" icon={Activity} />
            </div>
          </div>
        </motion.div>
      )}

      {/* Groups Overview */}
      <motion.div initial="hidden" animate="visible" custom={2} variants={fadeIn} className="mb-10">
        <h2 className="text-lg font-extrabold text-emerald-950 flex items-center gap-2.5 mb-5">
          <div className="p-2 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl shadow-sm">
            <Network className="w-4.5 h-4.5 text-emerald-600" />
          </div>
          Groups
          <span className="text-sm font-bold text-emerald-500 bg-emerald-50 px-2.5 py-0.5 rounded-full">
            {groups.length}
          </span>
        </h2>
        {groups.length > 0 ? (
          <div className="space-y-3">
            {groups.map((group, idx) => {
              const totalDevices = group.devices?.length || 0;
              return (
                <motion.button
                  key={group.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.35 }}
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() =>
                    navigate('/groups', {
                      state: { groupId: group.id },
                    })
                  }
                                    className="w-full rounded-2xl border p-5 text-left bg-white border-emerald-100 hover:shadow-lg hover:border-emerald-200 shadow-sm transition-all duration-200 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                      {group.id || 'G'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-900">{group.name || `Group ${group.id}`}</p>
                      <p className="text-[11px] text-teal-500 mt-0.5 font-semibold">
                        {totalDevices} device{totalDevices !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-teal-500 font-medium">No groups configured</p>
        )}
      </motion.div>

      {/* All Devices List */}
      <motion.div initial="hidden" animate="visible" custom={3} variants={fadeIn}>
        <h2 className="text-lg font-extrabold text-emerald-950 flex items-center gap-2.5 mb-5">
          <div className="p-2 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl shadow-sm">
            <Cpu className="w-4.5 h-4.5 text-emerald-600" />
          </div>
          Devices
          <span className="text-sm font-bold text-emerald-500 bg-emerald-50 px-2.5 py-0.5 rounded-full">
            {devices.length}
          </span>
        </h2>

        {/* Device Search */}
        <div className="relative mb-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
          <input
            type="text"
            placeholder="Search devices by name or ID..."
            value={deviceSearchQuery}
            onChange={(e) => setDeviceSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-emerald-200/60 rounded-xl text-sm text-emerald-900 placeholder-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 transition-all shadow-sm"
          />
        </div>

        {(() => {
          const filteredDevices = devices.filter((dev) => {
            if (!deviceSearchQuery) return true;
            const q = deviceSearchQuery.toLowerCase();
            return (dev.name || '').toLowerCase().includes(q) || String(dev.deviceId || dev.id || '').toLowerCase().includes(q);
          });

          return filteredDevices.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-emerald-100 p-8 text-center shadow-sm">
            {deviceSearchQuery ? (
              <>
                <Search className="w-6 h-6 text-emerald-200 mx-auto mb-2" />
                <p className="text-sm text-teal-600 font-medium">No devices match "{deviceSearchQuery}"</p>
              </>
            ) : (
              <>
                <Cpu className="w-8 h-8 text-emerald-300 mx-auto mb-3" />
                <p className="text-emerald-700 font-semibold text-base">No devices found for this site</p>
                <p className="text-teal-500 text-sm mt-1">Devices will appear here once configured</p>
              </>
            )}
          </div>
        ) : (
          <div className="flex gap-3 flex-wrap">
            {filteredDevices.map((dev, devIdx) => {
              const isOnline = dev.power?.now?.online;
              const isDevExpanded = expandedDevice === (dev.deviceId || dev.id);
              const role = dev.role || 'none';
              const roleColor = ROLE_COLORS[role] || ROLE_COLORS.none;

              return (
                <motion.button
                  key={dev.deviceId || dev.id}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: devIdx * 0.05, duration: 0.35 }}
                  whileHover={{ y: -4, scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setExpandedDevice(isDevExpanded ? null : (dev.deviceId || dev.id))}
                  className={`flex-shrink-0 w-52 rounded-2xl border p-4 text-left transition-all duration-200 ${
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
                    {role !== 'none' && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold capitalize ${roleColor}`}>
                        {role}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-emerald-900 truncate">{dev.name || `Device ${dev.deviceId || dev.id}`}</p>
                  <p className="text-[11px] text-teal-500 mt-1 font-mono font-semibold">ID: {dev.deviceId || dev.id}</p>
                </motion.button>
              );
            })}
          </div>
        );
        })()}

        {/* Expanded device detail */}
        {expandedDevice && (() => {
          const dev = devices.find((d) => String(d.deviceId || d.id) === String(expandedDevice));
          if (!dev) return null;
          const isOnline = dev.power?.now?.online;

          return (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="mt-5 bg-white rounded-2xl border border-emerald-200/50 p-6 shadow-lg shadow-emerald-50/50"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <motion.div
                    whileHover={{ rotate: 10, scale: 1.05 }}
                    className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-emerald-300/30"
                  >
                    <Cpu className="w-5.5 h-5.5" />
                  </motion.div>
                  <div>
                    <h5 className="text-base font-bold text-emerald-950">{dev.name || `Device ${dev.deviceId || dev.id}`}</h5>
                    <div className="flex items-center gap-2 text-xs mt-1 flex-wrap">
                      <span className="font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md text-[11px] font-bold border border-emerald-100">
                        {dev.deviceId || dev.id}
                      </span>
                      {dev.deviceType && (
                        <>
                          <span className="text-emerald-300 font-bold">|</span>
                          <span className="capitalize text-teal-600 font-semibold">{dev.deviceType}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.2, rotate: 90 }}
                  whileTap={{ scale: 0.85 }}
                  onClick={() => setExpandedDevice(null)}
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

                {dev.power?.now?.last_seen && (
                  <DataTile
                    label="Last Seen"
                    icon={Clock}
                    value={new Date(dev.power.now.last_seen).toLocaleTimeString()}
                    colorClass="bg-emerald-50/80 border-emerald-100"
                    labelColor="text-emerald-600"
                  />
                )}

                <DataTile
                  label="Role"
                  icon={Shield}
                  value={<span className="capitalize">{dev.role || 'none'}</span>}
                  colorClass="bg-cyan-50/80 border-cyan-100"
                  labelColor="text-cyan-600"
                />

                {dev.power?.now && (
                  <DataTile
                    label="Import Now"
                    icon={Activity}
                    value={dev.power.now.import_kw != null
                      ? `${Number(dev.power.now.import_kw).toLocaleString(undefined, { maximumFractionDigits: 2 })} kW`
                      : '\u2014'}
                    colorClass="bg-blue-50/80 border-blue-100"
                    labelColor="text-blue-600"
                  />
                )}

                {dev.power?.now?.export_kw > 0 && (
                  <DataTile
                    label="Export Now"
                    icon={Activity}
                    value={`${Number(dev.power.now.export_kw).toLocaleString(undefined, { maximumFractionDigits: 2 })} kW`}
                    colorClass="bg-cyan-50/80 border-cyan-100"
                    labelColor="text-cyan-600"
                  />
                )}

                {dev.power?.day && (
                  <DataTile
                    label="Today Import"
                    value={dev.power.day.import_kwh != null
                      ? `${Number(dev.power.day.import_kwh).toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh`
                      : '\u2014'}
                    colorClass="bg-indigo-50/80 border-indigo-100"
                    labelColor="text-indigo-600"
                  />
                )}

                {dev.power?.day?.export_kwh > 0 && (
                  <DataTile
                    label="Today Export"
                    value={`${Number(dev.power.day.export_kwh).toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh`}
                    colorClass="bg-sky-50/80 border-sky-100"
                    labelColor="text-sky-600"
                  />
                )}

                {dev.power?.month && (
                  <DataTile
                    label="Month Import"
                    value={dev.power.month.import_kwh != null
                      ? `${Number(dev.power.month.import_kwh).toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh`
                      : '\u2014'}
                    colorClass="bg-violet-50/80 border-violet-100"
                    labelColor="text-violet-600"
                  />
                )}

                {dev.power?.month?.export_kwh > 0 && (
                  <DataTile
                    label="Month Export"
                    value={`${Number(dev.power.month.export_kwh).toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh`}
                    colorClass="bg-fuchsia-50/80 border-fuchsia-100"
                    labelColor="text-fuchsia-600"
                  />
                )}

                {dev.power?.year && (
                  <DataTile
                    label="Year Import"
                    value={dev.power.year.import_kwh != null
                      ? `${Number(dev.power.year.import_kwh).toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh`
                      : '\u2014'}
                    colorClass="bg-amber-50/80 border-amber-100"
                    labelColor="text-amber-600"
                  />
                )}

                {dev.power?.year?.export_kwh > 0 && (
                  <DataTile
                    label="Year Export"
                    value={`${Number(dev.power.year.export_kwh).toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh`}
                    colorClass="bg-orange-50/80 border-orange-100"
                    labelColor="text-orange-600"
                  />
                )}

                {dev.power?.lifetime && (
                  <DataTile
                    label="Lifetime Import"
                    value={dev.power.lifetime.import_kwh != null
                      ? `${Number(dev.power.lifetime.import_kwh).toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh`
                      : '\u2014'}
                    colorClass="bg-purple-50/80 border-purple-100"
                    labelColor="text-purple-600"
                  />
                )}

                {dev.power?.lifetime?.export_kwh > 0 && (
                  <DataTile
                    label="Lifetime Export"
                    value={`${Number(dev.power.lifetime.export_kwh).toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh`}
                    colorClass="bg-pink-50/80 border-pink-100"
                    labelColor="text-pink-600"
                  />
                )}
              </div>
            </motion.div>
          );
        })()}
      </motion.div>
    </div>
  );
}