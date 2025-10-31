import { useEffect, useState } from "react";

export default function useMediaQuery(query) {
  const getMatch = () =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false;

  const [matches, setMatches] = useState(getMatch);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const m = window.matchMedia(query);
    if (m.matches !== matches) setMatches(m.matches);

    const handler = (e) => setMatches(e.matches);
    if (typeof m.addEventListener === "function") {
      m.addEventListener("change", handler);
      return () => m.removeEventListener("change", handler);
    } else if (typeof m.addEventListener === "function") {
      m.addEventListener(handler);
      return () => m.removeEventListener(handler);
    } else {
      m.onchange = handler;
      return () => {
        m.onchange = null;
      };
    }
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  return matches;
}
