import {
  BASE_SPEED,
  SPEED_MULTIPLIER,
  PITSTOP_DURATION,
  PITSTOP_LAP_INTERVAL,
} from "./constants";
import type { CarState } from "@/types";

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

export function calculateSpeed(
  car: CarState,
  maxTopSpeed: number,
  maxAcceleration: number,
  maxHandling: number,
  raceTime: number,
  curvatureNorm: number
): number {
  if (car.isPitting) return BASE_SPEED * 0.1;

  const topSpeedNorm =
    maxTopSpeed > 0
      ? normalize(Math.abs(car.subnet.topSpeed), 0, Math.abs(maxTopSpeed))
      : 0.5;

  const baseCarSpeed = BASE_SPEED + topSpeedNorm * SPEED_MULTIPLIER;

  // Acceleration ramp-up
  const accelNorm =
    maxAcceleration > 0
      ? normalize(
          Math.abs(car.subnet.acceleration),
          0,
          Math.abs(maxAcceleration)
        )
      : 0.5;
  const rampUp = Math.min(1, raceTime * (0.5 + accelNorm * 1.5));

  // Handling normalized against the field
  const handlingNorm =
    maxHandling > 0
      ? normalize(Math.abs(car.subnet.handling), 0, Math.abs(maxHandling))
      : 0.5;

  // Corner penalty: 35% (worst handling) to 15% (best handling)
  const cornerPenalty = 0.35 - handlingNorm * 0.2;
  const cornerFactor = 1 - curvatureNorm * cornerPenalty;

  // Speed wobble: lower handling = more unsteady
  const unsteadiness = (1 - handlingNorm) * 0.06;
  const wobble =
    1 - unsteadiness * Math.sin(raceTime * 2.5 + car.subnetId * 1.7);

  return baseCarSpeed * rampUp * cornerFactor * wobble;
}

export function shouldPitstop(car: CarState): boolean {
  if (car.currentLap > 0 && car.currentLap % PITSTOP_LAP_INTERVAL === 0) {
    return true;
  }
  return false;
}

export function getPitstopDuration(pitstopRate: number): number {
  const efficiency = Math.max(0.3, Math.min(1, pitstopRate / 80));
  return PITSTOP_DURATION * (1.3 - efficiency);
}
