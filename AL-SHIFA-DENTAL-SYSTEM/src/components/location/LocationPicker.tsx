"use client";

import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Crosshair, Plus, Minus, MapPin } from 'lucide-react';
import { Button } from "@/components/ui/button";

// Fix Leaflet Icons
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
}

// 1. Custom Zoom Controls (Royal Style)
function CustomZoomControl() {
  const map = useMap();
  return (
    <div className="absolute bottom-4 right-4 z-[999] flex flex-col gap-2">
      <Button
        size="icon"
        variant="secondary"
        className="h-10 w-10 rounded-xl bg-white/90 backdrop-blur shadow-lg border border-slate-100 hover:bg-white text-slate-700 transition-all hover:scale-110"
        onClick={(e) => { e.preventDefault(); map.zoomIn(); }}
      >
        <Plus className="h-5 w-5" />
      </Button>
      <Button
        size="icon"
        variant="secondary"
        className="h-10 w-10 rounded-xl bg-white/90 backdrop-blur shadow-lg border border-slate-100 hover:bg-white text-slate-700 transition-all hover:scale-110"
        onClick={(e) => { e.preventDefault(); map.zoomOut(); }}
      >
        <Minus className="h-5 w-5" />
      </Button>
    </div>
  );
}

// 2. Custom "Locate Me" Button
function LocateControl({ onFound }: { onFound: (lat: number, lng: number) => void }) {
  const map = useMap();
  const [loading, setLoading] = useState(false);

  const handleLocate = () => {
    setLoading(true);
    map.locate().on("locationfound", function (e) {
      onFound(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, 15);
      setLoading(false);
    });
  };

  return (
    <div className="absolute top-4 right-4 z-[999]">
      <Button 
        size="sm" 
        onClick={(e) => { e.preventDefault(); handleLocate(); }} 
        className={`shadow-lg border border-cyan-100 text-cyan-700 bg-white/90 backdrop-blur hover:bg-white rounded-xl transition-all ${loading ? 'animate-pulse' : ''}`}
      >
        <Crosshair className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
        {loading ? "Locating..." : "Locate Me"}
      </Button>
    </div>
  );
}

// 3. Click Marker Handler
function LocationMarker({ onSelect, position }: { onSelect: (lat: number, lng: number) => void, position: L.LatLng | null }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return position === null ? null : <Marker position={position} icon={icon}></Marker>;
}

export default function LocationPicker({ onLocationSelect }: LocationPickerProps) {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const defaultCenter = { lat: 25.2048, lng: 55.2708 }; // Default Center

  const handleSelect = (lat: number, lng: number) => {
    setPosition(new L.LatLng(lat, lng));
    onLocationSelect(lat, lng);
  };

  return (
    <div className="relative w-full h-full min-h-[300px] z-0 bg-slate-100">
      <MapContainer 
        center={defaultCenter} 
        zoom={13} 
        zoomControl={false} // 🟢 Disable default ugly controls
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker onSelect={handleSelect} position={position} />
        <CustomZoomControl />
        <LocateControl onFound={handleSelect} />
      </MapContainer>

      {/* Lat/Lng Badge */}
      {position && (
        <div className="absolute top-4 left-4 z-[999] bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl shadow-sm text-[10px] font-mono font-bold text-cyan-800 border border-cyan-100 flex items-center gap-2">
           <MapPin className="h-3 w-3" />
           {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
        </div>
      )}
    </div>
  );
}