"use client";

import { Map, MapMarker, MarkerContent, MarkerTooltip } from "@/components/ui/mapcn-marker-tooltip";

const locations = [
  { id: 1, name: "Empire State Building", lng: -73.9857, lat: 40.7484 },
  { id: 2, name: "Central Park", lng: -73.9654, lat: 40.7829 },
  { id: 3, name: "Times Square", lng: -73.9851, lat: 40.758 },
];

function MarkerTooltipDemo() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center overflow-hidden bg-background p-8 text-foreground">
      <div className="h-[420px] w-full max-w-4xl overflow-hidden rounded-lg border shadow-sm">
        <Map center={[-73.9857, 40.7484]} zoom={11}>
          {locations.map((location) => (
            <MapMarker key={location.id} longitude={location.lng} latitude={location.lat}>
              <MarkerContent>
                <div data-mapcn-marker={location.name} className="size-5 rounded-full border-2 border-white bg-blue-500 shadow-lg transition-transform hover:scale-110" />
              </MarkerContent>
              <MarkerTooltip>{location.name}</MarkerTooltip>
            </MapMarker>
          ))}
        </Map>
      </div>
    </div>
  );
}

export default function MarkerTooltipDefaultDemo() {
  return <MarkerTooltipDemo />;
}

export { MarkerTooltipDefaultDemo };
