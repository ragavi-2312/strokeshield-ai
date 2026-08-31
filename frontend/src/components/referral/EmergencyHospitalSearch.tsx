import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Hospital } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { 
  GeolocationService, 
  ExactGpsPosition, 
  RoadRoutingResult,
  DEFAULT_SAVED_CLINIC_LOCATION, 
  PRESET_CLINIC_LOCATIONS 
} from '../../utils/geolocation';
import { EmergencyMap } from '../map/EmergencyMap';
import { 
  MapPin, 
  Crosshair, 
  Building2, 
  Navigation, 
  Phone, 
  Filter, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Activity, 
  SlidersHorizontal,
  ExternalLink,
  ChevronDown,
  RotateCcw,
  Compass,
  AlertTriangle,
  Lock
} from 'lucide-react';

interface EmergencyHospitalSearchProps {
  onSelectHospital: (hospital: Hospital, sourcePosition: ExactGpsPosition, roadRouting?: RoadRoutingResult | null) => void;
  selectedHospitalId?: number;
}

export const EmergencyHospitalSearch: React.FC<EmergencyHospitalSearchProps> = ({
  onSelectHospital,
  selectedHospitalId,
}) => {
  const { doctor } = useAuth();

  // Exact Current Position State (Section 2)
  const [gpsPosition, setGpsPosition] = useState<ExactGpsPosition>({
    latitude: doctor?.latitude || DEFAULT_SAVED_CLINIC_LOCATION.latitude,
    longitude: doctor?.longitude || DEFAULT_SAVED_CLINIC_LOCATION.longitude,
    accuracy: 12,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
    timestamp: Date.now(),
    quality: 'GOOD',
    sourceLabel: doctor?.hospital || DEFAULT_SAVED_CLINIC_LOCATION.sourceLabel,
    isConfirmed: true, // Initially confirmed to saved
  });

  const [isAcquiringGps, setIsAcquiringGps] = useState(false);
  const [gpsAttemptStatus, setGpsAttemptStatus] = useState<string | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showManualDropdown, setShowManualDropdown] = useState(false);

  // Search parameters
  const [searchRadiusKm, setSearchRadiusKm] = useState<number>(35);
  const [requireCt, setRequireCt] = useState(false);
  const [requireMri, setRequireMri] = useState(false);
  const [requireIcu, setRequireIcu] = useState(false);
  const [requireNeuro, setRequireNeuro] = useState(false);
  const [requireStroke, setRequireStroke] = useState(false);

  // Ranked Hospitals & Active Selection
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(true);
  const [activeHospital, setActiveHospital] = useState<Hospital | null>(null);
  const [roadRouting, setRoadRouting] = useState<RoadRoutingResult | null>(null);
  const [isLoadingRoadRoute, setIsLoadingRoadRoute] = useState(false);

  // Request High-Accuracy GPS Fix (Section 1 & 4)
  const handleRequestPreciseGPS = async () => {
    setIsAcquiringGps(true);
    setGpsError(null);
    setGpsAttemptStatus('Requesting high-accuracy GPS fix from browser...');

    try {
      const res = await GeolocationService.getPreciseLocation((attempt, curAcc) => {
        if (curAcc !== null) {
          setGpsAttemptStatus(`Improving GPS accuracy... Attempt ${attempt}/3 (Current Fix: ±${curAcc} m)`);
        } else {
          setGpsAttemptStatus(`Acquiring GPS Fix... Attempt ${attempt}/3`);
        }
      });

      if (res.error) {
        setGpsError(res.error);
      }

      setGpsPosition(res.position);
      setShowLocationModal(true); // Open Location Confirmation Gate (Section 5)
    } finally {
      setIsAcquiringGps(false);
      setGpsAttemptStatus(null);
    }
  };

  // Confirm Location (Section 16: Source Location Lock)
  const handleConfirmLocation = () => {
    setGpsPosition((prev) => ({ ...prev, isConfirmed: true }));
    setShowLocationModal(false);
  };

  const handleUseSavedClinic = () => {
    setGpsPosition({
      latitude: doctor?.latitude || DEFAULT_SAVED_CLINIC_LOCATION.latitude,
      longitude: doctor?.longitude || DEFAULT_SAVED_CLINIC_LOCATION.longitude,
      accuracy: 12,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
      timestamp: Date.now(),
      quality: 'GOOD',
      sourceLabel: doctor?.hospital || DEFAULT_SAVED_CLINIC_LOCATION.sourceLabel,
      isConfirmed: true,
    });
    setGpsError(null);
    setShowLocationModal(false);
  };

  const handleSelectPresetClinic = (preset: ExactGpsPosition) => {
    setGpsPosition({ ...preset, isConfirmed: true });
    setShowManualDropdown(false);
    setShowLocationModal(false);
    setGpsError(null);
  };

  // Fetch Ranked Hospitals from Backend using Exact Coordinates (Section 17 & 18)
  const fetchRankedHospitals = async () => {
    setIsLoadingHospitals(true);
    try {
      const params = {
        latitude: gpsPosition.latitude,
        longitude: gpsPosition.longitude,
        urgency: 'HIGH',
        max_distance_km: searchRadiusKm,
        require_ct: requireCt,
        require_mri: requireMri,
        require_icu: requireIcu,
        require_neuro: requireNeuro,
        require_stroke: requireStroke,
      };
      const list = await api.get<Hospital[]>('/hospitals/nearby', params);
      setHospitals(list);
      if (list.length > 0) {
        const found = selectedHospitalId ? list.find((h) => h.id === selectedHospitalId) : list[0];
        const chosen = found || list[0];
        setActiveHospital(chosen);
        onSelectHospital(chosen, gpsPosition, null);
      }
    } catch (err) {
      console.error('Failed to fetch ranked stroke hospitals:', err);
    } finally {
      setIsLoadingHospitals(false);
    }
  };

  useEffect(() => {
    fetchRankedHospitals();
  }, [gpsPosition.latitude, gpsPosition.longitude, searchRadiusKm, requireCt, requireMri, requireIcu, requireNeuro, requireStroke]);

  // Query Real Road Route asynchronously for Active Hospital (Section 11)
  useEffect(() => {
    if (!activeHospital) return;

    let isMounted = true;
    setIsLoadingRoadRoute(true);

    GeolocationService.calculateRoadRoute(
      gpsPosition.latitude,
      gpsPosition.longitude,
      activeHospital.latitude,
      activeHospital.longitude
    ).then((routeRes) => {
      if (isMounted) {
        setRoadRouting(routeRes);
        setIsLoadingRoadRoute(false);
        onSelectHospital(activeHospital, gpsPosition, routeRes);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [activeHospital?.id, gpsPosition.latitude, gpsPosition.longitude]);

  const handleSelectHospitalItem = (hosp: Hospital) => {
    setActiveHospital(hosp);
    onSelectHospital(hosp, gpsPosition, roadRouting);
  };

  return (
    <div className="space-y-6">
      {/* 1. High-Accuracy Location Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${gpsPosition.quality === 'HIGH' ? 'bg-emerald-500' : gpsPosition.quality === 'GOOD' ? 'bg-blue-500' : 'bg-amber-500'} animate-pulse`} />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Source Facility • Exact GPS Origin
              </span>
              <span className={`text-[10px] font-black px-2 py-0.2 rounded-full uppercase ${
                gpsPosition.quality === 'HIGH' ? 'bg-emerald-100 text-emerald-800' : gpsPosition.quality === 'GOOD' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
              }`}>
                Quality: {gpsPosition.quality} (±{gpsPosition.accuracy} m)
              </span>
              {gpsPosition.isConfirmed && (
                <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.2 rounded-full flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Locked for Referral</span>
                </span>
              )}
            </div>

            <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{gpsPosition.sourceLabel}</span>
            </h3>

            <p className="text-xs text-slate-600 font-mono">
              Latitude: <strong>{gpsPosition.latitude.toFixed(6)}</strong> • Longitude: <strong>{gpsPosition.longitude.toFixed(6)}</strong> • Accuracy: <strong>±{gpsPosition.accuracy} meters</strong>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRequestPreciseGPS}
              disabled={isAcquiringGps}
              className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:bg-slate-400 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all"
            >
              <Crosshair className={`w-3.5 h-3.5 ${isAcquiringGps ? 'animate-spin' : ''}`} />
              <span>{isAcquiringGps ? 'Acquiring GPS...' : '[ GET PRECISE LOCATION ]'}</span>
            </button>

            <button
              type="button"
              onClick={handleUseSavedClinic}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Saved Clinic Location</span>
            </button>

            {/* Manual Preset Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowManualDropdown(!showManualDropdown)}
                className="px-3 py-2 bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold flex items-center gap-1"
              >
                <span>Select Clinic</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showManualDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-xs animate-in fade-in space-y-1">
                  <span className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase block">
                    Predefined Doctor Locations
                  </span>
                  {PRESET_CLINIC_LOCATIONS.map((loc, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPresetClinic(loc)}
                      className="w-full px-3 py-2 text-left hover:bg-blue-50 text-slate-800 font-medium block"
                    >
                      <strong className="block text-xs text-slate-900">{loc.sourceLabel}</strong>
                      <span className="text-[10px] text-slate-500 font-mono">GPS: {loc.latitude}, {loc.longitude}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* GPS Attempt Status or Low Accuracy Warning (Section 4 & 14) */}
        {gpsAttemptStatus && (
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-900 flex items-center gap-2">
            <Compass className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
            <span className="font-bold">{gpsAttemptStatus}</span>
          </div>
        )}

        {gpsPosition.quality === 'LOW' && (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>⚠️ GPS accuracy is currently low (±{gpsPosition.accuracy} m).</strong> For better precision, move near an open window, ensure device location is enabled, and click <strong>[GET PRECISE LOCATION]</strong>.
            </span>
          </div>
        )}

        {gpsError && (
          <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{gpsError}</span>
          </div>
        )}

        {/* Filters & Radius Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Radius:</span>
            </span>
            {[10, 25, 35, 50].map((km) => (
              <button
                key={km}
                type="button"
                onClick={() => setSearchRadiusKm(km)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                  searchRadiusKm === km
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {km} km
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={requireCt}
                onChange={(e) => setRequireCt(e.target.checked)}
                className="rounded text-brand-600 focus:ring-brand-500"
              />
              <span className="font-semibold text-slate-700">CT Scan ✓</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={requireMri}
                onChange={(e) => setRequireMri(e.target.checked)}
                className="rounded text-brand-600 focus:ring-brand-500"
              />
              <span className="font-semibold text-slate-700">MRI ✓</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={requireIcu}
                onChange={(e) => setRequireIcu(e.target.checked)}
                className="rounded text-brand-600 focus:ring-brand-500"
              />
              <span className="font-semibold text-slate-700">Neuro-ICU ✓</span>
            </label>
          </div>
        </div>
      </div>

      {/* 2. Interactive Leaflet Map & Smart Ranked Hospitals List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ranked Hospital Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Ranked Stroke Centers ({hospitals.length} Matched)</span>
            </h4>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">
              DEMO HOSPITAL DATA
            </span>
          </div>

          {isLoadingHospitals ? (
            <div className="p-8 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>Searching nearby stroke hospitals from GPS...</span>
            </div>
          ) : hospitals.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 space-y-2">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
              <p className="font-bold text-xs">No stroke-capable hospitals found within {searchRadiusKm} km.</p>
              <button
                type="button"
                onClick={() => setSearchRadiusKm(50)}
                className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Expand Search to 50 km
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
              {hospitals.map((hosp, idx) => {
                const isSelected = (activeHospital?.id === hosp.id) || (selectedHospitalId === hosp.id);
                const isComprehensive = hosp.stroke_capability.includes('Comprehensive');
                const straightDist = GeolocationService.calculateStraightLineDistanceKm(
                  gpsPosition.latitude,
                  gpsPosition.longitude,
                  hosp.latitude,
                  hosp.longitude
                );

                return (
                  <div
                    key={hosp.id}
                    onClick={() => handleSelectHospitalItem(hosp)}
                    className={`p-4 rounded-3xl border cursor-pointer transition-all space-y-3 ${
                      isSelected
                        ? 'bg-brand-50/60 border-brand-500 shadow-md ring-2 ring-brand-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            isComprehensive ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {hosp.stroke_capability}
                          </span>
                        </div>
                        <h4 className="font-black text-slate-900 text-sm">{hosp.name}</h4>
                        <p className="text-[11px] text-slate-500 leading-tight">{hosp.address}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-400 block font-semibold">Straight-line:</span>
                        <strong className="font-mono text-sm font-black text-slate-900 block">
                          {straightDist.toFixed(2)} km
                        </strong>
                      </div>
                    </div>

                    {/* Diagnostic Flags */}
                    <div className="flex flex-wrap gap-1 text-[10px]">
                      {hosp.ct_scan_available && <span className="bg-sky-50 text-sky-800 font-bold px-1.5 py-0.5 rounded border border-sky-200">CT ✓</span>}
                      {hosp.mri_available && <span className="bg-sky-50 text-sky-800 font-bold px-1.5 py-0.5 rounded border border-sky-200">MRI ✓</span>}
                      {hosp.icu_available && <span className="bg-purple-50 text-purple-800 font-bold px-1.5 py-0.5 rounded border border-purple-200">Neuro-ICU ✓</span>}
                      {hosp.emergency_available && <span className="bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.5 rounded border border-emerald-200">24/7 ER ✓</span>}
                    </div>

                    {/* Action Row */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                      <a
                        href={`tel:${hosp.emergency_phone || hosp.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-red-600" />
                        <span>Call ER</span>
                      </a>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectHospitalItem(hosp);
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                          isSelected
                            ? 'bg-brand-600 text-white shadow-xs'
                            : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}
                      >
                        {isSelected ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                        <span>{isSelected ? 'Selected Destination' : 'Select Hospital'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Map View & Route Summary (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <EmergencyMap
            sourceLocation={{
              latitude: gpsPosition.latitude,
              longitude: gpsPosition.longitude,
              accuracy: gpsPosition.accuracy,
              sourceName: gpsPosition.sourceLabel,
            }}
            hospitals={hospitals}
            selectedHospitalId={activeHospital?.id}
            onSelectHospital={handleSelectHospitalItem}
            height="460px"
            showRoute={true}
          />

          {/* Active Hospital Route Card with Strict Straight-Line vs Road Distinction (Section 11) */}
          {activeHospital && (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
                    Active Emergency Route Destination
                  </span>
                  <strong className="text-sm font-black text-slate-900 block">
                    {activeHospital.name}
                  </strong>
                  <p className="text-xs text-slate-500 font-mono">
                    GPS: [{activeHospital.latitude.toFixed(6)}, {activeHospital.longitude.toFixed(6)}]
                  </p>
                </div>

                <a
                  href={GeolocationService.getNavigationUrl(
                    gpsPosition.latitude,
                    gpsPosition.longitude,
                    activeHospital.latitude,
                    activeHospital.longitude,
                    activeHospital.name
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all"
                >
                  <Navigation className="w-4 h-4" />
                  <span>🗺️ START NAVIGATION</span>
                </a>
              </div>

              {/* Exact Distance & Travel Time Distinction Card */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Straight-line Distance:</span>
                  <strong className="font-mono text-sm font-black text-slate-900">
                    {GeolocationService.calculateStraightLineDistanceKm(
                      gpsPosition.latitude,
                      gpsPosition.longitude,
                      activeHospital.latitude,
                      activeHospital.longitude
                    ).toFixed(2)} km
                  </strong>
                  <span className="text-[10px] text-slate-500 block">Calculated via Haversine</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Road Distance:</span>
                  <strong className="font-mono text-sm font-black text-slate-900">
                    {isLoadingRoadRoute ? (
                      <span className="text-slate-400 animate-pulse">Calculating road...</span>
                    ) : roadRouting?.roadDistanceKm !== null && roadRouting?.roadDistanceKm !== undefined ? (
                      `${roadRouting.roadDistanceKm.toFixed(2)} km`
                    ) : (
                      'Unavailable (Straight-line only)'
                    )}
                  </strong>
                  <span className="text-[10px] text-slate-500 block">
                    {roadRouting?.isRoadRouteAvailable ? 'OSRM Routing Engine' : 'Road service offline'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Estimated Travel Time:</span>
                  <strong className="font-mono text-sm font-black text-brand-700">
                    {isLoadingRoadRoute ? (
                      <span className="text-slate-400 animate-pulse">Calculating ETA...</span>
                    ) : roadRouting?.estimatedTravelMinutes !== null && roadRouting?.estimatedTravelMinutes !== undefined ? (
                      `${roadRouting.estimatedTravelMinutes} mins`
                    ) : (
                      'Unavailable'
                    )}
                  </strong>
                  <span className="text-[10px] text-slate-500 block">Actual Driving ETA</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Location Confirmation Modal (Section 5) */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="text-center space-y-1 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-2">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-slate-900">Confirm Current GPS Location</h3>
              <p className="text-xs text-slate-500">
                Please verify your exact coordinates before matching emergency stroke hospitals.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Latitude:</span>
                <strong className="text-slate-900">{gpsPosition.latitude.toFixed(6)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Longitude:</span>
                <strong className="text-slate-900">{gpsPosition.longitude.toFixed(6)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Accuracy:</span>
                <strong className={gpsPosition.accuracy <= 15 ? 'text-emerald-600' : 'text-amber-600'}>
                  ±{gpsPosition.accuracy} meters
                </strong>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500 font-sans">Status:</span>
                <strong className="text-emerald-700 font-sans">
                  {gpsPosition.quality === 'HIGH' ? '✓ High accuracy location obtained' : `Quality: ${gpsPosition.quality}`}
                </strong>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleConfirmLocation}
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-black shadow-md shadow-brand-600/20"
              >
                [ USE THIS LOCATION ]
              </button>

              <button
                type="button"
                onClick={handleRequestPreciseGPS}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold"
              >
                [ RETRY GPS ]
              </button>

              <button
                type="button"
                onClick={handleUseSavedClinic}
                className="w-full py-2 text-slate-500 hover:text-slate-700 text-xs font-medium"
              >
                [ USE SAVED CLINIC LOCATION ]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
