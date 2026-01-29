import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import HomePage from './pages/HomePage';
import LandingPage from './pages/LandingPage';
import DeviceManagementPage from './pages/DeviceManagementPage'; // ✨ ADD THIS

// 🌍 Helper to safely read environment variables with defaults
const getEnv = (key, fallback) => process.env[key] || fallback;

// ✅ Define runtime environment config
const ENV = {
  API_URL: getEnv('REACT_APP_API_URL', 'https://api-semply.semply.cloud/api/v1/iot'),
  WS_URL: getEnv('REACT_APP_WEBSOCKET_URL', 'wss://api-semply.semply.cloud/api/v1/iot/realtime'),
  API_KEY: getEnv('REACT_APP_API_KEY', 'dev-ws-key'),
  WEATHER_KEY: getEnv('REACT_APP_OPENWEATHER_API_KEY', 'demo-key'),
  WEATHER_URL: getEnv('REACT_APP_OPENWEATHER_BASE_URL', 'https://api.openweathermap.org/data/2.5'),
  PUBLIC_URL: getEnv('PUBLIC_URL', '/'),
};

// 🧠 Log environment table for quick verification
console.log('=== ENV CHECK ===');
console.table(ENV);
console.log('=================');

// ✅ Note: Connection tests removed - let HomePage handle the actual connections
console.log('ℹ️ WebSocket and API connections will be established in HomePage');

// ⚛️ React Router v6 setup
function App() {
  return (
    <BrowserRouter basename="/v2">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="iot-dashboard" element={<DashboardLayout />}>
          <Route index element={<HomePage />} />
          <Route path="devices" element={<DeviceManagementPage />} /> {/* ✨ ADD THIS LINE */}
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;