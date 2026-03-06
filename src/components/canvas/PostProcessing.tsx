"use client";

import {
  EffectComposer,
  Bloom,
  Noise,
  Vignette,
  Pixelation,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import {
  BLOOM_INTENSITY,
  BLOOM_LUMINANCE_THRESHOLD,
  NOISE_OPACITY,
  VIGNETTE_DARKNESS,
  PIXELATION_GRANULARITY,
} from "@/lib/constants";

export default function PostProcessingEffects() {
  return (
    <EffectComposer>
      <Pixelation granularity={PIXELATION_GRANULARITY} />
      <Bloom
        intensity={BLOOM_INTENSITY}
        luminanceThreshold={BLOOM_LUMINANCE_THRESHOLD}
        luminanceSmoothing={0.4}
        mipmapBlur
      />
      <Noise
        premultiply
        blendFunction={BlendFunction.ADD}
        opacity={NOISE_OPACITY}
      />
      <Vignette darkness={VIGNETTE_DARKNESS} offset={0.35} />
    </EffectComposer>
  );
}
