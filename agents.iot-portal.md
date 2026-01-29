# agents.iot-portal.md — UI Agent Contract

> This document defines the **observed, binding responsibilities and constraints**
> of the `iot-portal` application within the SEMP system.
>
> This is a **contract**, not documentation or a design proposal.

---

## 1. Application Role

`iot-portal` is a **React-based IoT dashboard UI** that:

- Consumes backend APIs for energy and IoT monitoring
- Renders graphs, summaries, and realtime site metrics
- Acts as a **pure consumer** of backend data and realtime feeds

The application:
- Holds only transient UI state and lightweight browser-side caches
- Does not own or persist backend data

---

## 2. Allowed Responsibilities

### Data Consumption
- Fetch energy usage, group lists, and group timelines via HTTP APIs
- Subscribe to realtime site updates over WebSocket
- Render realtime metrics and dashboard views

### Client-Side State
- Maintain browser-side UI state
- Use lightweight caches where appropriate (e.g. weather cache in `localStorage`)

### External Data
- Fetch third-party weather data for display purposes only

---

## 3. Forbidden Responsibilities

`iot-portal` MUST NOT:

- Perform device, site, or group metadata CRUD
- Ingest telemetry or perform aggregation
- Mutate telemetry, aggregates, or realtime state
- Publish to MQTT, Redis, or realtime streams
- Host backend services or schedulers
- Persist data outside browser storage

---

## 4. Backend Dependencies

### HTTP API
- Base URL:  
  `https://api-semply.semply.cloud/api/v1`
- Authentication:
  - Bearer token provided via runtime configuration
- No direct database access

### WebSocket
- Endpoint:  
  `WEBSOCKET_URL`  
  (default: `wss://api-semply.semply.cloud/websocket/`)
- Authentication:
  - API key via query parameter or header
- Protocol:
  - Action-based messages (e.g. `get_single_site_iot_dashboard`,
    `get_energy_and_saving_single_site`)

### Third-Party APIs
- OpenWeather API
  - Base URL and API key provided via environment/runtime config
  - Read-only usage

---

## 5. Data Consumption Contract

### HTTP Endpoints (Read-Only)

- `GET /site/{siteId}/iot-usage`
- `GET /site/{siteId}/groups`
- `GET /group/{groupId}/iot-usage`

All requests:
- Require bearer authentication
- Return JSON payloads containing:
  - usage summaries
  - group lists
  - timeline values

---

### WebSocket Protocol

- Client connects with:
?key=<apiKey>&type=web
- Receives JSON messages keyed by `action`
- Client filters and renders data by configured `siteId`
- No write or control messages are sent from the client

---

### Weather Data

- `GET` requests to OpenWeather One Call API
- Used for UI enrichment only
- No persistence beyond browser cache

---

## 6. Security & Trust Assumptions

- Relies on bearer token from runtime-config JSON for HTTP calls
- Token is not issued by this repository
- Relies on API key for WebSocket authentication
- Key provided via environment or runtime config
- Treats all backend data as authoritative
- Has no privilege to mutate server state
- Stores no sensitive data beyond provided tokens/keys
- Browser-local caching only

---

**This file is authoritative for `iot-portal`.**  
Any change that grants backend authority or data mutation  
**violates this contract and requires architectural review.**
