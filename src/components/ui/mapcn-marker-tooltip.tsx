"use client";

import MapLibreGL, { type MarkerOptions, type PopupOptions } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapPinOff } from "lucide-react";
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

function cn(...inputs: Array<string | false | null | undefined>) {
  return inputs.filter(Boolean).join(" ");
}

const defaultStyles = {
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
};

type Theme = "light" | "dark";

type MapViewport = {
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
};

type MapStyleOption = string | MapLibreGL.StyleSpecification;
type MapRef = MapLibreGL.Map;

type MapContextValue = {
  map: MapLibreGL.Map | null;
  isLoaded: boolean;
};

const MapContext = createContext<MapContextValue | null>(null);

function isWebGLSupported(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    return Boolean(gl);
  } catch {
    return false;
  }
}

function getDocumentTheme(): Theme | null {
  if (typeof document === "undefined") return null;
  if (document.documentElement.classList.contains("dark")) return "dark";
  if (document.documentElement.classList.contains("light")) return "light";
  return null;
}

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function useResolvedTheme(themeProp?: Theme): Theme {
  const [detectedTheme, setDetectedTheme] = useState<Theme>(() => getDocumentTheme() ?? getSystemTheme());

  useEffect(() => {
    if (themeProp) return;
    const observer = new MutationObserver(() => {
      const docTheme = getDocumentTheme();
      if (docTheme) setDetectedTheme(docTheme);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = (event: MediaQueryListEvent) => {
      if (!getDocumentTheme()) setDetectedTheme(event.matches ? "dark" : "light");
    };
    mediaQuery.addEventListener("change", handleSystemChange);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", handleSystemChange);
    };
  }, [themeProp]);

  return themeProp ?? detectedTheme;
}

function useMap() {
  const context = useContext(MapContext);
  if (!context) throw new Error("useMap must be used within a Map component");
  return context;
}

type MapProps = {
  children?: ReactNode;
  className?: string;
  theme?: Theme;
  styles?: { light?: MapStyleOption; dark?: MapStyleOption };
  viewport?: Partial<MapViewport>;
  onViewportChange?: (viewport: MapViewport) => void;
  loading?: boolean;
} & Omit<MapLibreGL.MapOptions, "container" | "style">;

function DefaultLoader() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-xs">
      <div className="flex gap-1">
        <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground/60" />
        <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground/60 [animation-delay:150ms]" />
        <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground/60 [animation-delay:300ms]" />
      </div>
    </div>
  );
}

function getViewport(map: MapLibreGL.Map): MapViewport {
  const center = map.getCenter();
  return {
    center: [center.lng, center.lat],
    zoom: map.getZoom(),
    bearing: map.getBearing(),
    pitch: map.getPitch(),
  };
}

