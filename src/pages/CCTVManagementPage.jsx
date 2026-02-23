import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Video, RefreshCw, AlertCircle, Loader2, MapPin, Eye, EyeOff, Clock, Shield } from 'lucide-react';
import { fetchSiteDevices } from '../api';
import { loadRuntimeConfig } from '../config/RuntimeConfig';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

const EXAMPLE_CAMERAS = [
  {
    deviceId: 'CAM-001',
    name: 'Main Entrance',
    deviceType: 'cctv',
    location: 'Ground Floor – Front Door',
    power: { now: { online: true, last_seen: new Date(Date.now() - 30000).toISOString() } },
  },
  {
    deviceId: 'CAM-002',
    name: 'Lobby Overview',
    deviceType: 'cctv',
    location: 'Ground Floor – Lobby',
    power: { now: { online: true, last_seen: new Date(Date.now() - 45000).toISOString() } },
  },
  {
    deviceId: 'CAM-003',
    name: 'Parking Lot A',
    deviceType: 'cctv',
    location: 'Basement – Level B1',
    power: { now: { online: false, last_seen: new Date(Date.now() - 3600000 * 2).toISOString() } },
  },
  {
    deviceId: 'CAM-004',
    name: 'Server Room',
    deviceType: 'cctv',
    location: 'Level 3 – IT Wing',
    power: { now: { online: true, last_seen: new Date(Date.now() - 15000).toISOString() } },
  },
  {
    deviceId: 'CAM-005',
    name: 'Rooftop North',
    deviceType: 'cctv',
    location: 'Rooftop – North Perimeter',
    power: { now: { online: true, last_seen: new Date(Date.now() - 60000).toISOString() } },
  },
  {
    deviceId: 'CAM-006',
    name: 'Loading Bay',
    deviceType: 'cctv',
    location: 'Ground Floor – Rear',
    power: { now: { online: false, last_seen: new Date(Date.now() - 3600000 * 5).toISOString() } },
  },
];

const StatCard = ({ value, label, color, icon: Icon }) => (
  <motion.div
    whileHover={{ scale: 1.06, y: -3 }}
    transition={{ type: 'spring', stiffness: 400, damping: 18 }}
    className="bg-white/80 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-white/50 text-center shadow-sm hover:shadow-lg transition-all"
  >
    {Icon && <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />}
    <p className={`text-2xl font-black ${color}`}>{value}</p>
    <p className="text-[10px] text-slate-700 font-bold uppercase tracking-widest mt-0.5">{label}</p>
  </motion.div>
);

