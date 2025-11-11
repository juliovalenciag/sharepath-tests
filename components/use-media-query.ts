"use client";

import * as React from "react";

export default function useMediaQuery(query: string) {
  const getMatch = React.useCallback(
    () =>
      typeof window !== "undefined" ? window.matchMedia(query).matches : false,
    [query]
  );

  const [matches, setMatches] = React.useState<boolean>(getMatch);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, [query]);

  return matches;
}
