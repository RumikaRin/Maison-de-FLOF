"use client";

import { MapPin } from "lucide-react";
import { Map, MapMarker, MarkerContent, MarkerTooltip } from "@/components/ui/mapcn-marker-tooltip";

type DealerMapItem = {
  id: string;
  name: string;
  nameEn: string;
  phone: string;
  address: string;
  addressEn: string;
  lng: number;
  lat: number;
};

type DealerMapProps = {
  dealers: DealerMapItem[];
  language: "vi" | "en";
  viewport: {
    center: [number, number];
    zoom: number;
    bearing: number;
    pitch: number;
  };
};

export default function DealerMap({ dealers, language, viewport }: DealerMapProps) {
  return (
    <Map viewport={viewport}>
      {dealers.map((dealer) => (
        <MapMarker key={dealer.id} longitude={dealer.lng} latitude={dealer.lat}>
          <MarkerContent>
            <div className="flex size-7 items-center justify-center rounded-full border-2 border-white bg-jotun-teal shadow-lg transition-transform hover:scale-110 active:scale-95">
              <MapPin className="size-3.5 text-white" />
            </div>
          </MarkerContent>
          <MarkerTooltip>
            <div className="max-w-[220px] p-2 text-left">
              <p className="mb-1 text-xs font-bold text-warm-900">
                {language === "vi" ? dealer.name : dealer.nameEn || dealer.name}
              </p>
              <p className="mb-1 text-[10px] leading-tight text-warm-600">
                {language === "vi" ? dealer.address : dealer.addressEn || dealer.address}
              </p>
              <p className="font-mono text-[9px] text-warm-500">{dealer.phone}</p>
            </div>
          </MarkerTooltip>
        </MapMarker>
      ))}
    </Map>
  );
}
