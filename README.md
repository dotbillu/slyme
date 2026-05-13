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

### ✨ The Experience

- **📍 Map-First Discovery**: Navigate your world through an interactive Leaflet-powered interface. Discover clusters of activity, local hangouts, and active opportunities.
- **🗨️ Dynamic MapRooms**: Join geo-locked chat rooms to connect with people in specific areas. Features rich real-time messaging with status tracking and media support.
- **💼 The Gig Engine**: A localized economy at your fingertips. Create or fulfill gigs (tasks/jobs) tied to specific locations with defined rewards and timelines.
- **📱 Core UX**:
  - **Responsive Panels**: Seamless transition between desktop sidebars and mobile bottom sheets (Drawers).
  - **Deep Linking**: Share specific rooms or gigs via URL synchronization.
  - **Fluid Motion**: Powered by Framer Motion for a premium, app-like feel.
  - **Dark Aesthetic**: A meticulously crafted dark-mode-first UI using Tailwind CSS 4.

---

### 🛠 Tech Architecture

#### Frontend
- **Framework**: Next.js 16 (React 19)
- **Styling**: Tailwind CSS 4 + Framer Motion
- **State**: Jotai + Dexie (IndexedDB for offline-first capabilities)
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

---

### 👤 Contact & Developer

Developed with ❤️ by **Abhay**.

🔗 **Portfolio**: [dotbillu.in](https://dotbillu.in)  
📧 **Email**: [abhay@dotbillu.in](mailto:abhay@dotbillu.in)

---
*Slyme — Your world, connected.*
