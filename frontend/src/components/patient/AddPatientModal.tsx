import React, { useState } from 'react';
import { api } from '../../api/client';
import { Patient } from '../../types';
import { 
  UserPlus, 
  X, 
  Heart, 
  Activity, 
  AlertCircle, 
  Check, 
  Phone, 
  User, 
  Calendar, 
  MapPin, 
  Shield 
} from 'lucide-react';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientCreated: (patient: Patient) => void;
}

export const AddPatientModal: React.FC<AddPatientModalProps> = ({
  isOpen,
  onClose,
  onPatientCreated,
}) => {
  const [name, setName] = useState('');
  const [dob, setDob] = useState('1965-06-15');
  const [gender, setGender] = useState('Male');
  const [phone, setPhone] = useState('+1 (555) 302-8841');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('420 Pine Street, Metro City');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  // Medical History
  const [previousStroke, setPreviousStroke] = useState(false);
  const [hypertension, setHypertension] = useState(true);
  const [diabetes, setDiabetes] = useState(false);
  const [heartDisease, setHeartDisease] = useState(false);
  const [highCholesterol, setHighCholesterol] = useState(true);
  const [smoking, setSmoking] = useState('never');
  const [alcoholUse, setAlcoholUse] = useState('occasional');
  const [familyHistory, setFamilyHistory] = useState(false);
  const [neuroConditions, setNeuroConditions] = useState('');
  const [currentMeds, setCurrentMeds] = useState('Lisinopril 10mg, Atorvastatin 20mg');
  const [allergies, setAllergies] = useState('NKDA');
  const [bmi, setBmi] = useState<number>(26.5);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Auto calculate age preview
  const calculateAge = (dobString: string) => {
    try {
      const birth = new Date(dobString);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return isNaN(age) ? 0 : age;
    } catch {
      return 0;
    }
  };

  const calculatedAge = calculateAge(dob);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Patient full name is required.');
      return;
    }
    if (!dob) {
      setError('Date of birth is required.');
      return;
    }
    if (!phone.trim()) {
      setError('Phone number is required.');
      return;
    }
    if (!emergencyContactName.trim() || !emergencyContactPhone.trim()) {
      setError('Emergency contact name and phone number are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        dob,
        gender,
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        emergency_contact_name: emergencyContactName.trim(),
        emergency_contact_phone: emergencyContactPhone.trim(),
        medical_history: {
          previous_stroke: previousStroke,
          hypertension,
          diabetes,
          heart_disease: heartDisease,
          high_cholesterol: highCholesterol,
          smoking,
          alcohol_use: alcoholUse,
          family_history_stroke: familyHistory,
          previous_neuro_conditions: neuroConditions.trim() || undefined,
          current_medications: currentMeds.trim() || undefined,
          known_allergies: allergies.trim() || undefined,
          bmi: Number(bmi) || 25.0,
        },
      };

      const newPatient = await api.post<Patient>('/patients', payload);
      onPatientCreated(newPatient);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to register patient.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-brand-700 to-brand-900 text-white p-5 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Register New Clinical Patient</h2>
              <p className="text-xs text-brand-200">Create longitudinal patient profile & structured medical baseline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Demographics */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-brand-600" />
              <span>1. Demographics & Contact Information</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Eleanor Davis"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gender *</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth *</label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
                <span className="text-[11px] text-brand-600 font-semibold mt-0.5 inline-block">
                  Calculated Age: {calculatedAge} years
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="patient@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
                <input
                  type="text"
                  placeholder="Street address, City, State"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Emergency Contact */}
          <div className="pt-3 border-t border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-red-600" />
              <span>2. Emergency Next of Kin / Contact *</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact Name & Relation *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Thomas Davis (Spouse)"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="+1 (555) 999-0000"
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Medical History & Risk Factors */}
          <div className="pt-3 border-t border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <Heart className="w-3.5 h-3.5 text-brand-600" />
              <span>3. Medical History & Cardiovascular Risk Factors</span>
            </h3>
            
            {/* Checkboxes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hypertension}
                  onChange={(e) => setHypertension(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                />
                <span>Hypertension</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={diabetes}
                  onChange={(e) => setDiabetes(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                />
                <span>Diabetes Mellitus</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={previousStroke}
                  onChange={(e) => setPreviousStroke(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                />
                <span>Prior Stroke / TIA</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={heartDisease}
                  onChange={(e) => setHeartDisease(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                />
                <span>Heart Disease / AFib</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={highCholesterol}
                  onChange={(e) => setHighCholesterol(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                />
                <span>High Cholesterol</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={familyHistory}
                  onChange={(e) => setFamilyHistory(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                />
                <span>Family History Stroke</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Smoking Status</label>
                <select
                  value={smoking}
                  onChange={(e) => setSmoking(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  <option value="never">Never Smoked</option>
                  <option value="former">Former Smoker</option>
                  <option value="current">Current Smoker</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Alcohol Consumption</label>
                <select
                  value={alcoholUse}
                  onChange={(e) => setAlcoholUse(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  <option value="none">None</option>
                  <option value="occasional">Occasional</option>
                  <option value="moderate">Moderate</option>
                  <option value="heavy">Heavy</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">BMI (kg/m²)</label>
                <input
                  type="number"
                  step="0.1"
                  min="10"
                  max="60"
                  value={bmi}
                  onChange={(e) => setBmi(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Current Medications</label>
                <input
                  type="text"
                  placeholder="e.g. Lisinopril, Aspirin"
                  value={currentMeds}
                  onChange={(e) => setCurrentMeds(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Known Allergies</label>
                <input
                  type="text"
                  placeholder="e.g. Penicillin, Sulfa"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Prior Neurological Conditions</label>
                <input
                  type="text"
                  placeholder="e.g. Migraine, Bell's Palsy"
                  value={neuroConditions}
                  onChange={(e) => setNeuroConditions(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm shadow-brand-500/20 flex items-center gap-2 transition-all"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Register Patient Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
