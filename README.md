```
 ____                    ____
|  _ \ ___ _ __   ___   |  _ \ __ _  ___ ___ _ __
| |_) / _ \ '_ \ / _ \  | |_) / _` |/ __/ _ \ '__|
|  _ <  __/ |_) | (_) | |  _ < (_| | (_|  __/ |
|_| \_\___| .__/ \___/  |_| \_\__,_|\___\___|_|
           |_|
```

# Repo Racer

Real-time 3D racing visualization of Bittensor subnet performance. Live network metrics drive car speed, handling, and pit strategy on a procedurally generated circuit.

## What It Does

Repo Racer fetches live data from the Bittensor network via TaoStats and maps subnet performance metrics to racing attributes:

- **Top speed** — 30-day TAO net flow
- **Acceleration** — 1-day TAO net flow
- **Handling** — 7-day TAO net flow
- **Pit stop efficiency** — GitHub commit frequency (mock data, real integration planned)

Cars race on a parametric circuit with curvature-based racing lines, overtaking logic, and pit lane mechanics. The overhead drone camera shows the full track with a retro terminal-style UI overlay.

## Features

- Procedural track generation from composable segments (straights, turns, chicanes)
- Curvature-aware racing lines with per-car handling variation
- Overtaking and defensive positioning
- Pit stop zone on secondary straight with smooth lane transitions
- Dynamic camera framing based on track bounding box
- Post-processing: pixelation, bloom, film grain, vignette
- Clickable cars and standings with detailed telemetry panel
- Grandstand, barriers, gantries, billboards, runoff shoulders

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **3D:** React Three Fiber + Drei + Three.js + postprocessing
- **State:** Zustand
- **Styling:** Tailwind CSS v4 + Framer Motion
- **Fonts:** Chakra Petch (display), IBM Plex Mono (data)
- **Data:** TaoStats API (server-side proxy)

## Getting Started

### Prerequisites

- Node.js 18+
- A TaoStats API key ([taostats.io](https://taostats.io))

### Setup

```bash
git clone https://github.com/your-org/repo-racer.git
cd repo-racer
npm install
cp .env.example .env
```

Add your TaoStats API key to `.env`:

```
TAOSTATS_API_KEY=your_key_here
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
npm start
```

### Quality Checks

```bash
npm run type-check   # TypeScript strict mode
npm run lint         # ESLint
```

## Project Structure

```
src/
  app/                  # Next.js pages and API routes
    api/subnets/        # Server-side TaoStats proxy
  components/
    canvas/             # 3D scene (R3F components)
      Car.tsx           # Blocky racer mesh
      CarInstances.tsx  # Racing line, overtaking, positioning
      Track.tsx         # Road surface, barriers, pit lane, grandstand
      CameraRig.tsx     # Dynamic drone camera
      Environment.tsx   # Lighting and atmosphere
      PostProcessing.tsx
    ui/                 # HTML overlay components
      RaceHUD.tsx       # Standings and race info
      TelemetryOverlay.tsx  # Selected car detail panel
      SubnetSelector.tsx    # Subnet picker grid
  lib/
    track.ts            # Curve creation, straight detection, reorigin
    trackBuilder.ts     # Geometric path builder
    trackSegments.ts    # Segment library (corners, chicanes, etc.)
    circuits.ts         # Track layout definition
    racingLine.ts       # Curvature computation
    physics.ts          # Speed calculation, pit stop logic
    colors.ts           # Color palette
    constants.ts        # Tuning parameters
    api/taostats.ts     # API data fetching and mapping
  stores/               # Zustand state
    raceStore.ts        # Race simulation and car state
    uiStore.ts          # UI phase and selection
    trackEditorStore.ts # Default track data
  types/                # TypeScript interfaces
```

## Configuration

All tuning constants live in `src/lib/constants.ts`:

- Race pacing (base speed, speed multiplier, lap count)
- Track geometry (width, barrier height, gantry count)
- Post-processing parameters
- API endpoints and cache duration

Track layout is defined in `src/lib/circuits.ts` using composable segments from `src/lib/trackSegments.ts`.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Ensure `npm run type-check` and `npm run build` pass with zero errors
4. Submit a pull request

## License

MIT
