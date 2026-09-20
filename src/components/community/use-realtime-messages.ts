"use client";

import { useEffect, useState } from "react";

export function useRealtimeMessages(refreshInterval: number = 5000) {
  const [shouldRefresh, setShouldRefresh] = useState(0);

  const triggerRefresh = () => {
    setShouldRefresh(prev => prev + 1);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setShouldRefresh(prev => prev + 1);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  return { shouldRefresh, triggerRefresh };
}
