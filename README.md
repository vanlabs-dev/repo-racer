```
█████ █████ ████   ███
█   █ █     █   █ █   █
█   █ █     █   █ █   █
████  ████  ████  █   █
█ █   █     █     █   █
█  █  █     █     █   █
█   █ █████ █      ███

█████  ███   ████ █████ █████
█   █ █   █ █     █     █   █
█   █ █   █ █     █     █   █
████  █████ █     ████  ████
█ █   █   █ █     █     █ █
█  █  █   █ █     █     █  █
█   █ █   █  ████ █████ █   █
```

Real-time 3D racing visualization of Bittensor subnet performance. Live network metrics drive car speed, handling, and pit strategy on a segment-composed circuit.

## What It Does

Repo Racer fetches live data from the Bittensor network via TaoStats and maps subnet performance metrics to racing attributes:

- **Top speed** — 30-day TAO net flow
- **Acceleration** — 1-day TAO net flow
- **Handling** — 7-day TAO net flow
- **Pit stop efficiency** — GitHub commit frequency (7-day commits via TaoStats dev_activity API)

The root subnet (netuid 0) is excluded. Subnets with price > 1.0 TAO are flagged as INACTIVE and disabled in the selector. Subnets without a registered GitHub repo show a NO REPO badge and are also disabled. Additional market data (price, market cap, emission, fear/greed index, volume, buy/sell counts) is fetched and displayed in the telemetry panel.

Cars race on a parametric circuit with curvature-based racing lines, overtaking logic, and pit lane mechanics. A fixed overhead drone camera frames the full track with an HTML overlay UI.

## Features

### Track & Racing
- Composable track built from predefined segments (straights, bends, corners, chicanes)
- Curvature-aware racing lines with per-car handling variation
- Overtaking and defensive positioning via lateral offsets
- Pit stop zone on secondary straight with smooth lane transitions (dual lateral lerp)
- Dynamic camera framing computed from track bounding box
- Lap count scales with racer count (racers + 1)

### Stall Mechanic
- Cars with all three TAO flow metrics negative are flagged as **stalled**
- Stalled cars crawl at 15% speed with rising smoke effect
- Race ends when all **non-stalled** cars finish — stalled cars are marked DNF
- `stalledDNFs` in raceStore tracks which cars did not finish
- **EmbarrassmentModal** appears before the podium screen, showing each stalled car's 24h/7d/30d TAO flow stats, a DNF badge, and auto-dismisses after 5.5 seconds with an animated progress bar

### Post-Race
- **RaceCompleteModal** with podium layout (P2 left, P1 center, P3 right), medal emojis, and subnet logos loaded via `/api/proxy-image`
- Stat highlights: winner dominance narrative, P2 drama line
- **Share image** generated on a canvas element:
  - 1200×628 PNG for 3+ racers, 800×500 for 2-racer races
  - Pixel block logo header (REPO in amber, RACER in green) rendered via `drawPixelWord()`
  - Podium with P1 glow ring, speed lines, highlight narrative in footer
  - Copies to clipboard via `navigator.clipboard`
- Buttons: Race Again (same grid), Change Grid, Share (with copy feedback), TaoStats (external link to winner's subnet page)

### Visual & UI
- Post-processing: pixelation, bloom, noise, vignette
- **PixelLogo** component: SVG pixel block "REPO RACER" branding with scanline overlay and drop-shadow glow
- Clickable cars and standings with detailed telemetry panel (TAO flow, attributes, market data, metric mapping)
- Grandstand, barriers, gantry arches, billboards, runoff shoulders
- Subnet selector with min 2 / max 8 car selection
- Subnet cards show logo images (from identity API) with colored dot fallback
- Value-based stat bar colors on subnet cards (red/amber/yellow/green by metric strength)
- Status badges: STALL (all flows negative), INACTIVE (price > 1.0 TAO), NO REPO (no GitHub data)
- Loading screen, start sequence countdown, and race finish phases

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **3D:** React Three Fiber + Drei + Three.js + postprocessing
- **State:** Zustand
- **Styling:** Tailwind CSS v4 + Framer Motion
- **Fonts:** Chakra Petch (display), IBM Plex Mono (data)
- **Data:** TaoStats API (server-side proxy with in-memory cache + rate limiting)

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
  app/                    # Next.js pages and API routes
    api/subnets/          # Server-side TaoStats proxy (5-min cache)
    api/proxy-image/      # CORS proxy for subnet logo images (24h cache)
  components/
    canvas/               # 3D scene (R3F components)
      Car.tsx             # Blocky low-poly racer mesh
      CarInstances.tsx    # Racing line, overtaking, positioning, selection highlight
      SmokeEffect.tsx     # Billboarded smoke puffs for stalled cars
      Track.tsx           # Road surface, barriers, pit lane, grandstand
      TrackSurface.tsx    # Ground plane
      Billboard.tsx       # Trackside billboard signs
      CameraRig.tsx       # Fixed overhead drone camera
      Environment.tsx     # Lighting and atmosphere
      PostProcessing.tsx  # Pixelation, bloom, noise, vignette
      RaceScene.tsx       # Top-level R3F canvas (dynamic import, no SSR)
    ui/                   # HTML overlay components
      RaceHUD.tsx         # Standings, race timer, post-race modal orchestration
      TelemetryOverlay.tsx    # Selected car detail panel
      SubnetSelector.tsx      # Subnet picker grid (min 2 / max 8)
      SubnetCard.tsx          # Individual subnet selection card
      RaceCompleteModal.tsx   # Podium, highlights, share image, action buttons
      EmbarrassmentModal.tsx  # Stalled car DNF display with TAO flow stats
      LoadingScreen.tsx       # Initial loading screen with PixelLogo
      PixelLogo.tsx           # SVG pixel block "REPO RACER" branding
      StartSequence.tsx       # Countdown sequence before race
  lib/
    track.ts              # Curve creation, straight detection, reorigin
    trackBuilder.ts       # Geometric path builder (segments → points)
    trackSegments.ts      # Segment library (corners, chicanes, etc.)
    circuits.ts           # Track layout definition
    racingLine.ts         # Curvature computation, lateral offsets
    physics.ts            # Speed calculation, stall detection, pit stop logic
    colors.ts             # Color palette (cassette futurism)
    constants.ts          # Tuning parameters (speed, track, post-processing, API)
    api/taostats.ts       # TaoStats API fetching, merging, rate limiting
  stores/                 # Zustand state
    raceStore.ts          # Race simulation, finish tracking, stalledDNFs
    uiStore.ts            # UI phase, selection, focused car
    trackEditorStore.ts   # Default pre-computed track data
  types/                  # TypeScript interfaces (SubnetData, CarState, AppPhase)
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