const Map = forwardRef<MapRef, MapProps>(function Map(
  { children, className, theme: themeProp, styles, viewport, onViewportChange, loading = false, ...props },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<MapLibreGL.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isStyleLoaded, setIsStyleLoaded] = useState(false);
  const [webglError, setWebglError] = useState<string | null>(null);
  const styleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const internalUpdateRef = useRef(false);
  const resolvedTheme = useResolvedTheme(themeProp);
  const onViewportChangeRef = useRef(onViewportChange);
  onViewportChangeRef.current = onViewportChange;

  const mapStyles = useMemo(
    () => ({ dark: styles?.dark ?? defaultStyles.dark, light: styles?.light ?? defaultStyles.light }),
    [styles],
  );

  useImperativeHandle(ref, () => mapInstance as MapLibreGL.Map, [mapInstance]);

  const clearStyleTimeout = useCallback(() => {
    if (styleTimeoutRef.current) {
      clearTimeout(styleTimeoutRef.current);
      styleTimeoutRef.current = null;
    }
  }, []);
  const initialOptionsRef = useRef({ mapStyles, props, resolvedTheme, viewport });

  useEffect(() => {
    if (!containerRef.current) return;

    if (
      !isWebGLSupported() ||
      (typeof (MapLibreGL as any).supported === "function" &&
        !(MapLibreGL as any).supported({ failIfMajorPerformanceCaveat: false }))
    ) {
      setWebglError("Trình duyệt không hỗ trợ hoặc đang tắt WebGL.");
      return;
    }

    const initialOptions = initialOptionsRef.current;
    let map: MapLibreGL.Map;
    try {
      map = new MapLibreGL.Map({
        container: containerRef.current,
        style: initialOptions.resolvedTheme === "dark" ? initialOptions.mapStyles.dark : initialOptions.mapStyles.light,
        renderWorldCopies: false,
        attributionControl: { compact: true },
        ...initialOptions.props,
        ...initialOptions.viewport,
      });
    } catch (err: any) {
      console.warn("MapLibreGL WebGL context initialization failed:", err);
      setWebglError(err?.message || "Không thể khởi tạo WebGL context.");
      return;
    }

    const styleDataHandler = () => {
      clearStyleTimeout();
      styleTimeoutRef.current = setTimeout(() => setIsStyleLoaded(true), 100);
    };
    const loadHandler = () => setIsLoaded(true);
    const moveHandler = () => {
      if (!internalUpdateRef.current) onViewportChangeRef.current?.(getViewport(map));
    };

    map.on("load", loadHandler);
    map.on("styledata", styleDataHandler);
    map.on("move", moveHandler);
    setMapInstance(map);

    const container = containerRef.current;
    const handleWheel = (e: WheelEvent) => {
      // Isolate map zooming from page scrolling:
      // MapLibre processes zoom on canvas. Stopping propagation here prevents
      // the wheel event from bubbling to window / Lenis, which would scroll the webpage.
      e.stopPropagation();
    };
    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
      clearStyleTimeout();
      try {
        map.off("load", loadHandler);
        map.off("styledata", styleDataHandler);
        map.off("move", moveHandler);
        map.remove();
      } catch {
        // Safe disposal if context was already lost
      }
      setMapInstance(null);
      setIsLoaded(false);
      setIsStyleLoaded(false);
    };
  }, [clearStyleTimeout]);

  useEffect(() => {
    if (!mapInstance) return;
    const nextStyle = resolvedTheme === "dark" ? mapStyles.dark : mapStyles.light;
    setIsStyleLoaded(false);
    mapInstance.setStyle(nextStyle);
  }, [resolvedTheme, mapStyles, mapInstance]);

  useEffect(() => {
    if (!mapInstance || !viewport) return;

    const currentCenter = mapInstance.getCenter();
    const currentZoom = mapInstance.getZoom();
    const targetCenter = viewport.center;
    const targetZoom = viewport.zoom;

    const isSameCenter = targetCenter &&
      Math.abs(currentCenter.lng - targetCenter[0]) < 0.0001 &&
      Math.abs(currentCenter.lat - targetCenter[1]) < 0.0001;
    const isSameZoom = targetZoom === undefined || Math.abs(currentZoom - targetZoom) < 0.1;

    if (isSameCenter && isSameZoom) return;

    internalUpdateRef.current = true;
    mapInstance.flyTo({
      center: targetCenter,
      zoom: targetZoom,
      bearing: viewport.bearing,
      pitch: viewport.pitch,
      duration: 1200,
      essential: true
    });

    const moveEndHandler = () => {
      internalUpdateRef.current = false;
      mapInstance.off("moveend", moveEndHandler);
    };
    mapInstance.on("moveend", moveEndHandler);
  }, [mapInstance, viewport]);

  const contextValue = useMemo(() => ({ map: mapInstance, isLoaded: isLoaded && isStyleLoaded }), [mapInstance, isLoaded, isStyleLoaded]);

  if (webglError) {
    return (
      <div className={cn("relative flex h-full min-h-[360px] w-full flex-col items-center justify-center rounded-control border border-atelier-rule bg-atelier-paper-2 p-fl-lg text-center", className)}>
        <div className="mb-fl-sm flex h-12 w-12 items-center justify-center rounded-full bg-atelier-espresso/10 text-atelier-ink">
          <MapPinOff className="h-6 w-6 text-atelier-ink-2" aria-hidden="true" />
        </div>
        <h3 className="fl-display text-fl-lg font-medium text-atelier-ink">
          Không thể hiển thị bản đồ WebGL
        </h3>
        <p className="mt-fl-2xs max-w-md text-fl-sm text-atelier-ink-2 leading-relaxed">
          Trình duyệt đang tắt tăng tốc đồ họa phần cứng hoặc môi trường không hỗ trợ WebGL. Bạn vẫn có thể xem danh sách đại lý và thông tin liên hệ đầy đủ ở cột bên cạnh.
        </p>
        <p className="mt-fl-xs text-fl-2xs text-atelier-ink-3">
          Gợi ý: Bật &quot;Use graphics acceleration when available&quot; trong Cài đặt trình duyệt rồi tải lại trang.
        </p>
      </div>
    );
  }

  return (
    <MapContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        data-lenis-prevent
        className={cn("relative h-full w-full overscroll-contain", className)}
      >
        {(!isLoaded || loading) && <DefaultLoader />}
        {mapInstance && children}
      </div>
    </MapContext.Provider>
  );
});

