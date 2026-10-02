# Oil Supply & Delivery Management System (Frontend)

Next.js enterprise web application for the Oil Supply & Delivery Management Platform, featuring real-time telematics dispatch radar, automated petroleum tax invoicing, e-POD compliance, and AI-driven inventory forecasting.

---

## Core Capabilities & Features

### 1. Automated Petroleum Tax Invoicing & Bill of Lading (BOL)
- Generates official petroleum tax invoices and e-POD Bills of Lading formatted to international standards (ISO 9001:2015 & OIML R 117-1).
- Itemizes base barrel volume, HazMat handling surcharges, and energy VAT with dual-signature custody transfer verification.
- Direct native browser PDF printing and digital record archiving.

### 2. Live Fleet GPS Radar & IoT Telematics Monitoring
- Interactive multi-layer Leaflet GIS tracking with depot-to-destination corridor routing.
- Real-time IoT sensor telemetry strip displaying:
  - Road tanker speed (KM/H) & remaining ETA.
  - Cargo fuel temperature in Celsius with thermal stability status.
  - Vessel tank pressure (Bar) and digital Coriolis flowmeter rate (LPM).
  - Tanker ullage fill percentage.

### 3. Cryptographic Audit Trail & Compliance Ledger
- Real-time client ledger displaying SHA-256 block-linked transaction logs.
- Immutable logging of SAGA 2-Phase commits, e-POD PIN match events, and HazMat tanker inspection clearances.

### 4. AI Predictive Fuel Inventory & Smart Replenishment Engine
- Live depot burn-rate monitor calculating daily retail consumption, seasonality factors, and Platts pricing trends.
- Automated safety-threshold alert with 1-click wholesale refinery procurement reordering.

### 5. Multi-Role RBAC Dashboard
- Dedicated role workflows for **Customers**, **Dealers**, **Suppliers**, **Delivery Personnel**, and **Admins**.
- Real-time Pusher chat and non-user automated support response pipeline.

---

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Production build validation
npm run build
```

---

## Environment Variables

Create `.env.local` based on `.env.example`:

```env
NEXT_PUBLIC_API_ENDPOINT=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:5000
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
NEXT_PUBLIC_PUSHER_CLUSTER=ap1
```
