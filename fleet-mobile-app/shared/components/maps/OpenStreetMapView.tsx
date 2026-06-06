import React, { useEffect, useMemo, useRef, useState } from "react";
import { Text, View } from "react-native";
import { WebView } from "react-native-webview";
import type { WebView as WebViewType } from "react-native-webview";

export type MapLatLng = { latitude: number; longitude: number };

export type OpenStreetMapMarker = {
  id: string;
  coordinate: MapLatLng;
  color?: string;
  label?: string;
};

export type OpenStreetMapPolyline = {
  id: string;
  coordinates: MapLatLng[];
  color?: string;
  width?: number;
  dashed?: boolean;
};

const MAP_ATTRIBUTION = "&copy; OpenStreetMap contributors";
const DEFAULT_CENTER: MapLatLng = { latitude: 36.8065, longitude: 10.1815 };
const MAP_HTML = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; background: #dbeafe; }
    .leaflet-control-attribution { font-size: 10px; }
    .leaflet-control-zoom a { width: 36px; height: 36px; line-height: 36px; font-size: 20px; }
    .map-marker {
      width: 18px;
      height: 18px;
      border-radius: 999px;
      border: 3px solid #fff;
      box-shadow: 0 2px 10px rgba(15, 23, 42, 0.28);
      transform: translate(-9px, -9px);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map("map", {
      center: [${DEFAULT_CENTER.latitude}, ${DEFAULT_CENTER.longitude}],
      zoom: 9,
      zoomControl: true,
      attributionControl: true,
      preferCanvas: true,
      dragging: true,
      touchZoom: true,
      doubleClickZoom: true,
      scrollWheelZoom: true,
      boxZoom: false,
      keyboard: false
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "${MAP_ATTRIBUTION}",
      maxZoom: 19,
      subdomains: ["a", "b", "c"]
    }).addTo(map);

    const routeLayer = L.layerGroup().addTo(map);
    const markerLayer = L.layerGroup().addTo(map);
    const routeLayers = {};
    const markerLayers = {};
    let hasFittedInitialBounds = false;

    window.__smartAxiaUpdateMap = function(data, fit) {
      const bounds = [];
      const nextRouteIds = new Set(data.polylines.map((polyline) => polyline.id));
      const nextMarkerIds = new Set(data.markers.map((marker) => marker.id));

      Object.keys(routeLayers).forEach((id) => {
        if (!nextRouteIds.has(id)) {
          routeLayer.removeLayer(routeLayers[id]);
          delete routeLayers[id];
        }
      });

      Object.keys(markerLayers).forEach((id) => {
        if (!nextMarkerIds.has(id)) {
          markerLayer.removeLayer(markerLayers[id]);
          delete markerLayers[id];
        }
      });

      data.polylines.forEach((polyline) => {
        const style = {
          color: polyline.color,
          weight: polyline.width,
          opacity: 0.95,
          lineCap: "round",
          lineJoin: "round",
          dashArray: polyline.dashed ? "10 8" : null
        };

        if (routeLayers[polyline.id]) {
          routeLayers[polyline.id].setLatLngs(polyline.points);
          routeLayers[polyline.id].setStyle(style);
        } else {
          routeLayers[polyline.id] = L.polyline(polyline.points, style).addTo(routeLayer);
        }

        bounds.push(...polyline.points);
      });

      data.markers.forEach((marker) => {
        const icon = L.divIcon({
          className: "",
          iconSize: [18, 18],
          html: '<div class="map-marker" style="background:' + marker.color + '"></div>'
        });

        if (markerLayers[marker.id]) {
          markerLayers[marker.id].setLatLng(marker.point);
          markerLayers[marker.id].setIcon(icon);
          markerLayers[marker.id].unbindTooltip();
          if (marker.label) {
            markerLayers[marker.id].bindTooltip(marker.label, { direction: "top", offset: [0, -12] });
          }
        } else {
          markerLayers[marker.id] = L.marker(marker.point, {
            icon,
            interactive: Boolean(marker.label)
          }).addTo(markerLayer);
          if (marker.label) {
            markerLayers[marker.id].bindTooltip(marker.label, { direction: "top", offset: [0, -12] });
          }
        }

        bounds.push(marker.point);
      });

      if ((fit || !hasFittedInitialBounds) && bounds.length > 1) {
        map.fitBounds(bounds, { padding: [42, 42], maxZoom: 15, animate: false });
        hasFittedInitialBounds = true;
      } else if ((fit || !hasFittedInitialBounds) && bounds.length === 1) {
        map.setView(bounds[0], 15, { animate: false });
        hasFittedInitialBounds = true;
      }

      setTimeout(() => map.invalidateSize(), 50);
    };

    setTimeout(() => map.invalidateSize(), 150);
  </script>
</body>
</html>`;
const MAP_SOURCE = { html: MAP_HTML };

function isFiniteCoordinate(point: MapLatLng): boolean {
  return (
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude) &&
    point.latitude >= -85 &&
    point.latitude <= 85 &&
    point.longitude >= -180 &&
    point.longitude <= 180
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function toLeafletPoint(point: MapLatLng): [number, number] {
  return [point.latitude, point.longitude];
}

function buildMapPayload(markers: OpenStreetMapMarker[], polylines: OpenStreetMapPolyline[]) {
  return {
    center: toLeafletPoint(DEFAULT_CENTER),
    markers: markers
      .filter((marker) => isFiniteCoordinate(marker.coordinate))
      .map((marker) => ({
        id: marker.id,
        point: toLeafletPoint(marker.coordinate),
        color: marker.color ?? "#EF4444",
        label: marker.label ? escapeHtml(marker.label) : "",
      })),
    polylines: polylines
      .map((polyline) => ({
        id: polyline.id,
        points: polyline.coordinates.filter(isFiniteCoordinate).map(toLeafletPoint),
        color: polyline.color ?? "#6B21F5",
        width: polyline.width ?? 4,
        dashed: Boolean(polyline.dashed),
      }))
      .filter((polyline) => polyline.points.length >= 2),
  };
}

function buildUpdateScript(markers: OpenStreetMapMarker[], polylines: OpenStreetMapPolyline[], fit: boolean): string {
  const payload = JSON.stringify(buildMapPayload(markers, polylines));
  return `
    window.__smartAxiaUpdateMap && window.__smartAxiaUpdateMap(${payload}, ${fit ? "true" : "false"});
    true;
  `;
}

export function OpenStreetMapView({
  markers,
  polylines,
  fallbackLabel,
}: {
  markers: OpenStreetMapMarker[];
  polylines?: OpenStreetMapPolyline[];
  fallbackLabel?: string;
}) {
  const webViewRef = useRef<WebViewType>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const previousRouteSignature = useRef("");
  const hasPoints = useMemo(
    () =>
      markers.some((marker) => isFiniteCoordinate(marker.coordinate)) ||
      (polylines ?? []).some((polyline) => polyline.coordinates.some(isFiniteCoordinate)),
    [markers, polylines],
  );
  const routeSignature = useMemo(
    () =>
      [
        markers
          .filter((marker) => marker.id !== "driver" && isFiniteCoordinate(marker.coordinate))
          .map((marker) => `${marker.id}:${marker.coordinate.latitude.toFixed(5)},${marker.coordinate.longitude.toFixed(5)}`)
          .join("|"),
        (polylines ?? [])
          .map((polyline) => `${polyline.id}:${polyline.coordinates.length}`)
          .join("|"),
      ].join("::"),
    [markers, polylines],
  );

  useEffect(() => {
    if (!isMapReady || !hasPoints) return;
    const shouldFit = previousRouteSignature.current !== routeSignature;
    previousRouteSignature.current = routeSignature;
    webViewRef.current?.injectJavaScript(buildUpdateScript(markers, polylines ?? [], shouldFit));
  }, [hasPoints, isMapReady, markers, polylines, routeSignature]);

  if (!hasPoints) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#F8FAFC" }}>
        <Text style={{ color: "#6B7280", textAlign: "center", fontSize: 13 }}>{fallbackLabel}</Text>
      </View>
    );
  }

  return (
    <WebView
      ref={webViewRef}
      originWhitelist={["*"]}
      source={MAP_SOURCE}
      javaScriptEnabled
      domStorageEnabled
      setBuiltInZoomControls={false}
      nestedScrollEnabled
      scrollEnabled={false}
      overScrollMode="never"
      onLoadEnd={() => setIsMapReady(true)}
      style={{ flex: 1, backgroundColor: "#F8FAFC" }}
      containerStyle={{ flex: 1, backgroundColor: "#F8FAFC" }}
    />
  );
}
