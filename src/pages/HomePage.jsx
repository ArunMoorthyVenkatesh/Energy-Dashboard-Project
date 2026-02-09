import { useOutletContext } from 'react-router';
import { useEffect, useState, useRef, useCallback } from 'react';
import { X, Clock, Calendar } from 'lucide-react';
import { loadRuntimeConfig } from '../config/RuntimeConfig';
import { mapSiteRealtimeEvent } from '../mappers/realtimeSiteMapper';
import { fetchGroupsForSite, fetchSiteMetadata } from '../api';
import RealTimeKPIWidget from '../components/Dashboard/RealTimeKPIWidget';
import EnergyAnalyticsWidget from '../components/Dashboard/EnergyAnalyticsWidget';
import EnergyInOutWidget from '../components/Dashboard/EnergyInOutWidget';
import CarbonCreditWidget from '../components/Dashboard/CarbonCreditWidget';
import PowerSourceWidget from '../components/Dashboard/PowerSourceWidget';
import GroupUsageWidget from '../components/Dashboard/GroupUsageWidget';
import GroupTimelineWidget from '../components/Dashboard/GroupTimelineWidget';
import styles from './homepage.module.css';

const LAYOUT = [
  { id: 1, name: 'realtime_kpi', title: 'Real-time KPIs', row: 1, rowSpan: 4, col: 1, colSpan: 2 },
  { id: 2, name: 'energy_in_out', title: 'Energy Input & Output', row: 1, rowSpan: 4, col: 3, colSpan: 2 },
  { id: 3, name: 'carbon_credit', title: 'Carbon Credit Generation', row: 1, rowSpan: 4, col: 5, colSpan: 2 },
  { id: 4, name: 'battery', title: 'Battery & Power Sources', row: 5, rowSpan: 3, col: 5, colSpan: 2 },
  { id: 5, name: 'group_energy_usage', title: 'Energy Usage per Group', row: 5, rowSpan: 3, col: 1, colSpan: 4 },
];

function shallowPatchEqual(prevObj, patchObj) {
  if (!prevObj || typeof prevObj !== 'object') return true;
  for (const k of Object.keys(patchObj)) {
    if (prevObj?.[k] !== patchObj[k]) return false;
  }
  return true;
}

async function fetchRealtimeFallback(siteId, apiKey, apiUrl) {
  // ✅ prevent Safari 304 "error loading resource" by forcing a fresh URL
  const url = `${apiUrl}/devices?ts=${Date.now()}`;

  const res = await fetch(url, {
    method: 'GET',
    cache: 'no-store', // ✅ important
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'X-api-key': apiKey,
      'Accept': 'application/json',
      // ✅ bypass cache revalidation / ETag -> 304
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    },
  });

  // ✅ safer parsing (handles empty/non-json)
  const contentType = res.headers.get('content-type') || '';
  const text = await res.text();
  if (!res.ok) throw new Error(`Devices fetch failed: ${res.status} ${text.slice(0, 200)}`);
  if (!contentType.includes('application/json')) {
    throw new Error(`Devices response not JSON: ${contentType} ${text.slice(0, 200)}`);
  }

  const json = JSON.parse(text);
  if (!json.success) throw new Error('Failed to fetch device data');

  const items = Array.isArray(json.data) ? json.data : [];
  const totalLoad = items.filter((d) => d.role === 'load').length;
  const totalSolar = items.filter((d) => d.role === 'solar').length;
  const totalGrid = items.filter((d) => d.role === 'grid').length;

  return {
    energyData: {
      daily: { solar: totalSolar, load: totalLoad, grid: totalGrid },
      monthly: {},
      lifetime: {},
    },
    batteryData: [],
    houseLoad: { daily: totalLoad },
    summary: {
      saving_summary: {},
      energy_summary: { load: totalLoad, solar: totalSolar, grid: totalGrid },
    },
    carbonCredit: {
      saving_summary: {},
      energy_summary: { reduction: totalSolar * 0.2 },
    },
  };
}