type MarkerContextValue = {
  marker: MapLibreGL.Marker;
  map: MapLibreGL.Map | null;
};

const MarkerContext = createContext<MarkerContextValue | null>(null);

function useMarkerContext() {
  const context = useContext(MarkerContext);
  if (!context) throw new Error("Marker components must be used within MapMarker");
  return context;
}

type MapMarkerProps = {
  longitude: number;
  latitude: number;
  children: ReactNode;
  onClick?: (event: MouseEvent) => void;
  onMouseEnter?: (event: MouseEvent) => void;
  onMouseLeave?: (event: MouseEvent) => void;
  onDragStart?: (lngLat: { lng: number; lat: number }) => void;
  onDrag?: (lngLat: { lng: number; lat: number }) => void;
  onDragEnd?: (lngLat: { lng: number; lat: number }) => void;
} & Omit<MarkerOptions, "element">;

function MapMarker({ longitude, latitude, children, onClick, onMouseEnter, onMouseLeave, onDragStart, onDrag, onDragEnd, draggable = false, ...markerOptions }: MapMarkerProps) {
  const { map } = useMap();
  const callbacksRef = useRef({ onClick, onMouseEnter, onMouseLeave, onDragStart, onDrag, onDragEnd });
  callbacksRef.current = { onClick, onMouseEnter, onMouseLeave, onDragStart, onDrag, onDragEnd };
  const initialMarkerOptionsRef = useRef({ draggable, latitude, longitude, markerOptions });

  const marker = useMemo(() => {
    const initialOptions = initialMarkerOptionsRef.current;
    const markerInstance = new MapLibreGL.Marker({
      ...initialOptions.markerOptions,
      element: document.createElement("div"),
      draggable: initialOptions.draggable,
    }).setLngLat([initialOptions.longitude, initialOptions.latitude]);
    const handleClick = (event: MouseEvent) => callbacksRef.current.onClick?.(event);
    const handleMouseEnter = (event: MouseEvent) => callbacksRef.current.onMouseEnter?.(event);
    const handleMouseLeave = (event: MouseEvent) => callbacksRef.current.onMouseLeave?.(event);
    markerInstance.getElement()?.addEventListener("click", handleClick);
    markerInstance.getElement()?.addEventListener("mouseenter", handleMouseEnter);
    markerInstance.getElement()?.addEventListener("mouseleave", handleMouseLeave);
    markerInstance.on("dragstart", () => {
      const lngLat = markerInstance.getLngLat();
      callbacksRef.current.onDragStart?.({ lng: lngLat.lng, lat: lngLat.lat });
    });
    markerInstance.on("drag", () => {
      const lngLat = markerInstance.getLngLat();
      callbacksRef.current.onDrag?.({ lng: lngLat.lng, lat: lngLat.lat });
    });
    markerInstance.on("dragend", () => {
      const lngLat = markerInstance.getLngLat();
      callbacksRef.current.onDragEnd?.({ lng: lngLat.lng, lat: lngLat.lat });
    });
    return markerInstance;
  }, []);

  useEffect(() => {
    // Force sync marker to map instance
    if (!map) return;
    marker.addTo(map);
    return () => {
      marker.remove();
    };
  }, [map, marker]);

  if (marker.getLngLat().lng !== longitude || marker.getLngLat().lat !== latitude) marker.setLngLat([longitude, latitude]);
  if (marker.isDraggable() !== draggable) marker.setDraggable(draggable);

  return <MarkerContext.Provider value={{ marker, map }}>{children}</MarkerContext.Provider>;
}

