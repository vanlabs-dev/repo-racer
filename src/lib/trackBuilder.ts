/** Generates dense centerline points from straights and circular arcs. */

export interface StraightPrimitive {
  kind: "straight";
  length: number;
  samples: number;
}

export interface TurnPrimitive {
  kind: "turn";
  radius: number;
  angle: number; // degrees
  direction: "left" | "right";
  samples: number;
}

export type Primitive = StraightPrimitive | TurnPrimitive;

export interface TrackSegment {
  name: string;
  steps: Primitive[];
}

export interface SegmentInfo {
  name: string;
  index: number;
  startPoint: number; // index into final points array
  endPoint: number;
  lengthUnits: number;
  netTurnDeg: number;
}

export interface TrackDebugInfo {
  totalPoints: number;
  totalLength: number;
  netTurnDeg: number;
  closureGap: number;
  segments: SegmentInfo[];
}

export class PathBuilder {
  private x: number;
  private z: number;
  private heading: number; // radians: 0=east(+x), π/2=south(+z)
  private pts: [number, number][];
  private segInfos: SegmentInfo[] = [];
  private totalLength = 0;
  private totalTurn = 0;

  constructor(x: number, z: number, headingDeg: number) {
    this.x = x;
    this.z = z;
    this.heading = (headingDeg * Math.PI) / 180;
    this.pts = [[x, z]];
  }

  private addStraight(p: StraightPrimitive): number {
    const dx = Math.cos(this.heading);
    const dz = Math.sin(this.heading);
    for (let i = 1; i <= p.samples; i++) {
      const t = (i / p.samples) * p.length;
      this.pts.push([this.x + dx * t, this.z + dz * t]);
    }
    this.x += dx * p.length;
    this.z += dz * p.length;
    return p.length;
  }

  private addTurn(p: TurnPrimitive): number {
    const angleRad = (p.angle * Math.PI) / 180;
    const sign = p.direction === "right" ? 1 : -1;

    const perpAngle = this.heading + (sign * Math.PI) / 2;
    const cx = this.x + p.radius * Math.cos(perpAngle);
    const cz = this.z + p.radius * Math.sin(perpAngle);
    const startAngle = Math.atan2(this.z - cz, this.x - cx);

    for (let i = 1; i <= p.samples; i++) {
      const sweep = (i / p.samples) * angleRad * sign;
      const a = startAngle + sweep;
      this.pts.push([cx + p.radius * Math.cos(a), cz + p.radius * Math.sin(a)]);
    }

    const endAngle = startAngle + sign * angleRad;
    this.x = cx + p.radius * Math.cos(endAngle);
    this.z = cz + p.radius * Math.sin(endAngle);
    this.heading += sign * angleRad;

    const arcLength = p.radius * angleRad;
    this.totalTurn += sign * p.angle;
    return arcLength;
  }

  addSegment(seg: TrackSegment): this {
    const startPoint = this.pts.length - 1;
    let segLength = 0;
    let segTurn = 0;

    for (const step of seg.steps) {
      if (step.kind === "straight") {
        segLength += this.addStraight(step);
      } else {
        const arcLen = this.addTurn(step);
        segLength += arcLen;
        const sign = step.direction === "right" ? 1 : -1;
        segTurn += sign * step.angle;
      }
    }

    this.totalLength += segLength;
    this.segInfos.push({
      name: seg.name,
      index: this.segInfos.length,
      startPoint,
      endPoint: this.pts.length - 1,
      lengthUnits: segLength,
      netTurnDeg: segTurn,
    });

    return this;
  }

  build(): [number, number][] {
    return this.pts;
  }

  getDebugInfo(): TrackDebugInfo {
    const start = this.pts[0];
    const end = this.pts[this.pts.length - 1];
    const gap = Math.sqrt(
      (end[0] - start[0]) ** 2 + (end[1] - start[1]) ** 2
    );
    return {
      totalPoints: this.pts.length,
      totalLength: this.totalLength,
      netTurnDeg: this.totalTurn,
      closureGap: gap,
      segments: this.segInfos,
    };
  }
}

/** Build centerline points from a track layout. */
export function buildTrackPoints(
  layout: TrackSegment[],
  startX: number = 0,
  startZ: number = 0,
  startHeadingDeg: number = 0
): { points: [number, number][]; debug: TrackDebugInfo } {
  const builder = new PathBuilder(startX, startZ, startHeadingDeg);
  for (const seg of layout) {
    builder.addSegment(seg);
  }
  return {
    points: builder.build(),
    debug: builder.getDebugInfo(),
  };
}
