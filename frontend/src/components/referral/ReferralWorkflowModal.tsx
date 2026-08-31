import React, { useState } from 'react';
import { api } from '../../api/client';
import { Hospital, Referral } from '../../types';
import { 
  ExactGpsPosition, 
  RoadRoutingResult,
  DEFAULT_SAVED_CLINIC_LOCATION, 
  GeolocationService 
} from '../../utils/geolocation';
import { EmergencyHospitalSearch } from './EmergencyHospitalSearch';
import { EmergencyRouteViewModal } from './EmergencyRouteViewModal';
import { 
  SendHorizontal, 
  Ambulance, 
  Building2, 
  Clock, 
  CheckCircle2, 
  AlertOctagon, 
  X, 
  MapPin, 
  Phone,
  Navigation,
  ShieldCheck,
  Lock
} from 'lucide-react';

interface ReferralWorkflowModalProps {
  patientId: number;
  patientName: string;
  assessmentId: number;
  isOpen: boolean;
  onClose: () => void;
  onReferralCreated?: (referral: Referral) => void;
}

export const ReferralWorkflowModal: React.FC<ReferralWorkflowModalProps> = ({
  patientId,
  patientName,
  assessmentId,
  isOpen,
  onClose,
  onReferralCreated,
}) => {
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [sourcePosition, setSourcePosition] = useState<ExactGpsPosition>(DEFAULT_SAVED_CLINIC_LOCATION);
  const [roadRouting, setRoadRouting] = useState<RoadRoutingResult | null>(null);

  const [priority, setPriority] = useState<'Emergency' | 'Urgent'>('Emergency');
  const [ambulanceMode, setAmbulanceMode] = useState('Advanced Life Support (ALS) with Telemetry');
  const [dispatchNotes, setDispatchNotes] = useState('Code Stroke Activation: Acute focal neurological deficits. Requesting immediate CT Angiography suite standby.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [isDoctorReviewed, setIsDoctorReviewed] = useState(true);

  if (!isOpen) return null;

  const handleHospitalSelected = (
    hosp: Hospital, 
    srcPos: ExactGpsPosition, 
    routing?: RoadRoutingResult | null
  ) => {
    setSelectedHospital(hosp);
    setSourcePosition(srcPos);
    if (routing) setRoadRouting(routing);
  };

  const handleCreateReferral = async () => {
    if (!selectedHospital) {
      alert('Please select a destination stroke hospital.');
      return;
    }

    setIsSubmitting(true);
    try {
      const straightLineDist = GeolocationService.calculateStraightLineDistanceKm(
        sourcePosition.latitude,
        sourcePosition.longitude,
        selectedHospital.latitude,
        selectedHospital.longitude
      );

      const payload = {
        patient_id: patientId,
        assessment_id: assessmentId,
        hospital_id: selectedHospital.id,
        source_hospital_name: sourcePosition.sourceLabel || 'Doctor Clinic Origin',
        source_latitude: sourcePosition.latitude,
        source_longitude: sourcePosition.longitude,
        source_accuracy_meters: sourcePosition.accuracy,
        source_timestamp: new Date(sourcePosition.timestamp).toISOString(),
        destination_latitude: selectedHospital.latitude,
        destination_longitude: selectedHospital.longitude,
        distance_km: straightLineDist,
        road_distance_km: roadRouting?.roadDistanceKm ?? null,
        estimated_travel_minutes: roadRouting?.estimatedTravelMinutes ?? null,
        priority,
        ambulance_requested: ambulanceMode,
        dispatch_notes: dispatchNotes,
        doctor_confirmed: true,
      };

      const referral = await api.post<Referral>('/referrals', payload);
      if (onReferralCreated) onReferralCreated(referral);
      setShowRouteModal(true);
    } catch (err: any) {
      alert('Failed to dispatch referral: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in duration-150 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-red-100 text-red-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Emergency Stroke Referral Dispatch
              </span>
              <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded">
                DEMO DATA
              </span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-slate-900">
              Select Stroke Hospital & Route for {patientName}
            </h2>
            <p className="text-xs text-slate-500">
              High-accuracy GPS hospital matching, straight-line distance, and turn-by-turn routing
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Hospital Discovery & Map */}
        <EmergencyHospitalSearch
          onSelectHospital={handleHospitalSelected}
          selectedHospitalId={selectedHospital?.id}
        />

        {/* 2. Dispatch Configuration */}
        {selectedHospital && (
          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Ambulance className="w-4 h-4 text-red-600" />
              <span>Ambulance Protocol & Handover Notes</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Referral Priority Level</label>
                <select
                  value={priority}
                  onChange={(e: any) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold text-slate-900"
                >
                  <option value="Emergency">🚨 Immediate Emergency (Code Stroke)</option>
                  <option value="Urgent">⚠️ Priority Urgent Transfer</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Transport Vehicle Protocol</label>
                <select
                  value={ambulanceMode}
                  onChange={(e) => setAmbulanceMode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold text-slate-900"
                >
                  <option value="Advanced Life Support (ALS) with Telemetry">Advanced Life Support (ALS) with Telemetry</option>
                  <option value="Mobile Stroke Unit (CT on-board)">Mobile Stroke Unit (CT on-board)</option>
                  <option value="Critical Care Transport (CCT)">Critical Care Transport (CCT)</option>
                </select>
              </div>
            </div>

            <div className="text-xs">
              <label className="font-bold text-slate-700 block mb-1">Clinical Handover & Dispatch Narrative</label>
              <textarea
                rows={2}
                value={dispatchNotes}
                onChange={(e) => setDispatchNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            {/* Doctor Confirmation Checkbox */}
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-900 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isDoctorReviewed}
                  onChange={(e) => setIsDoctorReviewed(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <span>Physician has reviewed the patient assessment and authorizes emergency dispatch.</span>
              </label>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <p className="text-[11px] text-slate-400">
            Emergency summary snapshot will be automatically transmitted to receiving neurology portal.
          </p>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl w-full sm:w-auto"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isSubmitting || !selectedHospital || !isDoctorReviewed}
              onClick={handleCreateReferral}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl shadow-md shadow-red-600/20 flex items-center justify-center gap-2 transition-all w-full sm:w-auto"
            >
              <SendHorizontal className="w-4 h-4" />
              <span>{isSubmitting ? 'Dispatching...' : 'Confirm & Dispatch Emergency Referral'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Emergency Route View Modal with Turn-by-Turn Navigation */}
      {selectedHospital && (
        <EmergencyRouteViewModal
          isOpen={showRouteModal}
          onClose={() => {
            setShowRouteModal(false);
            onClose();
          }}
          hospital={selectedHospital}
          sourceLocation={{
            latitude: sourcePosition.latitude,
            longitude: sourcePosition.longitude,
            sourceName: sourcePosition.sourceLabel,
            accuracy: sourcePosition.accuracy,
          }}
          patientName={patientName}
          patientId={`P-${patientId}`}
          onConfirmReferral={() => {
            setShowRouteModal(false);
            onClose();
          }}
        />
      )}
    </div>
  );
};
