"use client";

import dynamic from "next/dynamic";
import React from "react";

// Cargamos react-leaflet/leaflet sólo en cliente
const LeafletMap = dynamic(() => import("./leaflet-inner"), { ssr: false });

export default function ItineraryMap({
  center,
  zoom = 12,
  coords = [],
  markers = [],
}: {
  center: [number, number];
  zoom?: number;
  coords?: [number, number][];
  markers?: [number, number][];
}) {
  return (
    <LeafletMap center={center} zoom={zoom} coords={coords} markers={markers} />
  );
}
