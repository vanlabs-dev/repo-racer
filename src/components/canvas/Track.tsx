"use client";

import { useMemo } from "react";
import {
  BufferGeometry,
  Float32BufferAttribute,
  Vector3,
  CatmullRomCurve3,
} from "three";
import { TRACK_WIDTH, BARRIER_HEIGHT, GANTRY_COUNT } from "@/lib/constants";
import { findStraights, type StraightSection } from "@/lib/track";
import {
  TRACK_SURFACE,
  TRACK_SURFACE_EDGE,
  TRACK_EDGE,
  TRACK_BARRIER,
  TRACK_MARKING,
  RUNOFF_COLOR,
} from "@/lib/colors";

interface TrackProps {
  curve: CatmullRomCurve3;
}

const SEGMENTS = 256;
const BARRIER_SEGMENTS = 80;

function createRoadGeometry(
  curve: CatmullRomCurve3,
  width: number
): BufferGeometry {
  const points = curve.getSpacedPoints(SEGMENTS);
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const up = new Vector3(0, 1, 0);

  for (let i = 0; i <= SEGMENTS; i++) {
    const p = points[i % points.length];
    const t = i / SEGMENTS;
    const tangent = curve.getTangentAt(t);
    const lateral = new Vector3().crossVectors(tangent, up).normalize();

    vertices.push(p.x - lateral.x * width, p.y, p.z - lateral.z * width);
    vertices.push(p.x + lateral.x * width, p.y, p.z + lateral.z * width);
    uvs.push(0, t * 20, 1, t * 20);
  }

  for (let i = 0; i < SEGMENTS; i++) {
    const a = i * 2;
    const b = i * 2 + 1;
    const c = (i + 1) * 2;
    const d = (i + 1) * 2 + 1;
    indices.push(a, b, c, c, b, d);
  }

  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geo.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function getBarrierData(curve: CatmullRomCurve3, side: 1 | -1) {
  const up = new Vector3(0, 1, 0);
  const data: { pos: [number, number, number]; rotY: number }[] = [];
  const offset = TRACK_WIDTH + 0.6;
  const MIN_SPACING_SQ = 4.0 * 4.0;

  let lastPos: [number, number, number] | null = null;

  for (let i = 0; i < BARRIER_SEGMENTS; i++) {
    const t = i / BARRIER_SEGMENTS;
    const p = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    const lateral = new Vector3().crossVectors(tangent, up).normalize();
    const rotY = Math.atan2(tangent.x, tangent.z);

    const pos: [number, number, number] = [
      p.x + lateral.x * offset * side,
      p.y + BARRIER_HEIGHT / 2,
      p.z + lateral.z * offset * side,
    ];

    // Skip overlapping barriers in tight corners
    if (lastPos) {
      const dx = pos[0] - lastPos[0];
      const dz = pos[2] - lastPos[2];
      if (dx * dx + dz * dz < MIN_SPACING_SQ) continue;
    }

    data.push({ pos, rotY });
    lastPos = pos;
  }
  return data;
}

function getGantryData(curve: CatmullRomCurve3) {
  const data: { pos: Vector3; tangent: Vector3; rotY: number }[] = [];
  for (let i = 0; i < GANTRY_COUNT; i++) {
    const t = (i + 0.5) / GANTRY_COUNT;
    const pos = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    const rotY = Math.atan2(tangent.x, tangent.z);
    data.push({ pos, tangent, rotY });
  }
  return data;
}

// --- Runoff computation ---

const RUNOFF_SEGMENTS = 128;
const MAX_RUNOFF_WIDTH = 4.5;
const RUNOFF_BUFFER = 1.8;
const SKIP_ARC = 18; // samples to skip for local exclusion

function computeRunoffWidths(curve: CatmullRomCurve3): {
  left: number[];
  right: number[];
} {
  const up = new Vector3(0, 1, 0);
  const N = RUNOFF_SEGMENTS;

  // Centerline positions
  const centers: { x: number; z: number }[] = [];
  for (let i = 0; i <= N; i++) {
    const p = curve.getPointAt(i / N);
    centers.push({ x: p.x, z: p.z });
  }

  // Edge positions
  const leftEdges: { x: number; z: number }[] = [];
  const rightEdges: { x: number; z: number }[] = [];

  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const tangent = curve.getTangentAt(t);
    const lx = tangent.z;
    const lz = -tangent.x;
    const len = Math.sqrt(lx * lx + lz * lz) || 1;
    const nx = lx / len;
    const nz = lz / len;

    leftEdges.push({
      x: centers[i].x - nx * TRACK_WIDTH,
      z: centers[i].z - nz * TRACK_WIDTH,
    });
    rightEdges.push({
      x: centers[i].x + nx * TRACK_WIDTH,
      z: centers[i].z + nz * TRACK_WIDTH,
    });
  }

  const leftWidths: number[] = [];
  const rightWidths: number[] = [];

  for (let i = 0; i <= N; i++) {
    let minDistL = Infinity;
    let minDistR = Infinity;

    for (let j = 0; j <= N; j++) {
      // Skip local neighbors (closed curve wrapping)
      let diff = Math.abs(i - j);
      if (diff > N / 2) diff = N - diff;
      if (diff < SKIP_ARC) continue;

      const cx = centers[j].x;
      const cz = centers[j].z;

      const dxL = leftEdges[i].x - cx;
      const dzL = leftEdges[i].z - cz;
      const dL = Math.sqrt(dxL * dxL + dzL * dzL);
      if (dL < minDistL) minDistL = dL;

      const dxR = rightEdges[i].x - cx;
      const dzR = rightEdges[i].z - cz;
      const dR = Math.sqrt(dxR * dxR + dzR * dzR);
      if (dR < minDistR) minDistR = dR;
    }

    // Available space = distance to nearest non-local centerline minus track width and buffer
    leftWidths.push(
      Math.max(0, Math.min(MAX_RUNOFF_WIDTH, minDistL - TRACK_WIDTH - RUNOFF_BUFFER))
    );
    rightWidths.push(
      Math.max(0, Math.min(MAX_RUNOFF_WIDTH, minDistR - TRACK_WIDTH - RUNOFF_BUFFER))
    );
  }

  // Smooth with box filter on closed loop
  return {
    left: smoothWidths(leftWidths, 4),
    right: smoothWidths(rightWidths, 4),
  };
}

