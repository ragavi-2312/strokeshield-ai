import React, { createContext, useContext, useState, useEffect } from 'react';
import { Doctor, HospitalStaff } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  doctor: Doctor | null;
  hospitalStaff: HospitalStaff | null;
  role: 'doctor' | 'hospital_staff';
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  loginAsDrRaha: () => Promise<void>;
  loginAsDrVijay: () => Promise<void>;
  loginAsDemoDoctor: () => Promise<void>;
  loginAsDemoHospitalStaff: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [hospitalStaff, setHospitalStaff] = useState<HospitalStaff | null>(null);
  const [role, setRole] = useState<'doctor' | 'hospital_staff'>('doctor');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const storedRole = localStorage.getItem('user_role') as 'doctor' | 'hospital_staff';
    
    if (token) {
      api.get<{ role: 'doctor' | 'hospital_staff'; doctor?: Doctor; hospital_staff?: HospitalStaff }>('/auth/me')
        .then((res) => {
          setRole(res.role || 'doctor');
          if (res.role === 'hospital_staff') {
            setHospitalStaff(res.hospital_staff || null);
            setDoctor(null);
          } else {
            setDoctor(res.doctor || null);
            setHospitalStaff(null);
          }
        })
        .catch(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user_role');
          setDoctor(null);
          setHospitalStaff(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string = 'Doctor@123') => {
    setIsLoading(true);
    try {
      const data = await api.post<{
        access_token: string;
        role: 'doctor' | 'hospital_staff';
        doctor?: Doctor;
        hospital_staff?: HospitalStaff;
      }>('/auth/login', { email, password });

      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user_role', data.role);
      setRole(data.role);

      if (data.role === 'hospital_staff') {
        setHospitalStaff(data.hospital_staff || null);
        setDoctor(null);
      } else {
        setDoctor(data.doctor || null);
        setHospitalStaff(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDrRaha = async () => {
    await login('raha@demo-strokeshield.com', 'Doctor@123');
  };

  const loginAsDrVijay = async () => {
    await login('vijay@demo-strokeshield.com', 'Doctor@123');
  };

  const loginAsDemoDoctor = async () => {
    await loginAsDrRaha();
  };

  const loginAsDemoHospitalStaff = async () => {
    await login('staff.metro@strokeshield.ai', 'Hospital@123');
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    setDoctor(null);
    setHospitalStaff(null);
  };

  return (
    <AuthContext.Provider
      value={{
        doctor,
        hospitalStaff,
        role,
        isAuthenticated: !!(doctor || hospitalStaff),
        isLoading,
        login,
        loginAsDrRaha,
        loginAsDrVijay,
        loginAsDemoDoctor,
        loginAsDemoHospitalStaff,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