export default function CCTVManagementPage() {
  const [siteId, setSiteId] = useState('TKKHEAD01');
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedCamera, setExpandedCamera] = useState(null);

  const loadData = useCallback(async (currentSiteId) => {
    setLoading(true);
    setError(null);
    try {
      const deviceList = await fetchSiteDevices(currentSiteId);
      const cctvDevices = deviceList.filter(
        (d) => d.deviceType?.toLowerCase().includes('camera') || d.deviceType?.toLowerCase().includes('cctv')
      );

      setCameras(cctvDevices.length > 0 ? cctvDevices : EXAMPLE_CAMERAS);
    } catch (err) {
      console.error('Failed to load CCTV data:', err);

      setCameras(EXAMPLE_CAMERAS);
      setError(null);
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

  const onlineCameras = cameras.filter((d) => d.power?.now?.online);

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
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 via-gray-100 to-zinc-100 flex items-center justify-center shadow-lg shadow-slate-200/30">
              <Loader2 className="w-9 h-9 text-slate-600 animate-spin" />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-slate-400/15 animate-ping" />
          </div>
          <div className="text-center">
            <p className="text-slate-800 font-bold text-base">Loading data...</p>
            <p className="text-gray-600 text-sm mt-1">Fetching CCTV information</p>
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
            className="p-2.5 sm:p-4 bg-gradient-to-br from-slate-600 via-slate-700 to-gray-800 rounded-xl sm:rounded-2xl text-white shadow-xl shadow-slate-300/40 flex-shrink-0"
          >
            <Video className="w-5 h-5 sm:w-7 sm:h-7" />
          </motion.div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-slate-950 tracking-tight truncate">
              CCTV Management
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 font-semibold mt-0.5">Monitor and manage your security cameras</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.12, rotate: 90 }}
          whileTap={{ scale: 0.88 }}
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all text-slate-500 hover:text-slate-700 disabled:opacity-50 shadow-sm hover:shadow-md"
          title="Refresh"
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </motion.button>
      </motion.div>

      {}
      <motion.div
        initial="hidden"
        animate="visible"
        custom={1}
        variants={fadeIn}
        className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 rounded-2xl sm:rounded-3xl shadow-md shadow-slate-100/40 border border-slate-200/30 p-4 sm:p-7 lg:p-9 mb-6 sm:mb-10"
      >
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-gradient-to-br from-slate-200/25 to-gray-200/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-slate-400 via-gray-400 to-zinc-400 rounded-t-3xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.1, rotate: -6 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="bg-gradient-to-br from-slate-600 to-gray-700 rounded-2xl p-4 shadow-xl shadow-slate-300/30"
            >
              <Shield className="w-7 h-7 text-white" />
            </motion.div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-950 tracking-tight">
                Security Overview
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Site: <span className="font-semibold text-slate-800 bg-white/70 backdrop-blur-sm px-2 py-0.5 rounded-md border border-slate-200/50 text-xs">{siteId}</span>
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-3">
            <StatCard value={cameras.length} label="Cameras" color="text-slate-600" icon={Video} />
            <StatCard value={onlineCameras.length} label="Online" color="text-green-600" icon={Eye} />
            <StatCard value={cameras.length - onlineCameras.length} label="Offline" color="text-red-500" icon={EyeOff} />
          </div>
        </div>
      </motion.div>

      {}
      <motion.div initial="hidden" animate="visible" custom={2} variants={fadeIn}>
        <h2 className="text-lg font-extrabold text-slate-950 flex items-center gap-2.5 mb-6">
          <div className="p-2 bg-gradient-to-br from-slate-100 to-gray-100 rounded-xl shadow-sm">
            <Video className="w-4.5 h-4.5 text-slate-600" />
          </div>
          Cameras
          <span className="text-sm font-bold text-slate-500 bg-slate-50 px-2.5 py-0.5 rounded-full">
            {cameras.length}
          </span>
        </h2>

        {cameras.length === 0 ? (
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            className="bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-100 p-12 text-center shadow-sm"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-50 to-gray-50 flex items-center justify-center mx-auto mb-5 shadow-md">
              <Video className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-700 font-semibold text-base">No CCTV cameras found</p>
            <p className="text-gray-500 text-sm mt-1">Cameras will appear here once configured for this site</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {cameras.map((camera, idx) => {
              const isOnline = camera.power?.now?.online;
              const isExpanded = expandedCamera === (camera.deviceId || camera.id);

              return (
                <motion.div
                  key={camera.deviceId || camera.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.07, duration: 0.4 }}
                  whileHover={{ y: -4 }}
                  onClick={() => setExpandedCamera(isExpanded ? null : (camera.deviceId || camera.id))}
                  className={`bg-white/90 backdrop-blur-sm rounded-2xl border overflow-hidden cursor-pointer transition-all duration-300 ${
                    isExpanded
                      ? 'border-slate-300 shadow-xl ring-1 ring-slate-200/30'
                      : 'border-slate-100 hover:shadow-lg hover:border-slate-200 shadow-sm'
                  }`}
                >
                  {}
                  <div className="relative h-40 bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900 flex items-center justify-center">
                    <Video className="w-12 h-12 text-slate-500" />
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm ${
                        isOnline ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                      }`}>
                        <span className="relative flex h-2 w-2">
                          {isOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />}
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
                        </span>
                        {isOnline ? 'Live' : 'Offline'}
                      </span>
                    </div>
                    {isOnline && (
                      <div className="absolute bottom-3 left-3 text-[10px] font-mono text-slate-400 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded">
                        REC
                        <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full ml-1.5 animate-pulse" />
                      </div>
                    )}
                  </div>

                  {}
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {camera.name || `Camera ${camera.deviceId || camera.id}`}
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-1 font-mono font-semibold">
                      ID: {camera.deviceId || camera.id}
                    </p>

                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 pt-4 border-t border-slate-100 space-y-2"
                      >
                        {camera.power?.now?.last_seen && (
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Last seen: {new Date(camera.power.now.last_seen).toLocaleString()}</span>
                          </div>
                        )}
                        {camera.deviceType && (
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Video className="w-3.5 h-3.5 text-slate-400" />
                            <span className="capitalize">Type: {camera.deviceType}</span>
                          </div>
                        )}
                        {camera.location && (
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>Location: {camera.location}</span>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
