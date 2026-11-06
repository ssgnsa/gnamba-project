import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const escapeHtml = (s: string): string =>
  s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );

export interface LeafletMapProps {
  latitude: number;
  longitude: number;
  name: string;
  address: string;
  phone: string;
  directionsUrl: string;
  className?: string;
  height?: number;
}

export function LeafletMap({
  latitude,
  longitude,
  name,
  address,
  phone,
  directionsUrl,
  className,
  height,
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [responsiveHeight, setResponsiveHeight] = useState<number>(
    height ?? 300
  );

  useEffect(() => {
    if (height !== undefined) {
      setResponsiveHeight(height);
      return;
    }
    const update = () =>
      setResponsiveHeight(window.innerWidth < 768 ? 300 : 450);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [height]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          obs.disconnect();
        }
      },
      { root: null, rootMargin: "0px", threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || !containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [latitude, longitude],
      zoom: 15,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([latitude, longitude], {
      title: name,
      riseOnHover: true,
      alt: `${name} — ${address}`,
    }).addTo(map);

    const popupHtml = `
      <div style="min-width:220px">
        <h4 style="margin:0 0 8px;font-weight:600">${escapeHtml(name)}</h4>
        <p style="margin:0 0 4px"><strong>Adresse :</strong> ${escapeHtml(address)}</p>
        <p style="margin:0 0 8px"><strong>Téléphone :</strong> ${escapeHtml(phone)}</p>
        <a href="${escapeHtml(directionsUrl)}" target="_blank" rel="noopener noreferrer" style="color:#0284c7;font-weight:600">Itinéraire</a>
      </div>
    `;
    marker.bindPopup(popupHtml);

    const markerEl = marker.getElement();
    if (markerEl) {
      markerEl.setAttribute("role", "button");
      markerEl.setAttribute("tabIndex", "0");
      markerEl.setAttribute(
        "aria-label",
        `Marqueur ${name}, ${address}. Appuyez sur Entrée pour l'itinéraire.`
      );
      markerEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") marker.openPopup();
      });
    }

    mapRef.current = map;
    setMapReady(true);

    return () => {
      marker.remove();
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [isVisible, latitude, longitude, name, address, phone, directionsUrl]);

  return (
    <div
      className={`leaflet-map relative w-full overflow-hidden rounded-xl border border-neutral-200 ${className ?? ""}`}
      style={{ height: responsiveHeight }}
    >
      <div ref={containerRef} className="h-full w-full" aria-hidden={!mapReady} />
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-white p-6">
          <div className="text-center">
            <h4 className="mb-2 font-bold text-neutral-900">
              Localisation de GNAMBA SERVICES
            </h4>
            <p className="mb-4 text-sm leading-relaxed text-neutral-600">
              {address}
            </p>
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
            >
              Itinéraire Google Maps
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeafletMap;