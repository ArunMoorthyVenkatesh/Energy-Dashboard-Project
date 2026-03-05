# SEMPLY - Energy Management & IoT Dashboard

A real-time energy monitoring and IoT management dashboard built with React. Designed for facility-level energy visibility, the platform connects to live IoT devices via WebSocket and REST APIs to deliver actionable insights across energy consumption, solar generation, battery storage, carbon credits, and device control.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Pages & Modules](#pages--modules)
- [Dashboard Widgets](#dashboard-widgets)
- [Data Architecture](#data-architecture)
- [Configuration](#configuration)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Deployment](#deployment)

---

## Overview

SEMPLY is an IoT energy management platform built for industrial and commercial facilities. It provides a unified dashboard to monitor energy flow in real time, manage connected devices, track carbon credit generation, and analyze historical energy trends — all from a responsive, glassmorphic UI.

The system is configured for **Toyota HQ (TKKHEAD01)** as the default site and connects to the SEMPLY cloud backend.

---

## Features

### Real-Time Monitoring
- Live WebSocket connection to IoT backend with automatic reconnect and heartbeat
- Fallback REST polling when WebSocket is unavailable
- Per-device status updates (`active` / `inactive`) driven by live power telemetry

### Energy Analytics
- Day / Month / Lifetime energy breakdowns via Gantt chart API
- Stacked bar charts and pie charts for energy source distribution
- Auto-scaling units: kWh → MWh → GWh, Baht → KBaht → MBaht

### Dashboard KPIs
- Monthly and daily energy cost savings
- Current house load consumption
- Live weather and temperature display (OpenWeatherMap One Call API)
- Carbon credit generation tracking

### Device Management
- View and control all site IoT devices (air conditioners, sensors, EV chargers, outlets, etc.)
- Scene presets: **Eco**, **Comfort**, **Cool**
- Schedule-based device automation (Morning, Daytime, Evening, Night periods)
- Local persistence via `localStorage` for schedules and device state

### Site, Group & CCTV Management
- Site configuration and metadata viewer
- Group-based energy usage breakdown with per-group timelines
- CCTV camera management interface

### Responsive Layout
- Collapsible sidebar navigation (auto-collapses on tablet breakpoints)
- Mobile hamburger menu with backdrop overlay
- Widget expand-to-fullscreen modal for detailed views

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 19 |
| Routing | React Router v7 |
| Styling | Tailwind CSS v3 |
| Animation | Framer Motion |
| Icons | Lucide React |
| HTTP Client | Axios |
| Charts | Custom SVG/Canvas-based components |
| Weather | OpenWeatherMap One Call API |
| Real-Time | WebSocket (native browser API) |
| Build Tool | Create React App (react-scripts 5) |
| Deployment | GitHub Pages (gh-pages) |

---

## Project Structure

```
src/
├── api/                    # API layer
│   ├── BaseAPI.js          # Axios instance with base URL and auth headers
│   ├── DashboardAPI.js     # Site metadata, groups, devices, timeline
│   ├── DeviceAPI.js        # Device control (on/off, scene, schedule)
│   ├── ElectricUsageAPI.js # Historical electricity usage queries
│   ├── WeatherAPI.js       # OpenWeatherMap One Call integration
│   ├── ganttApi.js         # Site-level Gantt chart energy data
│   └── GroupData.js        # Group energy aggregation
│
├── assets/
│   ├── svg/                # React SVG icon components (Solar, Battery, EV, etc.)
│   └── weather/            # Weather condition SVGs (clear, rain, thunder, etc.)
│
├── components/
│   ├── Base/               # Shared UI components (Card, Dropdown, UserProfile)
│   ├── Dashboard/          # Dashboard widget components
│   │   ├── RealTimeKPIWidget.jsx      # KPI cards + weather display
│   │   ├── EnergyAnalyticsWidget.jsx  # Bar/pie charts with time range selector
│   │   ├── EnergyInOutWidget.jsx      # Energy input/output flow display
│   │   ├── CarbonCreditWidget.jsx     # Carbon credit generation tracker
│   │   ├── PowerSourceWidget.jsx      # Battery & power source status
│   │   ├── GroupUsageWidget.jsx       # Per-group energy usage breakdown
│   │   ├── GroupTimelineWidget.jsx    # Timeline Gantt chart per group
│   │   ├── SolarPanelWidget.jsx       # Solar generation metrics
│   │   ├── SolarBatteryWidget.jsx     # Combined solar + battery view
│   │   ├── BatteryWidget.jsx          # Battery state of charge
│   │   ├── WeatherTempDisplay.jsx     # Temperature & weather condition
│   │   └── RealTimeWidget.jsx         # Generic real-time data widget
│   └── Graphs/
│       ├── PieGraph.jsx               # Energy source pie chart
│       ├── TimelineBarchart.jsx       # Stacked bar chart for timeline data
│       ├── DoubleLineGraph.jsx        # Dual-line trend graph
│       └── UsageGraph.jsx             # Usage area/line graph
│
├── config/
│   └── RuntimeConfig.js    # Loads runtime-config.json for deployment overrides
│
├── hooks/
│   └── useMediaQuery.js    # Responsive breakpoint hook
│
├── layouts/
│   └── DashboardLayout.jsx # Sidebar nav + outlet wrapper
│
├── mappers/
│   ├── realtimeSiteMapper.js  # Maps WebSocket site_realtime_state events
│   ├── restMappers.js         # Maps REST API responses (site, groups, Gantt)
│   ├── ganttMapper.js         # Transforms Gantt API data to chart format
│   └── viewModels.js          # Shared view model transformations
│
├── pages/
│   ├── LandingPage.jsx           # Animated splash screen (auto-redirects in 5s)
│   ├── HomePage.jsx              # Main dashboard with all widgets
│   ├── DeviceManagementPage.jsx  # IoT device control & scheduling
│   ├── SiteManagementPage.jsx    # Site configuration view
│   ├── GroupManagementPage.jsx   # Group-level management
│   ├── GroupSiteManagementPage.jsx
│   └── CCTVManagementPage.jsx    # CCTV camera management
│
└── utils/
    ├── FormatUtil.js       # Number formatting with commas
    ├── GraphUtil.js        # Chart data helpers
    ├── TimeUtil.js         # Date/time formatting utilities
    ├── DeviceUtil.js       # Device type/status helpers
    ├── WeatherUtil.js      # Weather response normalization
    └── WeatherIconMap.js   # Maps weather condition codes to SVG icons
```

---

## Pages & Modules

### Landing Page (`/`)
- Animated splash screen with SEMPLY branding
- Progress bar animation over 5 seconds
- Auto-redirects to the IoT dashboard

### Home Dashboard (`/iot-dashboard`)
- Central hub displaying all real-time energy widgets
- WebSocket connection is established here on mount
- Supports widget expand-to-fullscreen via modal overlay
- Live clock and date display with site name fetched from API

### Device Management (`/iot-dashboard/devices`)
- Lists all site devices fetched from API
- Scene preset quick-actions: **Eco** (26°C, low fan), **Comfort** (23°C, medium fan), **Cool** (20°C, high fan)
- Schedule builder: assign device behavior across Morning / Daytime / Evening / Night periods
- Filtering by device status and type

### Site Management (`/iot-dashboard/sites`)
- Site-level metadata and configuration

### Group Management (`/iot-dashboard/groups`)
- Group-based energy usage view and management

### CCTV Management (`/iot-dashboard/cctv`)
- Camera listing and management interface

---

## Dashboard Widgets

| Widget | Description |
|---|---|
| **Real-Time KPIs** | Monthly savings, daily avg savings, current house load, live temperature |
| **Energy Input & Output** | Visualizes grid import/export and solar generation flow |
| **Carbon Credit Generation** | Tracks carbon offset generated from solar and savings |
| **Power Source & Battery** | Per-device battery status and power source breakdown |
| **Group Energy Usage** | Bar chart of energy consumption broken down by device group |
| **Energy Analytics** | Pie + stacked bar chart with Day / Month / Lifetime toggle and manual refresh |
| **Group Energy Timeline** | Gantt-style timeline of energy flow per group |

All widgets support click-to-expand, opening a full-screen modal for detailed inspection.

---

## Data Architecture

### WebSocket (Real-Time)

Connects to `wss://api-semply.semply.cloud/api/v1/iot/realtime?apiKey=<key>`.

Handles two event types:

- `site_realtime_state` — Updates battery data, energy summaries, house load, carbon credit, and saving summaries for the active site
- `device_realtime_state` — Updates individual device online/offline status and power readings

A 30-second heartbeat keeps the connection alive. On disconnect, the app automatically reconnects after 15 seconds. If WebSocket fails entirely, it falls back to REST polling every 10 seconds.

### REST API

Base URL: `https://api-semply.semply.cloud/api/v1/iot`

| Endpoint | Purpose |
|---|---|
| `GET /sites/:siteId` | Site metadata (name, latitude, longitude) |
| `GET /sites/:siteId/devices` | All devices at a site |
| `GET /groups/energy-usage-list` | Group energy usage list |
| `GET /groups/:groupId/gantt-chart` | Timeline energy data for a group |
| `GET /sites/:siteId/gantt-chart` | Site-level energy timeline for analytics chart |

Supported Gantt granularities:
- `hour` — for Day view
- `day` — for Month view
- `year` — for Lifetime view

### Weather API

Uses OpenWeatherMap One Call API (`/onecall`) with metric units. Weather data is cached in `localStorage` to minimize API calls between page refreshes.

---

## Configuration

### Runtime Config (`public/runtime-config.json`)

The app supports deployment-time configuration injection via `public/runtime-config.json`. This allows overriding API URLs and keys without rebuilding the app:

```json
{
  "API_URL": "https://api-semply.semply.cloud/api/v1/iot",
  "WEBSOCKET_URL": "wss://api-semply.semply.cloud/api/v1/iot/realtime",
  "API_KEY": "your-api-key",
  "OPENWEATHER_API_KEY": "your-openweather-key",
  "SITE_ID": "TKKHEAD01"
}
```

If this file is absent or malformed, the app falls back to environment variables, then to built-in defaults.

---

## Getting Started

### Prerequisites
- Node.js >= 16
- npm >= 8

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm start
```

Opens at `http://localhost:3000/v2`

### Build for Production

```bash
npm run build
```

### Run Tests

```bash
npm test
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
REACT_APP_API_URL=https://api-semply.semply.cloud/api/v1/iot
REACT_APP_WEBSOCKET_URL=wss://api-semply.semply.cloud/api/v1/iot/realtime
REACT_APP_API_KEY=your-api-key
REACT_APP_OPENWEATHER_API_KEY=your-openweather-api-key
REACT_APP_OPENWEATHER_BASE_URL=https://api.openweathermap.org/data/2.5
```

Environment variables are overridden at runtime by `public/runtime-config.json` if present.

---

## API Reference

### DashboardAPI

```js
fetchSiteMetadata(siteId)
// Returns: { name, latitude, longitude }

fetchGroupsForSite(siteId)
// Returns: array of group objects

fetchSiteDevices(siteId)
// Returns: array of device objects

fetchGroupTimeline({ groupId, timeRange, timeZone })
// Returns: Gantt chart data { grid, pv, bess, home_load }
```

### ganttApi

```js
fetchSiteGanttChart({ siteId, granularity, date })
// Returns: site energy timeline series for analytics chart
```

### WeatherAPI

```js
WeatherAPI.getOneCall({ lat, lon, units, signal })
// Returns: OpenWeatherMap One Call API response
```

---

## Deployment

### GitHub Pages

```bash
npm run deploy
```

Runs `npm run build` then publishes the `build/` directory to the `gh-pages` branch. The app is served under the `/v2` basename as configured in React Router.

### Docker / Static Server

Serve the `build/` directory with any static file server. Inject `public/runtime-config.json` into the container at deploy time to configure the environment without rebuilding.

---

## License

Private — All rights reserved. Built and maintained by the SEMPLY team.
