import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Hospital } from '../../types';
import { GeoLocationCoords } from '../../utils/geolocation';
import { ExternalLink, Navigation, Phone, CheckCircle2 } from 'lucide-react';

interface EmergencyMapProps {
  sourceLocation: {
    latitude: number;
    longitude: number;
    sourceName?: string;
    sourceAddress?: string;
    accuracy?: number;
  };
  hospitals: Hospital[];
  selectedHospitalId?: number;
  onSelectHospital?: (hospital: Hospital) => void;
  height?: string;
  showRoute?: boolean;
}

export const EmergencyMap: React.FC<EmergencyMapProps> = ({
  sourceLocation,
  hospitals,
  selectedHospitalId,
  onSelectHospital,
  height = '420px',
  showRoute = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Map
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [sourceLocation.latitude, sourceLocation.longitude],
        zoom: 12,
        zoomControl: true,
      });

      // Standard OpenStreetMap Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    // Clear previous markers
    markersLayer.clearLayers();
    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }

    // 1. Create Source Location Marker (Blue Medical Pin)
    const sourceIcon = L.divIcon({
      className: 'custom-source-pin',
      html: `
        <div style="background-color: #2563eb; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); font-weight: bold; font-size: 14px;">
          📍
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
      popupAnchor: [0, -30],
    });

    const sourceMarker = L.marker([sourceLocation.latitude, sourceLocation.longitude], {
      icon: sourceIcon,
      title: sourceLocation.sourceName || 'Doctor Clinic Location',
    });

    sourceMarker.bindPopup(`
      <div style="font-family: sans-serif; font-size: 12px; min-width: 180px; padding: 4px;">
        <span style="background-color: #dbeafe; color: #1e40af; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">Source Origin</span>
        <h4 style="margin: 4px 0 2px 0; font-size: 13px; font-weight: 800; color: #0f172a;">${sourceLocation.sourceName || 'Origin Clinic'}</h4>
        <p style="margin: 0; color: #64748b; font-size: 11px;">${sourceLocation.sourceAddress || 'Doctor Hospital'}</p>
        <p style="margin: 4px 0 0 0; color: #2563eb; font-size: 10px; font-weight: 600;">📍 ${sourceLocation.latitude}, ${sourceLocation.longitude}</p>
      </div>
    `);

    markersLayer.addLayer(sourceMarker);

    // 2. Add Hospital Markers
    const bounds = L.latLngBounds([[sourceLocation.latitude, sourceLocation.longitude]]);
    let targetHospital: Hospital | undefined = undefined;

    hospitals.forEach((h) => {
      bounds.extend([h.latitude, h.longitude]);
      const isSelected = selectedHospitalId === h.id;
      if (isSelected) targetHospital = h;

      // Color-coded by capability
      let bgColor = '#10b981'; // Green for Primary
      if (h.stroke_capability.includes('Comprehensive')) bgColor = '#dc2626'; // Red
      else if (h.stroke_capability.includes('Thrombectomy')) bgColor = '#d97706'; // Amber

      const hospIcon = L.divIcon({
        className: 'custom-hosp-pin',
        html: `
          <div style="background-color: ${bgColor}; color: white; width: ${isSelected ? '38px' : '30px'}; height: ${isSelected ? '38px' : '30px'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.35); font-weight: 900; font-size: ${isSelected ? '14px' : '11px'}; transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'}; transition: all 0.2s;">
            🏥
          </div>
        `,
        iconSize: isSelected ? [38, 38] : [30, 30],
        iconAnchor: isSelected ? [19, 38] : [15, 30],
        popupAnchor: [0, -28],
      });

      const hospMarker = L.marker([h.latitude, h.longitude], {
        icon: hospIcon,
        title: h.name,
      });

      const popupHtml = `
        <div style="font-family: sans-serif; font-size: 12px; min-width: 200px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px; margin-bottom: 4px;">
            <span style="background-color: ${bgColor}20; color: ${bgColor}; font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px;">
              ${h.stroke_capability}
            </span>
            <span style="font-size: 9px; background-color: #f1f5f9; color: #475569; padding: 2px 4px; border-radius: 3px; font-weight: bold;">
              ${h.verification_status || 'DEMO'}
            </span>
          </div>

          <h4 style="margin: 0 0 2px 0; font-size: 13px; font-weight: 800; color: #0f172a;">${h.name}</h4>
          <p style="margin: 0 0 6px 0; color: #64748b; font-size: 11px;">${h.address}</p>

          <div style="background-color: #f8fafc; padding: 6px; border-radius: 8px; margin-bottom: 6px; display: flex; justify-content: space-between; font-size: 11px; font-weight: bold;">
            <span style="color: #0f172a;">📍 ${h.estimated_distance_km} km</span>
            <span style="color: #0284c7;">⏱️ ~${h.estimated_travel_time_min} mins ETA</span>
          </div>

          <div style="display: flex; gap: 4px; margin-bottom: 6px; font-size: 10px; color: #334155;">
            ${h.ct_scan_available ? '<span style="background:#e0f2fe; color:#0369a1; padding:2px 4px; border-radius:4px;">CT ✓</span>' : ''}
            ${h.mri_available ? '<span style="background:#e0f2fe; color:#0369a1; padding:2px 4px; border-radius:4px;">MRI ✓</span>' : ''}
            ${h.icu_available ? '<span style="background:#e0f2fe; color:#0369a1; padding:2px 4px; border-radius:4px;">ICU ✓</span>' : ''}
            ${h.emergency_available ? '<span style="background:#dcfce7; color:#15803d; padding:2px 4px; border-radius:4px;">24/7 ER ✓</span>' : ''}
          </div>

          <div style="display: flex; gap: 6px; padding-top: 4px; border-top: 1px solid #e2e8f0;">
            <a href="https://www.google.com/maps/dir/?api=1&origin=${sourceLocation.latitude},${sourceLocation.longitude}&destination=${h.latitude},${h.longitude}" target="_blank" rel="noreferrer" style="flex: 1; text-align: center; background: #2563eb; color: white; text-decoration: none; padding: 5px 8px; border-radius: 6px; font-size: 11px; font-weight: bold;">
              🗺️ Navigate
            </a>
          </div>
        </div>
      `;

      hospMarker.bindPopup(popupHtml);
      hospMarker.on('click', () => {
        if (onSelectHospital) onSelectHospital(h);
      });

      markersLayer.addLayer(hospMarker);
    });

    // 3. Draw Route Polyline to Selected Destination
    if (showRoute && targetHospital) {
      const routePoints: [number, number][] = [
        [sourceLocation.latitude, sourceLocation.longitude],
        [
          (sourceLocation.latitude + targetHospital.latitude) / 2 + 0.003,
          (sourceLocation.longitude + targetHospital.longitude) / 2 - 0.002,
        ],
        [targetHospital.latitude, targetHospital.longitude],
      ];

      const polyline = L.polyline(routePoints, {
        color: '#dc2626',
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 8',
      }).addTo(map);

      routeLayerRef.current = polyline;
    }

    // Fit map bounds to encompass source and nearby hospitals
    if (hospitals.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [sourceLocation, hospitals, selectedHospitalId, showRoute]);

  // Clean up map on component unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
      <div ref={mapContainerRef} style={{ width: '100%', height }} />

      {/* Map Legend Floating Overlay */}
      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3 py-2 rounded-2xl border border-slate-200 shadow-md text-[10px] space-y-1 z-[1000] pointer-events-none">
        <div className="flex items-center gap-1.5 font-bold text-slate-800">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
          <span>📍 Source Origin (Doctor Clinic / GPS)</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
          <span>🏥 Comprehensive Stroke Center</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block" />
          <span>🏥 Thrombectomy Capable Center</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
          <span>🏥 Primary Stroke Center</span>
        </div>
      </div>
    </div>
  );
};
