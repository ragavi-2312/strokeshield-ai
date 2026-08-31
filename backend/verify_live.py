import httpx

def main():
    client = httpx.Client(base_url='http://127.0.0.1:8000/api')
    
    # 1. Doctor Authentication
    login_resp = client.post('/auth/login', json={'email': 'dr.sarah@strokeshield.ai', 'password': 'Doctor@123'})
    assert login_resp.status_code == 200, f"Doctor login failed: {login_resp.text}"
    doc_token = login_resp.json()['access_token']
    doc = login_resp.json()['doctor']
    doc_headers = {'Authorization': f'Bearer {doc_token}'}
    print(f"[OK] Doctor Authenticated: {doc['name']} ({doc['hospital']})")

    # 2. Patient Registration & Quantitative Facial Asymmetry Score Assessment
    new_p = client.post('/patients', json={
        'name': 'Quantitative Asymmetry Test Patient',
        'dob': '1959-11-22',
        'gender': 'Male',
        'phone': '+1 (555) 321-9876',
        'emergency_contact_name': 'Mary Test (Wife)',
        'emergency_contact_phone': '+1 (555) 321-5432',
        'medical_history': {'hypertension': True, 'previous_stroke': False}
    }, headers=doc_headers).json()
    
    # Continuous Facial Asymmetry Score (43.6 / 100) with full component breakdown
    new_a = client.post('/assessments', json={
        'patient_id': new_p['id'],
        'symptom_onset': '2026-08-31T10:00:00',
        'last_known_well_time': '10:00 AM',
        'symptom_duration_minutes': 40,
        'face_result': 'possible_abnormality',
        'face_ai_observation': 'Possible geometric facial asymmetry observed (Asymmetry Score: 43.6/100) — mild/moderate unilateral deviation — doctor verification required',
        'face_doctor_confirmation': 'Possible Asymmetry',
        'arm_result': 'possible_weakness',
        'arm_ai_observation': 'possible_arm_drift',
        'arm_doctor_confirmation': 'weakness_suspected',
        'speech_result': 'possible_speech_difficulty',
        'speech_doctor_confirmation': 'abnormal',
        'systolic_bp': 184.0,
        'diastolic_bp': 106.0,
        'glucose': 190.0,
        'heart_rate': 84.0,
        'spo2': 96.0,
        'doctor_notes': 'Facial Asymmetry Score 43.6/100 verified by attending neurologist with right nasolabial flattening.',
        'camera_assessment_data': {
            'facial_asymmetry_score': 43.6,
            'facial_measurement_quality': 91,
            'mouth_asymmetry_score': 51.2,
            'eye_asymmetry_score': 22.4,
            'eyebrow_asymmetry_score': 18.7,
            'cheek_asymmetry_score': 9.6,
            'smile_asymmetry_score': 51.2,
            'frame_count': 25,
            'median_score': 43.6,
            'mean_score': 42.1,
            'standard_deviation': 2.4,
            'head_yaw': 0.8,
            'head_pitch': -1.2,
            'head_roll': 0.4
        }
    }, headers=doc_headers).json()
    
    assert new_a['risk_level'] == 'HIGH'
    print(f"[OK] Quantitative Facial Asymmetry Assessment Saved: {new_a['risk_level']} (Risk Score: {new_a['risk_score']}/100)")
    print(f"     Facial Asymmetry Score: {new_a['camera_assessment_data']['facial_asymmetry_score']}/100")
    print(f"     Measurement Quality: {new_a['camera_assessment_data']['facial_measurement_quality']}/100")
    print(f"     Components: Mouth={new_a['camera_assessment_data']['mouth_asymmetry_score']}, Eyes={new_a['camera_assessment_data']['eye_asymmetry_score']}")

    # 3. Emergency Summary Snapshot Verification
    summary = client.get(f"/assessments/{new_a['id']}/emergency-summary", headers=doc_headers).json()
    assert summary['patient_name'] == 'Quantitative Asymmetry Test Patient'
    print(f"[OK] Standardized EMS Summary Generated with Quantitative Vision Metrics")

    # 4. GPS Stroke Hospital Discovery & Dispatch
    hospitals = client.get('/hospitals/nearby?latitude=37.7749&longitude=-122.4194&urgency=HIGH', headers=doc_headers).json()
    assert len(hospitals) >= 3
    dest = hospitals[0]
    ref_resp = client.post('/referrals', json={
        'patient_id': new_p['id'],
        'assessment_id': new_a['id'],
        'hospital_id': dest['id'],
        'source_hospital_name': 'Metro Outpatient Clinic',
        'source_latitude': 37.77492,
        'source_longitude': -122.41941,
        'source_accuracy_meters': 8.0,
        'priority': 'Emergency',
        'dispatch_notes': 'Facial Asymmetry Score 43.6/100 with right arm pronator drift. Last known well 40 mins.',
        'doctor_confirmed': True
    }, headers=doc_headers)
    
    assert ref_resp.status_code == 201, f"Referral creation failed: {ref_resp.status_code} {ref_resp.text}"
    ref = ref_resp.json()
    print(f"[OK] Emergency Referral Dispatched: Code {ref['referral_code']}")
    print(f"     Source Accuracy: ±{ref['source_accuracy_meters']} m")
    print(f"     Straight-Line Distance: {ref['distance_km']} km")

    # 5. Route Verification
    route_resp = client.get(f"/referrals/{ref['id']}/route", headers=doc_headers)
    assert route_resp.status_code == 200, f"Route fetch failed: {route_resp.text}"
    route_data = route_resp.json()
    print(f"[OK] Exact GPS Route Generated: {route_data['navigation_url']}")
    print(f"     Waypoints Count: {len(route_data['waypoints'])}")

    print("\nALL EXACT GPS LOCATION & HOSPITAL ROUTING TESTS PASSED WITH 100% SUCCESS!")

if __name__ == '__main__':
    main()
