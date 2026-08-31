/**
 * StrokeShield AI — High-Accuracy Geolocation & Precise Hospital Routing Engine
 * 
 * 1. High-Accuracy Browser Geolocation API (enableHighAccuracy: true, maximumAge: 0, timeout: 15000)
 * 2. Multi-attempt Accuracy Improver (retains best/lowest meter fix)
 * 3. Exact GPS Metadata (latitude, longitude, accuracy, altitude, heading, speed, timestamp)
 * 4. Quality Indicator (HIGH <=10m, GOOD <=30m, MODERATE <=100m, LOW >100m)
 * 5. Strict Distinction: Haversine Straight-Line Distance vs Real Road Distance & Travel Time (OSRM API)
 * 6. Direct Google Maps Coordinate Directions Navigation Deep Link
 */

export interface ExactGpsPosition {
  latitude: number;
  longitude: number;
  accuracy: number; // in meters (at 95% confidence level)
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
  quality: 'HIGH' | 'GOOD' | 'MODERATE' | 'LOW';
  sourceLabel: string;
  sourceAddress?: string;
  sourceName?: string;
  isConfirmed: boolean;
}

export type GeoLocationCoords = ExactGpsPosition;

export interface RoadRoutingResult {
  straightLineDistanceKm: number;
  roadDistanceKm: number | null;
  estimatedTravelMinutes: number | null;
  routeGeometryCoordinates: [number, number][]; // [lat, lon] waypoints for map polyline
  isRoadRouteAvailable: boolean;
  routingProvider: string;
}

export const DEFAULT_SAVED_CLINIC_LOCATION: ExactGpsPosition = {
  latitude: 37.77492,
  longitude: -122.41941,
  accuracy: 15,
  altitude: null,
  altitudeAccuracy: null,
  heading: null,
  speed: null,
  timestamp: Date.now(),
  quality: 'GOOD',
  sourceLabel: 'Metro Outpatient Neurology Clinic (Saved Coordinates)',
  sourceName: 'Metro Outpatient Neurology Clinic',
  sourceAddress: '100 Medical Center Way, Suite 400, Metro City',
  isConfirmed: true,
};

export const DEFAULT_DOCTOR_LOCATION = DEFAULT_SAVED_CLINIC_LOCATION;

export const PRESET_CLINIC_LOCATIONS: ExactGpsPosition[] = [
  {
    latitude: 37.77492,
    longitude: -122.41941,
    accuracy: 12,
    altitude: 18,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
    timestamp: Date.now(),
    quality: 'GOOD',
    sourceLabel: 'Metro Outpatient Neurology Clinic (Primary Saved)',
    sourceName: 'Metro Outpatient Clinic',
    sourceAddress: '100 Medical Center Way, Suite 400, Metro City',
    isConfirmed: true,
  },
  {
    latitude: 37.78451,
    longitude: -122.40802,
    accuracy: 8,
    altitude: 14,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
    timestamp: Date.now(),
    quality: 'HIGH',
    sourceLabel: 'City Central Family Health Center',
    sourceName: 'City Central Family Health Center',
    sourceAddress: '420 Downtown Plaza, Metro City',
    isConfirmed: true,
  },
  {
    latitude: 37.75804,
    longitude: -122.46505,
    accuracy: 22,
    altitude: 45,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
    timestamp: Date.now(),
    quality: 'GOOD',
    sourceLabel: 'Suburban Urgent Care & Triage Unit',
    sourceName: 'Suburban Urgent Care Unit',
    sourceAddress: '880 Sunset Blvd, West Metro',
    isConfirmed: true,
  },
  {
    latitude: 37.74205,
    longitude: -122.38804,
    accuracy: 35,
    altitude: 8,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
    timestamp: Date.now(),
    quality: 'MODERATE',
    sourceLabel: 'Eastside Community Medical Clinic',
    sourceName: 'Eastside Community Clinic',
    sourceAddress: '210 Bayview Ave, East Metro',
    isConfirmed: true,
  },
];

export const PRESET_SOURCE_LOCATIONS = PRESET_CLINIC_LOCATIONS;

export class GeolocationService {
  /**
   * Determine Location Quality Rating based on GPS accuracy radius in meters.
   */
  public static getQualityRating(accuracyMeters: number): 'HIGH' | 'GOOD' | 'MODERATE' | 'LOW' {
    if (accuracyMeters <= 10) return 'HIGH';
    if (accuracyMeters <= 30) return 'GOOD';
    if (accuracyMeters <= 100) return 'MODERATE';
    return 'LOW';
  }

