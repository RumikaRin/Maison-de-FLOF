"use client";

import { MapPin } from "lucide-react";
import { Map, MapMarker, MarkerContent } from "@/components/ui/mapcn-marker-tooltip";

type LocationPreviewMapProps = {
  longitude: number;
  latitude: number;
};

export default function LocationPreviewMap({ longitude, latitude }: LocationPreviewMapProps) {
  return (
    <Map
      viewport={{
        center: [longitude, latitude],
        zoom: 14,
        bearing: 0,
        pitch: 0,
      }}
    >
      <MapMarker longitude={longitude} latitude={latitude}>
        <MarkerContent>
          <div className="flex size-6 items-center justify-center rounded-full border-2 border-white bg-jotun-teal shadow-lg transition-transform hover:scale-110">
            <MapPin className="size-3.5 text-white" />
          </div>
        </MarkerContent>
      </MapMarker>
    </Map>
  );
}
