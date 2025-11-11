"use client";

import { MapContainer, TileLayer, Polyline, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useMemo } from "react";

// Fix default marker in Vite/Next
const markerIcon = new L.Icon.Default();

export default function LeafletInner({
  center, zoom, coords, markers,
}: { center: [number, number]; zoom: number; coords: [number, number][]; markers: [number, number][]; }) {
  const path = useMemo(()=> coords.map(([lat, lng]) => L.latLng(lat, lng)), [coords]);

  return (
    <MapContainer center={center} zoom={zoom} className="w-full h-full">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                 attribution="&copy; OpenStreetMap contributors" />
      {markers.map((m, i)=> <Marker key={i} position={m} icon={markerIcon} />)}
      {path.length >= 2 && <Polyline positions={path} />}
    </MapContainer>
  );
}
