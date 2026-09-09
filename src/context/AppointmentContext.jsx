import React, { createContext, useState, useEffect, useContext } from 'react';
import { db } from '../config/firebase';
import { collection, doc, getDocs, addDoc, query, orderBy, where, deleteDoc, updateDoc, Timestamp, onSnapshot } from 'firebase/firestore';
import { AppContext } from './AppContext';

export const AppointmentContext = createContext();

export const AppointmentProvider = ({ children }) => {
  const { tenantSlug, addLog, currentUser } = useContext(AppContext);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    if (!tenantSlug) return;
    
    const tenantRef = doc(db, 'tenants', tenantSlug);
    const q = query(collection(tenantRef, 'appointments'), orderBy('date', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAppointments(list);
      setLoading(false);
    }, (err) => {
      console.error("Appointment fetch error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [tenantSlug]);

  const addAppointment = async (appData) => {
    try {
      const tenantRef = doc(db, 'tenants', tenantSlug);
      const newApp = {
        ...appData,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.name || 'Sistem',
        status: 'scheduled' // scheduled, completed, cancelled, no-show
      };
      const docRef = await addDoc(collection(tenantRef, 'appointments'), newApp);
      addLog('Randevu', `${appData.date} tarihine yeni randevu oluşturuldu.`);
      return true;
    } catch (err) {
      console.error("Add appointment error:", err);
      return false;
    }
  };

  const updateAppointmentStatus = async (id, status) => {
    try {
      const tenantRef = doc(db, 'tenants', tenantSlug);
      const appRef = doc(tenantRef, 'appointments', id);
      await updateDoc(appRef, { status });
      return true;
    } catch (err) {
      console.error("Update appointment error:", err);
      return false;
    }
  };

  return (
    <AppointmentContext.Provider value={{
      loading, appointments,
      addAppointment, updateAppointmentStatus
    }}>
      {children}
    </AppointmentContext.Provider>
  );
};
