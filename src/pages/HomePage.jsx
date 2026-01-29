import { useOutletContext } from 'react-router';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Maximize2, X } from 'lucide-react';
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

const NUM_COLS = 6;
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
  const url = `${apiUrl}/devices`;
  const res = await fetch(url, {
    headers: { 
      'Authorization': `Bearer ${apiKey}`,
      'X-api-key': apiKey
    },
  });
  const json = await res.json();
  if (!json.success) throw new Error('Failed to fetch device data');
  const items = json.data?.items || [];
  const totalLoad = items.filter((d) => d.energy?.role === 'load').length;
  const totalSolar = items.filter((d) => d.energy?.role === 'solar').length;
  const totalGrid = items.filter((d) => d.energy?.role === 'grid').length;

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
      style={{
        height: '100%',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 18,
        background: 'white',
        boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
      }}
      className="transition-all duration-200 hover:shadow-md"
    >
      {showExpand && (
        <button
          onClick={onExpand}
          title="Expand widget"
          className="absolute top-3 right-3 z-30 p-2 rounded-lg border border-gray-200 
                     bg-white/80 backdrop-blur-sm hover:bg-blue-50 active:scale-95 
                     transition-all duration-150 shadow-sm"
        >
          <Maximize2 size={16} className="text-gray-600" />
        </button>
      )}
      <div
        style={{
          height: '100%',
          width: '100%',
          overflowY: noScroll ? 'hidden' : 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'thin',
          scrollbarColor: '#CBD5E0 #F7FAFC',
        }}
      >
        <div
          style={{
            transform: compact ? 'scale(0.96)' : 'none',
            transformOrigin: 'top left',
            width: compact ? '104%' : '100%',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function ExpandedWidgetModal({ children, title, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-11/12 h-5/6 flex flex-col overflow-hidden animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="hover:bg-gray-200 text-gray-600 hover:text-gray-800 rounded-lg transition-all duration-200 p-2"
            title="Close"
          >
            <X size={22} />
          </button>
        </div>
        <div
          className="flex-1 p-6"
          style={{
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollbarWidth: 'thin',
            scrollbarColor: '#CBD5E0 #F7FAFC',
          }}
        >
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
        console.log('🔄 Fetching devices from:', `${apiUrl}/devices`);
        
        const response = await fetch(`${apiUrl}/devices`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'X-api-key': apiKey,
            'Content-Type': 'application/json'
          }
        });
        
        const json = await response.json();
        console.log('📦 API Response:', json);
        
        if (json.success && json.data?.items) {
          const allDevices = json.data.items.map(device => ({
            deviceId: device.deviceId,
            id: device.id,
            name: device.name,
            role: device.energy?.role || 'unknown',
            status: device.status === 'active' ? 'normal' : 'offline',
            deviceType: device.deviceType,
            daily: 0,
            monthly: 0,
            lifetime: 0,
            voltage: 0,
            current: 0,
            temperature: 0,
            active_power: 0,
            battery_percent: 0,
          }));

          console.log('✅ All devices:', allDevices);
          console.log('📊 Total devices for display:', allDevices.length);
          
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

  const startHeartbeat = () => {
    heartbeatRef.current = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ action: 'heartbeat' }));
      }
    }, 30000);
  };

  const stopHeartbeat = () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  };

  function startPollingFallback() {
    const apiKey = runtimeConfigRef.current.API_KEY || process.env.REACT_APP_API_KEY || 'dev-ws-key';
    const apiUrl = runtimeConfigRef.current.API_URL || process.env.REACT_APP_API_URL || 'https://api-semply.semply.cloud/api/v1/iot';

    if (pollingRef.current) return;
    console.info('⚙️ Using REST polling fallback');

    pollingRef.current = setInterval(async () => {
      try {
        const data = await fetchRealtimeFallback(siteId, apiKey, apiUrl);
        setWsData((prev) => (shallowPatchEqual(prev, data) ? prev : { ...prev, ...data }));
      } catch (err) {
        console.warn('Polling failed', err);
      }
    }, 10000);
  }

  function stopPollingFallback() {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }

  const initializeWebSocket = useCallback(() => {
    const apiKey = runtimeConfigRef.current.API_KEY || process.env.REACT_APP_API_KEY || 'dev-ws-key';
    const baseUrl = runtimeConfigRef.current.WEBSOCKET_URL || 
      process.env.REACT_APP_WEBSOCKET_URL || 
      'wss://api-semply.semply.cloud/api/v1/iot/realtime';
    const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}apiKey=${encodeURIComponent(apiKey)}`;

    console.info('🔌 Attempting WebSocket connection to:', baseUrl);

    try {
      socketRef.current = new WebSocket(url);
    } catch (err) {
      console.warn('❌ WebSocket creation failed, switching to polling fallback:', err);
      startPollingFallback();
      return;
    }

    socketRef.current.onopen = () => {
      console.info('✅ Realtime websocket connected');
      setIsConnected(true);
      stopPollingFallback();
      startHeartbeat();
    };

    socketRef.current.onerror = (err) => {
      console.error('❌ Realtime websocket error', err);
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

      console.log('🔍 WebSocket Event:', event);

      if (!event?.type) return;

      if (event.type === 'site_realtime_state') {
        if (event.siteId != null && String(event.siteId) !== String(siteId)) {
          return;
        }

        console.log('📦 WebSocket Payload:', event.payload);

        const mapped = mapSiteRealtimeEvent(event);
        console.log('✨ Mapped Data:', mapped);

        if (!mapped) return;
        
        setWsData((prev) => {
          const updated = { ...prev, ...mapped };
          
          if (mapped.batteryData && prev.batteryData) {
            const wsDeviceMap = new Map();
            mapped.batteryData.forEach(wsDevice => {
              wsDeviceMap.set(String(wsDevice.id), wsDevice);
            });
            
            const mergedDevices = prev.batteryData.map(device => {
              const wsDevice = wsDeviceMap.get(String(device.id)) || wsDeviceMap.get(String(device.deviceId));
              
              if (wsDevice) {
                console.log(`✅ Merging WebSocket data for device ${device.name}:`, wsDevice);
                return { ...device, ...wsDevice, name: device.name, deviceId: device.deviceId };
              }
              return device;
            });
            
            updated.batteryData = mergedDevices;
            console.log('🔗 Merged battery data:', updated.batteryData);
          }
          
          return shallowPatchEqual(prev, updated) ? prev : updated;
        });
      }
    };

    socketRef.current.onclose = () => {
      console.warn('⚠️ Realtime websocket disconnected — falling back to polling');
      setIsConnected(false);
      stopHeartbeat();
      startPollingFallback();
      setTimeout(initializeWebSocket, 15000);
    };
  }, [siteId]);

  useEffect(() => {
    if (!configLoaded) return;
    initializeWebSocket();
    return () => {
      stopHeartbeat();
      stopPollingFallback();
      socketRef.current?.close();
    };
  }, [initializeWebSocket, configLoaded]);

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
      <div
        style={{
          height: '100vh',
          width: '100%',
          backgroundColor: '#F9FAFB',
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          overflow: 'auto',
        }}
      >
        {!expandedWidget && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              flexShrink: 0,
            }}
          >
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', margin: 0 }}>
              {siteInfo?.name || 'Energy Management Dashboard'}
            </h1>
            <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>
              Last updated:{' '}
              {time.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} •{' '}
              {time.toLocaleTimeString()}
            </p>
          </div>
        )}

        <div
          style={{
            minHeight: '700px',
            height: '700px',
            overflow: 'hidden',
            display: 'grid',
            gridTemplateColumns: `repeat(${NUM_COLS}, minmax(0, 1fr))`,
            gridTemplateRows: 'repeat(7, minmax(0, 1fr))',
            gap: '8px',
            flexShrink: 0,
          }}
        >
          {LAYOUT.map((l) => (
            <div
              key={l.id}
              style={{
                gridColumn: `${l.col} / span ${l.colSpan}`,
                gridRow: `${l.row} / span ${l.rowSpan}`,
                minHeight: 0,
                minWidth: 0,
                overflow: 'hidden',
              }}
            >
              {l.name === 'group_energy_usage' || l.name === 'battery' ? (
                <div style={{ height: '100%', width: '100%', padding: '4px' }}>
                  {renderWidget(l.name, false)}
                </div>
              ) : (
                <WidgetWrapper
                  compact
                  showExpand
                  noScroll={l.name === 'energy_in_out'}
                  onExpand={() => setExpandedWidget(l)}
                >
                  {renderWidget(l.name, false)}
                </WidgetWrapper>
              )}
            </div>
          ))}
        </div>

        {/* Energy Analytics Section - Below main grid */}
        <div style={{ flexShrink: 0, minHeight: '550px', marginBottom: '8px' }}>
          <WidgetWrapper
            compact
            showExpand
            noScroll={false}
            onExpand={() => setExpandedWidget({ id: 'energy_analytics', name: 'energy_analytics', title: 'Energy Analytics' })}
          >
            <EnergyAnalyticsWidget wsData={wsData} siteId={siteId} />
          </WidgetWrapper>
        </div>

        {/* Group Timeline Section - Below Energy Analytics */}
        <div style={{ flexShrink: 0, minHeight: '300px', marginBottom: '8px' }}>
          <div style={{ 
            height: '100%', 
            width: '100%', 
            position: 'relative',
            overflow: 'visible',
            borderRadius: 18,
            background: 'white',
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
          }}
          className="transition-all duration-200 hover:shadow-md"
          >
            <button
              onClick={() => setExpandedWidget({ id: 'group_timeline', name: 'group_energy_timeline', title: 'Group Energy Timeline' })}
              title="Expand widget"
              className="absolute top-3 right-3 z-30 p-2 rounded-lg border border-gray-200 
                         bg-white/80 backdrop-blur-sm hover:bg-blue-50 active:scale-95 
                         transition-all duration-150 shadow-sm"
            >
              <Maximize2 size={16} className="text-gray-600" />
            </button>
            <div style={{ 
              height: '100%', 
              width: '100%',
              overflow: 'visible',
            }}>
              <div style={{ 
                transform: 'scale(0.96)',
                transformOrigin: 'top left',
                width: '104%',
              }}>
                <GroupTimelineWidget data={groupData} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {expandedWidget && (
        <ExpandedWidgetModal
          title={expandedWidget.title}
          onClose={() => setExpandedWidget(null)}
        >
          <WidgetWrapper compact={false} showExpand={false}>
            {renderWidget(expandedWidget.name, true)}
          </WidgetWrapper>
        </ExpandedWidgetModal>
      )}
    </>
  );
}