import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Hospital } from '../types';
import { EmergencyMap } from '../components/map/EmergencyMap';
import { DEFAULT_DOCTOR_LOCATION, GeolocationService } from '../utils/geolocation';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Navigation, 
  Search, 
  Filter, 
  CheckCircle2, 
  ExternalLink,
  ShieldCheck,
  Activity,
  Layers,
  Map as MapIcon
} from 'lucide-react';

export const HospitalsPage: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [filteredHospitals, setFilteredHospitals] = useState<Hospital[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [capabilityFilter, setCapabilityFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [showMap, setShowMap] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    api.get<Hospital[]>('/hospitals/nearby')
      .then((data) => {
        setHospitals(data);
        setFilteredHospitals(data);
      })
      .catch((err) => {
        console.error('Failed to load hospitals:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    let result = [...hospitals];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          h.address.toLowerCase().includes(q) ||
          h.stroke_capability.toLowerCase().includes(q)
      );
    }

    if (capabilityFilter !== 'ALL') {
      result = result.filter((h) => h.stroke_capability.includes(capabilityFilter));
    }

    setFilteredHospitals(result);
  }, [searchTerm, capabilityFilter, hospitals]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand-600" />
              <span>Stroke-Capable Speciality Hospitals Directory</span>
            </h1>
            <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded">
              DEMO DATA
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Geolocated Comprehensive Stroke Centers, Thrombectomy units, and 24/7 neuro-interventional emergency facilities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMap(!showMap)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
              showMap ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>{showMap ? 'Hide Map' : 'Show Interactive Map'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Map View */}
      {showMap && (
        <div className="space-y-2">
          <EmergencyMap
            sourceLocation={DEFAULT_DOCTOR_LOCATION}
            hospitals={filteredHospitals}
            height="320px"
            showRoute={false}
          />
        </div>
      )}

      {/* Search & Capability Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search stroke hospitals, city, capabilities..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Capability:</span>
          </span>

          {['ALL', 'Comprehensive', 'Thrombectomy', 'Primary'].map((filter) => (
            <button
              key={filter}
              onClick={() => setCapabilityFilter(filter)}
              className={`px-3 py-1 text-xs font-bold rounded-lg border transition-colors shrink-0 ${
                capabilityFilter === filter
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {filter === 'ALL' ? 'All Centers' : filter}
            </button>
          ))}
        </div>
      </div>

      {/* Hospital Cards Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span>Loading stroke hospitals...</span>
        </div>
      ) : filteredHospitals.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          No hospitals found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredHospitals.map((hosp) => {
            const isComprehensive = hosp.stroke_capability.includes('Comprehensive');

            return (
              <div
                key={hosp.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-brand-300 hover:shadow-md transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                      isComprehensive ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {hosp.stroke_capability}
                    </span>

                    <div className="text-right shrink-0">
                      <strong className="text-xs font-mono font-black text-slate-900 block">{hosp.estimated_distance_km} km</strong>
                      <span className="text-[10px] font-bold text-blue-700 block">~{hosp.estimated_travel_time_min}m ETA</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{hosp.name}</h3>
                    <p className="text-xs text-slate-500 flex items-start gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{hosp.address}</span>
                    </p>
                  </div>

                  {/* Diagnostic Badges */}
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    {hosp.ct_scan_available && <span className="bg-sky-50 text-sky-800 font-bold px-2 py-0.5 rounded border border-sky-200">CT Scan ✓</span>}
                    {hosp.mri_available && <span className="bg-sky-50 text-sky-800 font-bold px-2 py-0.5 rounded border border-sky-200">MRI Neuro ✓</span>}
                    {hosp.icu_available && <span className="bg-purple-50 text-purple-800 font-bold px-2 py-0.5 rounded border border-purple-200">Neuro-ICU ✓</span>}
                    {hosp.emergency_available && <span className="bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">24/7 ER ✓</span>}
                  </div>

                  {/* Speciality list */}
                  <div className="space-y-1 pt-1">
                    {hosp.specialties.map((spec, i) => (
                      <div key={i} className="text-[11px] text-slate-600 flex items-center gap-1.5 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{spec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <a
                    href={`tel:${hosp.emergency_phone || hosp.phone}`}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-red-600" />
                    <span>Call ER</span>
                  </a>

                  <a
                    href={GeolocationService.getNavigationUrl(
                      DEFAULT_DOCTOR_LOCATION.latitude,
                      DEFAULT_DOCTOR_LOCATION.longitude,
                      hosp.latitude,
                      hosp.longitude,
                      hosp.name
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>🗺️ Navigate</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
