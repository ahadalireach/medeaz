"use client";

import { ReactLenis } from "@studio-freight/react-lenis";

export function LenisProvider({ children }: { children: React.ReactNode }) {
  // Cast needed: @studio-freight/react-lenis bundles its own @types/react which
  // predates React 19's addition of `bigint` to ReactNode, causing a type mismatch.
  return (
    <ReactLenis root options={{ lerp: 0.05, duration: 1.5, smoothWheel: true }}>
      {children as any}
    </ReactLenis>
  );
}
