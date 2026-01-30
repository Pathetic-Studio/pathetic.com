"use client";

import dynamic from "next/dynamic";

const StudioClient = dynamic(() => import("./studio-client"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
        color: "#666",
      }}
    >
      Loading studio...
    </div>
  ),
});

export default function StudioWrapper() {
  return <StudioClient />;
}
