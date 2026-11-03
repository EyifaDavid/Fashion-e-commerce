// [NORTH] Reactively follow the OS preference, including changes during a visit.
import { useSyncExternalStore } from "react";

const query = "(prefers-reduced-motion: reduce)";
const snapshot = () => window.matchMedia(query).matches;
const subscribe = (notify) => {
  const media = window.matchMedia(query);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};

export default function useNorthReducedMotion() {
  return useSyncExternalStore(subscribe, snapshot, () => true);
}
