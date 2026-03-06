import { create } from "zustand";
import { CatmullRomCurve3 } from "three";
import type { CarState, SubnetData } from "@/types";
import { createTrackCurve, getCarTransform, reoriginCurve, findStraights } from "@/lib/track";
import {
  computeRacingLine,
  getCurvatureAt,
  type RacingLineData,
} from "@/lib/racingLine";
import {
  calculateSpeed,
  shouldPitstop,
  getPitstopDuration,
} from "@/lib/physics";
import { getLapCount } from "@/lib/constants";

interface RaceStore {
  cars: CarState[];
  raceTime: number;
  isRunning: boolean;
  leaderboard: number[];
  curve: CatmullRomCurve3 | null;
  pitZoneT: number;
  pitZoneRadius: number;
  racingLine: RacingLineData | null;
  isFinished: boolean;
  lapCount: number;
  initRace: (subnets: SubnetData[], customPoints?: [number, number][]) => void;
  tick: (delta: number) => void;
  startRace: () => void;
  resetRace: () => void;
}

export const useRaceStore = create<RaceStore>((set, get) => ({
  cars: [],
  raceTime: 0,
  isRunning: false,
  leaderboard: [],
  curve: null,
  pitZoneT: 0.5,
  pitZoneRadius: 0.03,
  racingLine: null,
  isFinished: false,
  lapCount: 3,

  initRace: (subnets, customPoints?) => {
    // Build curve, re-origin so t=0 is mid-longest-straight
    const rawCurve = createTrackCurve(customPoints);
    const { curve } = reoriginCurve(rawCurve);
    const racingLine = computeRacingLine(curve);
    const lapCount = getLapCount(subnets.length);

    // Pit lane straight (furthest from t=0)
    const straights = findStraights(curve);
    const pitStraight = straights.length > 1
      ? straights.reduce((best, s) => {
          const d = Math.min(s.tCenter, 1 - s.tCenter);
          const dBest = Math.min(best.tCenter, 1 - best.tCenter);
          return d > dBest ? s : best;
        }, straights[0])
      : straights[0];
    const pitZoneT = pitStraight.tCenter;
    const pitZoneRadius = (pitStraight.length / curve.getLength()) * 0.4;

    const cars: CarState[] = subnets.map((subnet, i) => {
      const startProgress = -(i * 0.005);
      const transform = getCarTransform(curve, startProgress);
      return {
        subnetId: subnet.netuid,
        progress: startProgress,
        speed: 0,
        currentLap: 0,
        isPitting: false,
        needsPit: false,
        pittingTimer: 0,
        position: [
          transform.position.x,
          transform.position.y,
          transform.position.z,
        ],
        rotation: [0, 0, 0, 1],
        subnet,
      };
    });

    set({
      cars,
      curve,
      pitZoneT,
      pitZoneRadius,
      racingLine,
      lapCount,
      raceTime: 0,
      isRunning: false,
      isFinished: false,
      leaderboard: cars.map((c) => c.subnetId),
    });
  },

  tick: (delta) => {
    const state = get();
    if (!state.isRunning || state.isFinished || !state.curve || !state.racingLine)
      return;

    const newRaceTime = state.raceTime + delta;

    const maxTopSpeed = Math.max(
      ...state.cars.map((c) => Math.abs(c.subnet.topSpeed)),
      1
    );
    const maxAcceleration = Math.max(
      ...state.cars.map((c) => Math.abs(c.subnet.acceleration)),
      1
    );
    const maxHandling = Math.max(
      ...state.cars.map((c) => Math.abs(c.subnet.handling)),
      1
    );

    let raceFinished = false;

    const updatedCars = state.cars.map((car) => {
      const updated = { ...car };

      if (updated.isPitting) {
        updated.pittingTimer -= delta;
        if (updated.pittingTimer <= 0) {
          updated.isPitting = false;
          updated.pittingTimer = 0;
        }
      }

      // Corner speed adjustment based on curvature
      const curvature = getCurvatureAt(state.racingLine!, updated.progress);
      const curvatureNorm =
        Math.abs(curvature) / state.racingLine!.maxAbsCurvature;

      const speed = calculateSpeed(
        updated,
        maxTopSpeed,
        maxAcceleration,
        maxHandling,
        newRaceTime,
        curvatureNorm
      );
      updated.speed = speed;
      updated.progress += speed * delta;

      if (updated.progress >= 1) {
        updated.currentLap += 1;
        updated.progress -= 1;

        if (updated.currentLap >= state.lapCount) {
          raceFinished = true;
        } else if (shouldPitstop(updated)) {
          // Flag for pit on next zone entry
          updated.needsPit = true;
        }
      }

      // Trigger pit stop in zone
      if (updated.needsPit && !updated.isPitting) {
        const t = ((updated.progress % 1) + 1) % 1;
        let dist = Math.abs(t - state.pitZoneT);
        if (dist > 0.5) dist = 1 - dist;
        if (dist < state.pitZoneRadius) {
          updated.isPitting = true;
          updated.needsPit = false;
          updated.pittingTimer = getPitstopDuration(updated.subnet.pitstopRate);
        }
      }

      const transform = getCarTransform(state.curve!, updated.progress);
      updated.position = [
        transform.position.x,
        transform.position.y,
        transform.position.z,
      ];

      return updated;
    });

    const leaderboard = [...updatedCars]
      .sort((a, b) => {
        if (b.currentLap !== a.currentLap) return b.currentLap - a.currentLap;
        return b.progress - a.progress;
      })
      .map((c) => c.subnetId);

    set({
      cars: updatedCars,
      raceTime: newRaceTime,
      leaderboard,
      isFinished: raceFinished,
      isRunning: !raceFinished,
    });
  },

  startRace: () => set({ isRunning: true }),

  resetRace: () =>
    set({
      cars: [],
      raceTime: 0,
      isRunning: false,
      isFinished: false,
      lapCount: 3,
      leaderboard: [],
      curve: null,
      racingLine: null,
    }),
}));
