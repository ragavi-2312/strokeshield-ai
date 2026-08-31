import React from 'react';
import { Hospital } from '../../types';
import { GeoLocationCoords, GeolocationService } from '../../utils/geolocation';
import { EmergencyMap } from '../map/EmergencyMap';
import { 
  Navigation, 
  Phone, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  AlertOctagon, 
  X, 
  CheckCircle2, 
  Building2, 
  ExternalLink 
} from 'lucide-react';

interface EmergencyRouteViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospital: Hospital;
  sourceLocation: {
    latitude: number;
    longitude: number;
    sourceName?: string;
    sourceAddress?: string;
    accuracy?: number;
  };
  patientName: string;
  patientId: string;
  onConfirmReferral: () => void;
}

export const EmergencyRouteViewModal: React.FC<EmergencyRouteViewModalProps> = ({
  isOpen,
  onClose,
  hospital,
  sourceLocation,
  patientName,
  patientId,
  onConfirmReferral,
}) => {
  if (!isOpen) return null;

  const navUrl = GeolocationService.getNavigationUrl(
    sourceLocation.latitude,
    sourceLocation.longitude,
    hospital.latitude,
    hospital.longitude,
    hospital.name
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-red-100 text-red-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Emergency Code Stroke Route
              </span>
              <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded">
                DEMO HOSPITAL DATA
              </span>
            </div>
            <h2 className="text-lg font-black tracking-tight text-slate-900">
              Emergency Transfer Route & Navigation
            </h2>
            <p className="text-xs text-slate-500">
              Patient: <strong>{patientName}</strong> ({patientId})
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Route Origin & Destination Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Source Origin */}
          <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 block">
              📍 Origin (Source Clinic / GPS)
            </span>
            <strong className="text-slate-900 block text-sm">{sourceLocation.sourceName}</strong>
            <p className="text-slate-600 text-[11px] font-mono">{sourceLocation.sourceAddress}</p>
          </div>

          {/* Destination Stroke Center */}
          <div className="p-4 bg-red-50/60 rounded-2xl border border-red-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-700 block">
                🏥 Destination (Stroke Center)
              </span>
              <span className="text-[9px] bg-red-600 text-white font-bold px-1.5 py-0.2 rounded">
                {hospital.stroke_capability}
              </span>
            </div>
            <strong className="text-slate-900 block text-sm">{hospital.name}</strong>
            <p className="text-slate-600 text-[11px]">{hospital.address}</p>
          </div>
        </div>

        {/* Transit Metrics Badge Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Distance</span>
            <strong className="text-base font-black font-mono text-slate-900">{hospital.estimated_distance_km} km</strong>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Estimated ETA</span>
            <strong className="text-base font-black font-mono text-brand-700">~{hospital.estimated_travel_time_min} mins</strong>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Operating Hours</span>
            <strong className="text-xs font-extrabold text-slate-800 block pt-0.5">{hospital.operating_hours || '24/7 ER'}</strong>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Emergency Phone</span>
            <a
              href={`tel:${hospital.emergency_phone || hospital.phone}`}
              className="text-xs font-black text-red-600 hover:text-red-700 block pt-0.5"
            >
              {hospital.emergency_phone || hospital.phone}
            </a>
          </div>
        </div>

        {/* Leaflet Map Preview */}
        <div className="rounded-2xl overflow-hidden border border-slate-200">
          <EmergencyMap
            sourceLocation={sourceLocation}
            hospitals={[hospital]}
            selectedHospitalId={hospital.id}
            height="260px"
            showRoute={true}
          />
        </div>

        {/* Diagnostic Capabilities Checklist */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
          <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
            Destination Stroke Capabilities Checklist
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2 bg-white rounded-xl border border-slate-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold text-slate-800">Stroke Unit ✓</span>
            </div>
            <div className="p-2 bg-white rounded-xl border border-slate-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold text-slate-800">CT Angiography ✓</span>
            </div>
            <div className="p-2 bg-white rounded-xl border border-slate-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold text-slate-800">MRI Neuro ✓</span>
            </div>
            <div className="p-2 bg-white rounded-xl border border-slate-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold text-slate-800">Neuro-ICU Ready ✓</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href={`tel:${hospital.emergency_phone || hospital.phone}`}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors w-full sm:w-auto"
            >
              <Phone className="w-3.5 h-3.5 text-red-600" />
              <span>Call ER Hotline</span>
            </a>

            <a
              href={navUrl}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all w-full sm:w-auto"
            >
              <Navigation className="w-4 h-4" />
              <span>🗺️ START NAVIGATION</span>
            </a>
          </div>

          <button
            type="button"
            onClick={onConfirmReferral}
            className="w-full sm:w-auto px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow-md shadow-red-600/20 flex items-center justify-center gap-1.5 transition-all"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>Confirm & Dispatch Referral</span>
          </button>
        </div>
      </div>
    </div>
  );
};
