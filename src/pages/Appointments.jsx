import React from 'react';
import { useParams } from 'react-router-dom';
import NewAppointment from '../components/appointments/NewAppointment';
import AppointmentList from '../components/appointments/AppointmentList';
import CalendarView from '../components/appointments/CalendarView';

const Appointments = () => {
  const { subpage } = useParams();

  // Helper to resolve component
  const getSubpageComponent = (id) => {
    switch (id) {
      case 'new': return <NewAppointment />;
      case 'calendar': return <CalendarView />;
      case 'list': return <AppointmentList />;
      case 'events': return <CalendarView />; // Placeholder logic for now, using daily flow
      default: return <CalendarView />;
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s' }}>
      {getSubpageComponent(subpage)}
    </div>
  );
};

export default Appointments;