type MarkerContentProps = {
  children?: ReactNode;
  className?: string;
};

function MarkerContent({ children, className }: MarkerContentProps) {
  const { marker } = useMarkerContext();
  return createPortal(
    <div className={cn("relative cursor-pointer", className)}>{children || <DefaultMarkerIcon />}</div>,
    marker.getElement(),
  );
}

function DefaultMarkerIcon() {
  return <div className="relative h-4 w-4 rounded-full border-2 border-white bg-blue-500 shadow-lg" />;
}

type MarkerTooltipProps = {
  children: ReactNode;
  className?: string;
} & Omit<PopupOptions, "className" | "closeButton" | "closeOnClick">;

function MarkerTooltip({ children, className, ...popupOptions }: MarkerTooltipProps) {
  const { marker, map } = useMarkerContext();
  const container = useMemo(() => document.createElement("div"), []);
  const prevTooltipOptions = useRef(popupOptions);
  const initialPopupOptionsRef = useRef(popupOptions);
  const tooltip = useMemo(() => {
    return new MapLibreGL.Popup({ offset: 16, ...initialPopupOptionsRef.current, closeOnClick: true, closeButton: false }).setMaxWidth("none");
  }, []);

  useEffect(() => {
    if (!map) return;
    tooltip.setDOMContent(container);
    const handleMouseEnter = () => tooltip.setLngLat(marker.getLngLat()).addTo(map);
    const handleMouseLeave = () => tooltip.remove();
    marker.getElement()?.addEventListener("mouseenter", handleMouseEnter);
    marker.getElement()?.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      marker.getElement()?.removeEventListener("mouseenter", handleMouseEnter);
      marker.getElement()?.removeEventListener("mouseleave", handleMouseLeave);
      tooltip.remove();
    };
  }, [container, map, marker, tooltip]);

  if (tooltip.isOpen()) {
    const prev = prevTooltipOptions.current;
    if (prev.offset !== popupOptions.offset) tooltip.setOffset(popupOptions.offset ?? 16);
    if (prev.maxWidth !== popupOptions.maxWidth && popupOptions.maxWidth) tooltip.setMaxWidth(popupOptions.maxWidth ?? "none");
    prevTooltipOptions.current = popupOptions;
  }

  return createPortal(
    <div className={cn("pointer-events-none rounded-md bg-foreground px-2 py-1 text-xs text-balance text-background shadow-md animate-in fade-in-0 zoom-in-95 duration-200 ease-out", className)}>
      {children}
    </div>,
    container,
  );
}

type MarkerLabelProps = {
  children: ReactNode;
  className?: string;
  position?: "top" | "bottom";
};

function MarkerLabel({ children, className, position = "top" }: MarkerLabelProps) {
  const positionClasses = { top: "bottom-full mb-1", bottom: "top-full mt-1" };
  return (
    <div className={cn("absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium text-foreground", positionClasses[position], className)}>
      {children}
    </div>
  );
}

export { Map, useMap, MapMarker, MarkerContent, MarkerTooltip, MarkerLabel };