  /**
   * Single high-accuracy Geolocation API call.
   */
  private static async querySingleFix(): Promise<{
    position: ExactGpsPosition | null;
    error: string | null;
  }> {
    if (!('geolocation' in navigator)) {
      return {
        position: null,
        error: 'Browser does not support Geolocation API.',
      };
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(6));
          const lon = Number(pos.coords.longitude.toFixed(6));
          const acc = Math.round(pos.coords.accuracy);
          const quality = this.getQualityRating(acc);

          resolve({
            position: {
              latitude: lat,
              longitude: lon,
              accuracy: acc,
              altitude: pos.coords.altitude !== null ? Number(pos.coords.altitude.toFixed(1)) : null,
              altitudeAccuracy: pos.coords.altitudeAccuracy !== null ? Math.round(pos.coords.altitudeAccuracy) : null,
              heading: pos.coords.heading !== null ? Number(pos.coords.heading.toFixed(1)) : null,
              speed: pos.coords.speed !== null ? Number(pos.coords.speed.toFixed(1)) : null,
              timestamp: pos.timestamp || Date.now(),
              quality,
              sourceLabel: `Live GPS Fix (${lat}, ${lon})`,
              sourceName: `Live Device GPS (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
              sourceAddress: `GPS Coordinates: ${lat}, ${lon} (±${acc}m)`,
              isConfirmed: false,
            },
            error: null,
          });
        },
        (err) => {
          let msg = 'Unable to determine GPS location.';
          if (err.code === err.PERMISSION_DENIED) {
            msg = 'Location permission denied by user. Please enable location permissions in your browser.';
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            msg = 'GPS signal unavailable. Please ensure device location is active.';
          } else if (err.code === err.TIMEOUT) {
            msg = 'GPS request timed out.';
          }
          resolve({
            position: null,
            error: msg,
          });
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 15000,
        }
      );
    });
  }

  /**
   * Acquire best available GPS fix with progressive accuracy improvement (Section 4).
   * Polling up to 3 rapid attempts to achieve <= 10m HIGH accuracy fix.
   */
  public static async getPreciseLocation(
    onProgress?: (attempt: number, currentAccuracy: number | null) => void
  ): Promise<{
    position: ExactGpsPosition;
    error: string | null;
    attemptsCount: number;
  }> {
    let bestFix: ExactGpsPosition | null = null;
    let lastError: string | null = null;
    let attemptsCount = 0;

    for (let i = 1; i <= 3; i++) {
      attemptsCount = i;
      onProgress?.(i, bestFix?.accuracy ?? null);

      const result = await this.querySingleFix();

      if (result.position) {
        if (!bestFix || result.position.accuracy < bestFix.accuracy) {
          bestFix = result.position;
        }

        // If high accuracy (<=10m) achieved, stop early
        if (bestFix.accuracy <= 10) {
          break;
        }
      } else {
        lastError = result.error;
        if (i === 1 && result.error?.includes('permission denied')) {
          break;
        }
      }
    }

    if (bestFix) {
      return {
        position: bestFix,
        error: null,
        attemptsCount,
      };
    }

    return {
      position: DEFAULT_SAVED_CLINIC_LOCATION,
      error: lastError || 'Unable to obtain GPS fix. Fallback to saved clinic location.',
      attemptsCount,
    };
  }

  public static async getCurrentPosition(): Promise<{
    coords: ExactGpsPosition;
    error: string | null;
  }> {
    const res = await this.getPreciseLocation();
    return {
      coords: res.position,
      error: res.error,
    };
  }

  /**
   * Calculate Straight-Line Distance using the Haversine formula (Section 10).
   * R = 6371 km
   */
  public static calculateStraightLineDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
  }

  public static calculateDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    return this.calculateStraightLineDistanceKm(lat1, lon1, lat2, lon2);
  }

  public static estimateTravelTimeMin(distanceKm: number): number {
    const time = (distanceKm / 32) * 60 + 2;
    return Math.max(3, Math.round(time));
  }

  /**
   * Fetch Real Road Distance, Estimated Travel Time, and Road Waypoints from OSRM Routing Service.
   */
  public static async calculateRoadRoute(
    sourceLat: number,
    sourceLon: number,
    destLat: number,
    destLon: number
  ): Promise<RoadRoutingResult> {
    const straightLineDistanceKm = this.calculateStraightLineDistanceKm(
      sourceLat,
      sourceLon,
      destLat,
      destLon
    );

    const directLineCoords: [number, number][] = [
      [sourceLat, sourceLon],
      [destLat, destLon],
    ];

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${sourceLon},${sourceLat};${destLon},${destLat}?overview=full&geometries=geojson`;
      const response = await fetch(url, { signal: AbortSignal.timeout(6000) });

      if (!response.ok) {
        throw new Error(`Routing HTTP Error: ${response.status}`);
      }

      const data = await response.json();

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const roadDistanceKm = Number((route.distance / 1000).toFixed(2));
        const estimatedTravelMinutes = Math.round(route.duration / 60);

        const routeCoords: [number, number][] = route.geometry.coordinates.map(
          (c: [number, number]) => [c[1], c[0]]
        );

        return {
          straightLineDistanceKm,
          roadDistanceKm,
          estimatedTravelMinutes,
          routeGeometryCoordinates: routeCoords,
          isRoadRouteAvailable: true,
          routingProvider: 'OSRM Open-Source Road Routing Engine',
        };
      }
    } catch (err) {
      console.warn('Live Road Routing API unavailable, using straight-line calculation:', err);
    }

    return {
      straightLineDistanceKm,
      roadDistanceKm: null,
      estimatedTravelMinutes: null,
      routeGeometryCoordinates: directLineCoords,
      isRoadRouteAvailable: false,
      routingProvider: 'Straight-line Haversine (Road Routing Offline)',
    };
  }

  /**
   * Generate Direct Google Maps Directions Navigation URL with Exact Coordinates (Section 12).
   */
  public static getNavigationUrl(
    sourceLat: number,
    sourceLon: number,
    destLat: number,
    destLon: number,
    destName: string = 'Stroke Hospital'
  ): string {
    return `https://www.google.com/maps/dir/?api=1&origin=${sourceLat},${sourceLon}&destination=${destLat},${destLon}&destination_place_id=${encodeURIComponent(
      destName
    )}&travelmode=driving`;
  }
}
