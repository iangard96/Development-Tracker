// ui/src/LocationMap.tsx
import React, { useEffect, useMemo, useState } from "react";
import type { Project } from "./types";

type Location = { lat: number; lon: number };

type Props = {
  project: Project | null;
};

export default function LocationMap({ project }: Props) {
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
  const [location, setLocation] = useState<Location | null>(null);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(10);
  const [mapStyle, setMapStyle] = useState<"streets" | "satellite">("streets");

  const lat = project?.latitude;
  const lon = project?.longitude;
  const address = (project?.address || "").trim();

  useEffect(() => {
    setGeocodeError(null);

    if (lat !== null && lat !== undefined && lon !== null && lon !== undefined) {
      setLocation({ lat, lon });
      setZoom(10);
      setLoading(false);
      return;
    }

    if (address && mapboxToken) {
      setLoading(true);
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        address,
      )}.json?access_token=${mapboxToken}&limit=1`;
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error("Geocoding failed");
          return res.json();
        })
        .then((data) => {
          const [gLon, gLat] = data?.features?.[0]?.center ?? [];
          if (typeof gLat === "number" && typeof gLon === "number") {
            setLocation({ lat: gLat, lon: gLon });
            setZoom(10);
          } else {
            setGeocodeError("No coordinates found for this address.");
            setLocation(null);
          }
        })
        .catch(() => {
          setGeocodeError("Could not geocode the address.");
          setLocation(null);
        })
        .finally(() => setLoading(false));
      return;
    }

    setLocation(null);
    setZoom(3);
    setLoading(false);
  }, [lat, lon, address, mapboxToken]);

  const mapConfig = useMemo(() => {
    const fallbackCenter: Location = { lat: 39.8283, lon: -98.5795 }; // CONUS center-ish
    if (location) {
      return { center: location, zoom, pin: true };
    }
    return { center: fallbackCenter, zoom, pin: false };
  }, [location, zoom]);

  const mapUrl = useMemo(() => {
    if (!mapboxToken) return null;
    const { center, zoom, pin } = mapConfig;
    const styleId = mapStyle === "streets" ? "streets-v12" : "satellite-streets-v12";
    const overlay = pin
      ? `pin-s+3b82f6(${center.lon},${center.lat})/`
      : "";
    return `https://api.mapbox.com/styles/v1/mapbox/${styleId}/static/${overlay}${center.lon},${center.lat},${zoom},0/900x380?access_token=${mapboxToken}`;
  }, [mapConfig, mapboxToken, mapStyle]);

  return (
    <div
      style={{
        marginTop: 16,
        border: "1px solid var(--border)",
        borderRadius: 10,
        background: "var(--card)",
        padding: 12,
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>Project Map</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(18, z + 1))}
            style={{
              border: "1px solid var(--border)",
              background: "var(--card)",
              borderRadius: 6,
              width: 28,
              height: 28,
              fontWeight: 700,
              cursor: "pointer",
            }}
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(1, z - 1))}
            style={{
              border: "1px solid var(--border)",
              background: "var(--card)",
              borderRadius: 6,
              width: 28,
              height: 28,
              fontWeight: 700,
              cursor: "pointer",
            }}
            aria-label="Zoom out"
          >
            -
          </button>
          <select
            value={mapStyle}
            onChange={(e) => setMapStyle(e.target.value as "streets" | "satellite")}
            style={{
              border: "1px solid var(--border)",
              background: "var(--card)",
              borderRadius: 6,
              padding: "4px 8px",
              fontSize: 12,
              cursor: "pointer",
            }}
            aria-label="Select basemap"
          >
            <option value="streets">Streets</option>
            <option value="satellite">Satellite</option>
          </select>
          {loading && <span style={{ fontSize: 12, color: "var(--muted)" }}>Geocoding...</span>}
        </div>
      </div>

      {mapUrl ? (
        <img
          src={mapUrl}
          alt="Project map"
          style={{ width: "100%", maxWidth: "100%", borderRadius: 8, display: "block" }}
        />
      ) : (
        <div
          style={{
            height: 260,
            borderRadius: 8,
            background: "var(--surface)",
            color: "var(--muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: 16,
            fontSize: 13,
          }}
        >
          Add a Mapbox token (VITE_MAPBOX_TOKEN) or supply coordinates/address to see a map preview.
        </div>
      )}

      {geocodeError && (
        <div style={{ marginTop: 8, fontSize: 12, color: "var(--danger)" }}>{geocodeError}</div>
      )}
      {!location && !geocodeError && (
        <div style={{ marginTop: 8, fontSize: 12, color: "var(--muted)" }}>
          Using default map view. Add latitude/longitude or an address to show a pin.
        </div>
      )}
    </div>
  );
}