function smoothWidths(widths: number[], passes: number): number[] {
  let result = [...widths];
  for (let p = 0; p < passes; p++) {
    const next = [...result];
    const len = result.length;
    for (let i = 0; i < len; i++) {
      const prev = result[(i - 1 + len) % len];
      const curr = result[i];
      const nxt = result[(i + 1) % len];
      next[i] = (prev + curr + nxt) / 3;
    }
    result = next;
  }
  return result;
}

function createRunoffGeometry(
  curve: CatmullRomCurve3,
  side: 1 | -1,
  widths: number[]
): BufferGeometry {
  const up = new Vector3(0, 1, 0);
  const N = widths.length - 1;
  const vertices: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const p = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    const lateral = new Vector3().crossVectors(tangent, up).normalize();

    // Inner edge = road boundary
    const innerX = p.x + lateral.x * TRACK_WIDTH * side;
    const innerZ = p.z + lateral.z * TRACK_WIDTH * side;

    // Outer edge = road boundary + variable runoff width
    const w = widths[i];
    const outerX = innerX + lateral.x * w * side;
    const outerZ = innerZ + lateral.z * w * side;

    vertices.push(innerX, -0.2, innerZ);
    vertices.push(outerX, -0.2, outerZ);
  }

  for (let i = 0; i < N; i++) {
    const a = i * 2;
    const b = i * 2 + 1;
    const c = (i + 1) * 2;
    const d = (i + 1) * 2 + 1;
    indices.push(a, b, c, c, b, d);
  }

  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export default function Track({ curve }: TrackProps) {
  const roadGeo = useMemo(
    () => createRoadGeometry(curve, TRACK_WIDTH),
    [curve]
  );
  const centerLineGeo = useMemo(
    () => createRoadGeometry(curve, 0.08),
    [curve]
  );

  const leftBarriers = useMemo(() => getBarrierData(curve, -1), [curve]);
  const rightBarriers = useMemo(() => getBarrierData(curve, 1), [curve]);
  const gantries = useMemo(() => getGantryData(curve), [curve]);

  // Runoff strips
  const runoffWidths = useMemo(() => computeRunoffWidths(curve), [curve]);
  const leftRunoffGeo = useMemo(
    () => createRunoffGeometry(curve, -1, runoffWidths.left),
    [curve, runoffWidths]
  );
  const rightRunoffGeo = useMemo(
    () => createRunoffGeometry(curve, 1, runoffWidths.right),
    [curve, runoffWidths]
  );

  // Main straight (nearest t=0) for grandstand, furthest straight for pit lane
  const { mainStraight, pitStraight } = useMemo(() => {
    const all = findStraights(curve);
    if (all.length < 2) return { mainStraight: all[0], pitStraight: all[0] };
    // Closest to t=0 = main straight
    const main = all.reduce((best, s) => {
      const d = Math.min(s.tCenter, 1 - s.tCenter);
      const dBest = Math.min(best.tCenter, 1 - best.tCenter);
      return d < dBest ? s : best;
    });
    // Furthest from t=0 = pit lane
    const pit = all.reduce((best, s) => {
      if (s === main) return best;
      const d = Math.min(s.tCenter, 1 - s.tCenter);
      const dBest = Math.min(best.tCenter, 1 - best.tCenter);
      return d > dBest ? s : best;
    }, all.find((s) => s !== main)!);
    return { mainStraight: main, pitStraight: pit };
  }, [curve]);

  // Grandstand position
  const mainRotY = Math.atan2(mainStraight.direction.x, mainStraight.direction.z);
  const mainLength = Math.min(mainStraight.length * 0.8, 55);
  const grandstand = useMemo(() => {
    const standOffset = TRACK_WIDTH + 6;
    const standPos = mainStraight.position
      .clone()
      .add(mainStraight.outsideDir.clone().multiplyScalar(standOffset));
    return { x: standPos.x, z: standPos.z };
  }, [mainStraight]);

  // Pit lane position
  const pitRotY = Math.atan2(pitStraight.direction.x, pitStraight.direction.z);
  const pitLaneOffset = TRACK_WIDTH + 2.8;
  const pitWallOffset = TRACK_WIDTH + 1.0;
  const pitLength = Math.min(pitStraight.length * 0.8, 55);

  const pitLanePos = pitStraight.position
    .clone()
    .add(pitStraight.outsideDir.clone().multiplyScalar(pitLaneOffset));
  const pitWallPos = pitStraight.position
    .clone()
    .add(pitStraight.outsideDir.clone().multiplyScalar(pitWallOffset));

  return (
    <group>
      {/* Main road surface */}
      <mesh geometry={roadGeo} receiveShadow>
        <meshStandardMaterial
          color={TRACK_SURFACE}
          roughness={0.92}
          metalness={0.1}
        />
      </mesh>

      {/* Road edge highlight */}
      <mesh
        geometry={createRoadGeometry(curve, TRACK_WIDTH)}
        position={[0, 0.01, 0]}
      >
        <meshStandardMaterial
          color={TRACK_SURFACE_EDGE}
          roughness={0.9}
          metalness={0.08}
        />
      </mesh>
      <mesh
        geometry={createRoadGeometry(curve, TRACK_WIDTH - 0.5)}
        position={[0, 0.02, 0]}
      >
        <meshStandardMaterial
          color={TRACK_SURFACE}
          roughness={0.92}
          metalness={0.1}
        />
      </mesh>

      {/* Runoff strips */}
      <mesh geometry={leftRunoffGeo} receiveShadow>
        <meshStandardMaterial
          color={RUNOFF_COLOR}
          roughness={0.95}
          metalness={0.03}
        />
      </mesh>
      <mesh geometry={rightRunoffGeo} receiveShadow>
        <meshStandardMaterial
          color={RUNOFF_COLOR}
          roughness={0.95}
          metalness={0.03}
        />
      </mesh>

      {/* Center dashed line */}
      <mesh geometry={centerLineGeo} position={[0, 0.02, 0]}>
        <meshStandardMaterial
          color={TRACK_MARKING}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Barriers */}
      {[...leftBarriers, ...rightBarriers].map((b, i) => (
        <mesh
          key={`barrier-${i}`}
          position={b.pos}
          rotation={[0, b.rotY, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.5, BARRIER_HEIGHT, 2.2]} />
          <meshStandardMaterial
            color={TRACK_BARRIER}
            roughness={0.95}
            metalness={0.05}
          />
        </mesh>
      ))}

      {/* Barrier accent stripes (every 6th) */}
      {[...leftBarriers, ...rightBarriers]
        .filter((_, i) => i % 6 === 0)
        .map((b, i) => (
          <mesh
            key={`stripe-${i}`}
            position={[
              b.pos[0],
              b.pos[1] + BARRIER_HEIGHT / 2 + 0.04,
              b.pos[2],
            ]}
            rotation={[0, b.rotY, 0]}
          >
            <boxGeometry args={[0.55, 0.08, 2.3]} />
            <meshStandardMaterial
              color={TRACK_EDGE}
              emissive={TRACK_EDGE}
              emissiveIntensity={0.4}
              roughness={0.6}
              metalness={0.3}
            />
          </mesh>
        ))}

      {/* Gantry arches */}
      {gantries.map((g, i) => {
        const up = new Vector3(0, 1, 0);
        const lateral = new Vector3()
          .crossVectors(g.tangent, up)
          .normalize();
        const gantrySpan = TRACK_WIDTH + 2.5;

        return (
          <group key={`gantry-${i}`}>
            {[-1, 1].map((side) => (
              <mesh
                key={`pillar-${side}`}
                position={[
                  g.pos.x + lateral.x * gantrySpan * side,
                  g.pos.y + 4,
                  g.pos.z + lateral.z * gantrySpan * side,
                ]}
                rotation={[0, g.rotY, 0]}
                castShadow
              >
                <boxGeometry args={[0.4, 8, 0.4]} />
                <meshStandardMaterial
                  color={TRACK_BARRIER}
                  roughness={0.9}
                  metalness={0.15}
                />
              </mesh>
            ))}
            <mesh
              position={[g.pos.x, g.pos.y + 8, g.pos.z]}
              rotation={[0, g.rotY, 0]}
            >
              <boxGeometry args={[gantrySpan * 2 + 1, 0.3, 0.3]} />
              <meshStandardMaterial
                color={TRACK_BARRIER}
                roughness={0.9}
                metalness={0.15}
              />
            </mesh>
            <mesh
              position={[g.pos.x, g.pos.y + 7.7, g.pos.z]}
              rotation={[0, g.rotY, 0]}
            >
              <boxGeometry args={[gantrySpan * 1.6, 0.1, 0.15]} />
              <meshStandardMaterial
                color={TRACK_EDGE}
                emissive={TRACK_EDGE}
                emissiveIntensity={0.6}
                roughness={0.5}
              />
            </mesh>
          </group>
        );
      })}

      {/* Pit lane surface */}
      <mesh
        position={[pitLanePos.x, 0.02, pitLanePos.z]}
        rotation={[0, pitRotY, 0]}
        receiveShadow
      >
        <boxGeometry args={[3.5, 0.04, pitLength]} />
        <meshStandardMaterial color="#252530" roughness={0.92} metalness={0.08} />
      </mesh>

      {/* Pit wall */}
      <mesh
        position={[pitWallPos.x, 0.5, pitWallPos.z]}
        rotation={[0, pitRotY, 0]}
      >
        <boxGeometry args={[0.3, 1.0, pitLength * 0.9]} />
        <meshStandardMaterial
          color={TRACK_BARRIER}
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      {/* Pit wall accent stripe */}
      <mesh
        position={[pitWallPos.x, 1.05, pitWallPos.z]}
        rotation={[0, pitRotY, 0]}
      >
        <boxGeometry args={[0.35, 0.08, pitLength * 0.88]} />
        <meshStandardMaterial
          color={TRACK_EDGE}
          emissive={TRACK_EDGE}
          emissiveIntensity={0.3}
          roughness={0.6}
          metalness={0.3}
        />
      </mesh>

      {/* Pit entry/exit markers */}
      {[-1, 1].map((end) => {
        const along = (pitLength * 0.42) * end;
        return (
          <mesh
            key={`pit-marker-${end}`}
            position={[
              pitLanePos.x + pitStraight.direction.x * along,
              0.06,
              pitLanePos.z + pitStraight.direction.z * along,
            ]}
            rotation={[0, pitRotY, 0]}
          >
            <boxGeometry args={[4.0, 0.08, 0.4]} />
            <meshStandardMaterial
              color={TRACK_EDGE}
              emissive={TRACK_EDGE}
              emissiveIntensity={0.4}
              roughness={0.6}
            />
          </mesh>
        );
      })}

      {/* Grandstand */}
      <group
        position={[grandstand.x, 0, grandstand.z]}
        rotation={[0, mainRotY, 0]}
      >
        {/* Tiered seating */}
        {[0, 1, 2, 3].map((row) => (
          <mesh
            key={`stand-row-${row}`}
            position={[row * 1.2 - 1.8, row * 0.8 + 0.4, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[1.0, row * 0.8 + 0.8, mainLength * 0.7]} />
            <meshStandardMaterial
              color={row % 2 === 0 ? "#252530" : "#1e1e28"}
              roughness={0.92}
              metalness={0.08}
            />
          </mesh>
        ))}

        {/* Roof canopy */}
        <mesh position={[1.2, 4.0, 0]} castShadow>
          <boxGeometry args={[7, 0.15, mainLength * 0.75]} />
          <meshStandardMaterial
            color="#1a1a24"
            roughness={0.85}
            metalness={0.15}
          />
        </mesh>

        {/* Roof support columns */}
        {[-0.4, 0.35, 0.7].map((frac) => (
          <mesh
            key={`col-${frac}`}
            position={[3.8, 2.0, frac * mainLength * 0.7]}
            castShadow
          >
            <boxGeometry args={[0.25, 4.0, 0.25]} />
            <meshStandardMaterial
              color={TRACK_BARRIER}
              roughness={0.9}
              metalness={0.1}
            />
          </mesh>
        ))}

        {/* Front railing */}
        <mesh position={[-3.0, 1.0, 0]}>
          <boxGeometry args={[0.1, 1.0, mainLength * 0.7]} />
          <meshStandardMaterial
            color={TRACK_BARRIER}
            roughness={0.9}
            metalness={0.15}
          />
        </mesh>

        {/* Railing accent */}
        <mesh position={[-3.0, 1.52, 0]}>
          <boxGeometry args={[0.15, 0.06, mainLength * 0.7]} />
          <meshStandardMaterial
            color={TRACK_EDGE}
            emissive={TRACK_EDGE}
            emissiveIntensity={0.3}
            roughness={0.6}
          />
        </mesh>
      </group>
    </group>
  );
}
