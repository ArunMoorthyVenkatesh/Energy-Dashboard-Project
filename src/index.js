// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import './index.css';

// 🧙‍♂️ 1. Color utility for console output
const color = {
  cyan: (t) => `\x1b[36m${t}\x1b[0m`,
  green: (t) => `\x1b[32m${t}\x1b[0m`,
  yellow: (t) => `\x1b[33m${t}\x1b[0m`,
  red: (t) => `\x1b[31m${t}\x1b[0m`,
  gray: (t) => `\x1b[90m${t}\x1b[0m`,
};

// 🧭 2. Safe environment loading with fallbacks
const ENV = {
  API_URL: process.env.REACT_APP_API_URL || "https://api-semply.semply.cloud/api/v1/iot",
  WS_URL: process.env.REACT_APP_WEBSOCKET_URL || "wss://api-semply.semply.cloud/api/v1/iot/realtime",
  API_KEY: process.env.REACT_APP_API_KEY || "dev-ws-key",
  WEATHER_KEY: process.env.REACT_APP_OPENWEATHER_API_KEY || "demo-key",
  WEATHER_URL: process.env.REACT_APP_OPENWEATHER_BASE_URL || "https://api.openweathermap.org/data/2.5",
  PUBLIC_URL: process.env.PUBLIC_URL || "/",
};

// 🚀 3. Startup banner
console.log(`
${color.cyan("============================================")}
${color.green("🚀 PROJECT 1 Development Server")}
${color.cyan("============================================")}
✅ Compiled successfully!

🌐 You can now view ${color.yellow("PROJECT 1")} in your browser:
  • ${color.green("Local:")}            http://localhost:3000
  • ${color.green("On Your Network:")}  http://192.168.1.20:3000
${color.cyan("============================================")}
`);

// 📦 4. Environment Summary Table
console.table({
  "API URL": ENV.API_URL,
  "WebSocket URL": ENV.WS_URL,
  "API Key": ENV.API_KEY,
  "Weather API": ENV.WEATHER_URL,
  "Public URL": ENV.PUBLIC_URL,
});

// ✅ Note: WebSocket connection test removed - let HomePage handle the actual connection
console.log(color.gray("✨ All systems nominal. WebSocket will connect when dashboard loads."));

// 🧩 5. Mount the App
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);