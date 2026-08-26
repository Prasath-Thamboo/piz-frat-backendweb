"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register(
      new URL("../lib/service-worker.js", import.meta.url),
      { scope: "/", updateViaCache: "none" }
    );
  }, []);

  return null;
}
