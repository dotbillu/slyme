<div align="center">
  <img
    src="https://slyme.dotbillu.in/slymelogo.png"
    width="60"
    height="60"
  />

  <h1>SLYME</h1>
</div>

**Slyme** is a map-based social ecosystem designed for community engagement. It transforms physical coordinates into digital hubs, allowing users to discover "MapRooms" and local "Gigs" on their map.

---

### The Experience

- **Map-First Discovery**: Navigate through an interactive Leaflet map interface. Discover clusters of activity (gigs), local hangouts(rooms).
- **MapRooms**: Join geo-locked chat rooms to connect with people in specific areas
- **GIGS**: Create or join gigs (tasks/jobs) tied to specific locations with defined rewards and timelines.
- **📱 Core UX**:
  - **Responsive Panels**: Seamless transition between desktop and mobile view.
  - **Deep Linking**: Share rooms or gigs via URL synchronization.
  - **Dark Aesthetic**: A meticulously crafted dark-mode UI using Tailwind CSS 4.
  - 
---

### 🛠 Tech Architecture

#### Frontend
- **Framework**: Next.js 16 (React 19)
- **Styling**: Tailwind CSS 4 + Framer Motion
- **State**: Jotai + Dexie (IndexedDB)
- **Maps**: Leaflet + React Leaflet

#### Backend
- **Runtime**: Node.js / Express
- **Real-time**: Socket.io
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: JWT + Google OAuth 2.0

---

### 🏁 Quick Start

1. **Install**: `pnpm install`
2. **Database**: `pnpm --filter server db:mig`
3. **Dev**: `pnpm dev`

