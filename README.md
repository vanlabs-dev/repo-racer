```
 ____                    ____
|  _ \ ___ _ __   ___   |  _ \ __ _  ___ ___ _ __
| |_) / _ \ '_ \ / _ \  | |_) / _` |/ __/ _ \ '__|
|  _ <  __/ |_) | (_) | |  _ < (_| | (_|  __/ |
|_| \_\___| .__/ \___/  |_| \_\__,_|\___\___|_|
           |_|
```

# Repo Racer

Real-time 3D racing visualization of Bittensor subnet performance. Live network metrics drive car speed, handling, and pit strategy on a segment-composed circuit.

## What It Does

Repo Racer fetches live data from the Bittensor network via TaoStats and maps subnet performance metrics to racing attributes:

- **Top speed** — 30-day TAO net flow
- **Acceleration** — 1-day TAO net flow
- **Handling** — 7-day TAO net flow
- **Pit stop efficiency** — GitHub commit frequency (mock data, real integration planned)

Subnets with price > 1.0 TAO and the root subnet (netuid 0) are excluded. Additional market data (price, market cap, emission, fear/greed index, volume, buy/sell counts) is fetched and displayed in the telemetry panel.

Cars race on a parametric circuit with curvature-based racing lines, overtaking logic, and pit lane mechanics. A fixed overhead drone camera frames the full track with an HTML overlay UI.

## Features

- Composable track built from predefined segments (straights, bends, corners, chicanes)
- Curvature-aware racing lines with per-car handling variation
- Overtaking and defensive positioning
- Pit stop zone on secondary straight with smooth lane transitions
- Dynamic camera framing computed from track bounding box
- Post-processing: pixelation, bloom, noise, vignette
- Clickable cars and standings with detailed telemetry panel
- Grandstand, barriers, gantry arches, billboards, runoff shoulders
- Subnet selector with min 2 / max 8 car selection
- Lap count scales with racer count (racers + 1)
- Loading screen, start sequence countdown, and race finish phases

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
git clone https://github.com/vanlabs-dev/repo-racer.git
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
      Billboard.tsx     # Trackside billboard signs
      CameraRig.tsx     # Dynamic overhead drone camera
      Environment.tsx   # Lighting and atmosphere
      PostProcessing.tsx # Pixelation, bloom, noise, vignette
      RaceScene.tsx     # Top-level R3F canvas (dynamic import, no SSR)
      TrackSurface.tsx  # Track surface geometry
    ui/                 # HTML overlay components
      RaceHUD.tsx       # Standings and race info
      TelemetryOverlay.tsx  # Selected car detail panel
      SubnetSelector.tsx    # Subnet picker grid
      SubnetCard.tsx        # Individual subnet selection card
      LoadingScreen.tsx     # Initial loading screen
      StartSequence.tsx     # Countdown sequence before race
  data/
    mockGithub.ts       # Mock GitHub commit data for pit stop metric
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

- Race pacing (base speed, speed multiplier, pit stop duration and interval)
- Track geometry (width, barrier height, gantry count)
- Post-processing parameters (bloom, noise, vignette, pixelation)
- API endpoints and cache duration (5-minute revalidation)

Track layout is defined in `src/lib/circuits.ts` using composable segments from `src/lib/trackSegments.ts`. The `trackEditorStore` provides an alternative layout used for the preview before a race starts.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Ensure `npm run type-check` and `npm run build` pass with zero errors
4. Submit a pull request

## License

MIT