function WidgetWrapper({ children, onExpand, compact = true, showExpand = true, noScroll = false }) {
  return (
    <div
      onClick={showExpand ? onExpand : undefined}
      className={`${styles.widgetWrapper} ${compact ? styles.compact : ''} ${showExpand ? styles.clickable : ''}`}
    >
      <div className={`${styles.widgetContent} ${noScroll ? styles.noScroll : ''}`}>
        <div className={compact ? styles.widgetInner : ''}>
          {children}
        </div>
      </div>
    </div>
  );
}

function ExpandedWidgetModal({ children, title, onClose }) {
  return (
    <div
      className={styles.modalOverlay}
      onClick={onClose}
    >
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className={styles.modalClose}
          title="Close"
        >
          <X size={24} />
        </button>

        <div className={styles.modalBody}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { setTopbarTitle } = useOutletContext();
  const [time, setTime] = useState(new Date());
  const [wsData, setWsData] = useState({
    batteryData: [],
    energyData: { daily: {}, monthly: {}, lifetime: {} },
    houseLoad: { daily: null },
    summary: { saving_summary: {}, energy_summary: {} },
    carbonCredit: { saving_summary: {}, energy_summary: {} },
  });

  const [siteInfo, setSiteInfo] = useState(null);
  const [groupData, setGroupData] = useState([]);
  const [expandedWidget, setExpandedWidget] = useState(null);
  const socketRef = useRef(null);
  const heartbeatRef = useRef(null);
  const runtimeConfigRef = useRef({});
  const [siteId, setSiteId] = useState('TKKHEAD01');
  const [, setIsConnected] = useState(false);
  const pollingRef = useRef(null);
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => setTopbarTitle('Energy Optimization Dashboard'), [setTopbarTitle]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const cfg = await loadRuntimeConfig();
        runtimeConfigRef.current = cfg;
        if (cfg?.SITE_ID) setSiteId(cfg.SITE_ID);
        setConfigLoaded(true);
      } catch (err) {
        console.warn('Runtime config missing, using defaults:', err);
        runtimeConfigRef.current = {
          API_KEY: process.env.REACT_APP_API_KEY || 'dev-ws-key',
          WEBSOCKET_URL: process.env.REACT_APP_WEBSOCKET_URL || 'wss://api-semply.semply.cloud/api/v1/iot/realtime',
          API_URL: process.env.REACT_APP_API_URL || 'https://api-semply.semply.cloud/api/v1/iot',
          SITE_ID: 'TKKHEAD01'
        };
        setConfigLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!configLoaded) {
      console.log('⏳ Waiting for config to load...');
      return;
    }

    const apiKey = runtimeConfigRef.current.API_KEY || process.env.REACT_APP_API_KEY || 'dev-ws-key';
    const apiUrl = runtimeConfigRef.current.API_URL || process.env.REACT_APP_API_URL || 'https://api-semply.semply.cloud/api/v1/iot';

    const fetchDevices = async () => {
      try {
        // ✅ prevent Safari 304 "error loading resource" by forcing a fresh URL
        const url = `${apiUrl}/devices?ts=${Date.now()}`;

        const response = await fetch(url, {
          method: 'GET',
          cache: 'no-store', // ✅ important
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'X-api-key': apiKey,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            // ✅ bypass cache revalidation / ETag -> 304
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          }
        });

        // ✅ safer parsing (handles empty/non-json)
        const contentType = response.headers.get('content-type') || '';
        const rawText = await response.text();

        if (!response.ok) {
          console.error('❌ devices fetch failed:', response.status, rawText.slice(0, 300));
          return;
        }

        if (!contentType.includes('application/json')) {
          console.error('❌ devices response not JSON:', contentType, rawText.slice(0, 300));
          return;
        }

        const json = JSON.parse(rawText);

        console.log('📡 API Response:', json);

        if (json.success && json.data) {
          // ✅ Safety check: ensure json.data is an array
          const dataArray = Array.isArray(json.data) ? json.data : [];

          const allDevices = dataArray.map(device => ({
            deviceId: device.deviceId,
            id: device.id,
            name: device.name,
            role: device.role,
            power: device.power,
            status: device.power?.now?.online ? 'normal' : 'offline',
          }));

          console.log('✅ Mapped devices:', allDevices);

          setWsData(prev => ({
            ...prev,
            batteryData: allDevices
          }));
        }
      } catch (error) {
        console.error('❌ Failed to fetch devices:', error);
      }
    };

    fetchDevices();
  }, [configLoaded]);

  useEffect(() => {
    if (!siteId) return;
    (async () => {
      try {
        const [siteMeta, groups] = await Promise.all([
          fetchSiteMetadata(siteId),
          fetchGroupsForSite(siteId),
        ]);
        setSiteInfo({
          name: siteMeta.name,
          latitude: siteMeta.latitude,
          longitude: siteMeta.longitude,
        });
        setGroupData(groups);
      } catch (err) {
        console.error('Failed to load dashboard metadata', err);
      }
    })();
  }, [siteId]);

  const startHeartbeat = useCallback(() => {
    heartbeatRef.current = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ action: 'heartbeat' }));
      }
    }, 30000);
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const startPollingFallback = useCallback(() => {
    const apiKey = runtimeConfigRef.current.API_KEY || process.env.REACT_APP_API_KEY || 'dev-ws-key';
    const apiUrl = runtimeConfigRef.current.API_URL || process.env.REACT_APP_API_URL || 'https://api-semply.semply.cloud/api/v1/iot';

    if (pollingRef.current) return;

    pollingRef.current = setInterval(async () => {
      try {
        const data = await fetchRealtimeFallback(siteId, apiKey, apiUrl);
        setWsData((prev) => (shallowPatchEqual(prev, data) ? prev : { ...prev, ...data }));
      } catch (err) {
        console.warn('Polling failed', err);
      }
    }, 10000);
  }, [siteId]);

  const stopPollingFallback = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const initializeWebSocket = useCallback(() => {
    const apiKey = runtimeConfigRef.current.API_KEY || process.env.REACT_APP_API_KEY || 'dev-ws-key';
    const baseUrl = runtimeConfigRef.current.WEBSOCKET_URL ||
      process.env.REACT_APP_WEBSOCKET_URL ||
      'wss://api-semply.semply.cloud/api/v1/iot/realtime';
    const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}apiKey=${encodeURIComponent(apiKey)}`;

    try {
      socketRef.current = new WebSocket(url);
    } catch (err) {
      startPollingFallback();
      return;
    }

    socketRef.current.onopen = () => {
      setIsConnected(true);
      stopPollingFallback();
      startHeartbeat();
    };

    socketRef.current.onerror = () => {
      stopHeartbeat();
      startPollingFallback();
    };

    socketRef.current.onmessage = (msg) => {
      let event;
      try {
        event = JSON.parse(msg.data);
      } catch {
        return;
      }

      if (!event?.type) return;

      if (event.type === 'site_realtime_state') {
        if (event.siteId != null && String(event.siteId) !== String(siteId)) {
          return;
        }

        const mapped = mapSiteRealtimeEvent(event);

        if (!mapped) return;

        setWsData((prev) => {
          const updated = { ...prev, ...mapped };

          console.log('🔄 Before merge - batteryData:', prev.batteryData?.length);

          if (prev.batteryData && prev.batteryData.length > 0) {
            const updatedDevices = prev.batteryData.map(device => {
              if (device.role === 'solar' && mapped.siteLevelSolarData) {
                return {
                  ...device,
                  power: mapped.siteLevelSolarData.power,
                  status: mapped.siteLevelSolarData.power.now.online ? 'normal' : 'offline'
                };
              }

              if (device.role === 'battery' && mapped.batteryData) {
                const wsDevice = mapped.batteryData.find(
                  wd => String(wd.id) === String(device.id) || String(wd.deviceId) === String(device.deviceId)
                );
                if (wsDevice) {
                  return { ...device, ...wsDevice, name: device.name, deviceId: device.deviceId };
                }
              }

              return device;
            });

            updated.batteryData = updatedDevices;
          }

          console.log('🔄 After merge - batteryData:', updated.batteryData?.length);

          return shallowPatchEqual(prev, updated) ? prev : updated;
        });
      }
    };

    socketRef.current.onclose = () => {
      setIsConnected(false);
      stopHeartbeat();
      setTimeout(initializeWebSocket, 15000);
    };
  }, [siteId, startPollingFallback, stopPollingFallback, startHeartbeat, stopHeartbeat]);

  useEffect(() => {
    if (!configLoaded) return;
    initializeWebSocket();
    return () => {
      stopHeartbeat();
      stopPollingFallback();
      socketRef.current?.close();
    };
  }, [initializeWebSocket, configLoaded, stopHeartbeat, stopPollingFallback]);

  function renderWidget(name, isExpanded = false) {
    switch (name) {
      case 'realtime_kpi':
        return <RealTimeKPIWidget wsData={wsData} siteInfo={siteInfo} />;
      case 'energy_analytics':
        return <EnergyAnalyticsWidget wsData={wsData} siteId={siteId} />;
      case 'energy_in_out':
        return <EnergyInOutWidget data={wsData.energyData} />;
      case 'carbon_credit':
        return <CarbonCreditWidget data={wsData.carbonCredit} isExpanded={isExpanded} />;
      case 'battery':
        return <PowerSourceWidget devices={wsData.batteryData || []} />;
      case 'group_energy_usage':
        return <GroupUsageWidget data={groupData} />;
      case 'group_energy_timeline':
        return <GroupTimelineWidget data={groupData} />;
      default:
        return <div className="bg-white rounded-lg shadow" />;
    }
  }

  return (
    <>
      <div className={styles.pageContainer}>
        {!expandedWidget && (
          <div className="mb-6">
            <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-3 shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 mb-1">
                      {siteInfo?.name || 'Energy Management Dashboard'}
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span className="font-semibold">
                          {time.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="w-1 h-1 rounded-full bg-slate-400" />
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span className="font-semibold">
                          {time.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-slate-200/60 shadow-sm">
                  <div className="relative">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                    <div className="absolute inset-0 w-2.5 h-2.5 bg-green-500 rounded-full opacity-75 animate-ping" />
                  </div>
                  <span className="text-sm font-bold text-slate-700">Live</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={styles.mainGrid}>
          <div className={`${styles.gridItem} ${styles.realtimeKpi}`}>
            <WidgetWrapper compact showExpand noScroll={false} onExpand={() => setExpandedWidget(LAYOUT[0])}>
              {renderWidget('realtime_kpi', false)}
            </WidgetWrapper>
          </div>

          <div className={`${styles.gridItem} ${styles.energyInOut}`}>
            <WidgetWrapper compact showExpand noScroll={true} onExpand={() => setExpandedWidget(LAYOUT[1])}>
              {renderWidget('energy_in_out', false)}
            </WidgetWrapper>
          </div>

          <div className={`${styles.gridItem} ${styles.carbonCredit}`}>
            <WidgetWrapper compact showExpand noScroll={false} onExpand={() => setExpandedWidget(LAYOUT[2])}>
              {renderWidget('carbon_credit', false)}
            </WidgetWrapper>
          </div>

          <div className={`${styles.gridItem} ${styles.groupUsage}`}>
            <WidgetWrapper compact showExpand noScroll={false} onExpand={() => setExpandedWidget(LAYOUT[4])}>
              {renderWidget('group_energy_usage', false)}
            </WidgetWrapper>
          </div>

          <div className={`${styles.gridItem} ${styles.battery}`}>
            <WidgetWrapper compact showExpand noScroll={false} onExpand={() => setExpandedWidget(LAYOUT[3])}>
              {renderWidget('battery', false)}
            </WidgetWrapper>
          </div>
        </div>

        <div className={styles.fullWidthSection}>
          <WidgetWrapper compact showExpand noScroll={false} onExpand={() => setExpandedWidget({ id: 'energy_analytics', name: 'energy_analytics', title: 'Energy Analytics' })}>
            <EnergyAnalyticsWidget wsData={wsData} siteId={siteId} />
          </WidgetWrapper>
        </div>

        <div className={styles.fullWidthSection}>
          <WidgetWrapper compact showExpand noScroll={false} onExpand={() => setExpandedWidget({ id: 'group_timeline', name: 'group_energy_timeline', title: 'Group Energy Timeline' })}>
            <GroupTimelineWidget data={groupData} />
          </WidgetWrapper>
        </div>
      </div>

      {expandedWidget && (
        <ExpandedWidgetModal title={expandedWidget.title} onClose={() => setExpandedWidget(null)}>
          {renderWidget(expandedWidget.name, true)}
        </ExpandedWidgetModal>
      )}
    </>
  );
}
