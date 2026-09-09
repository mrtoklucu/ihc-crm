import React, { useContext } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppContext } from './context/AppContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewLead from './pages/NewLead';
import Leads from './pages/Leads';
import LeadDetail from './pages/LeadDetail';
import Users from './pages/Users';
import Profile from './pages/Profile';
import Logs from './pages/Logs';
import Support from './pages/Support';
import Integrations from './pages/Integrations';
import LeadPool from './pages/LeadPool';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import NotesTasks from './pages/NotesTasks';
import QuoteForm from './pages/QuoteForm';
import Finance from './pages/Finance';
import Appointments from './pages/Appointments';
import SystemPage from './pages/System';
import ReleaseNotesPage from './pages/ReleaseNotesPage';
import Layout from './components/Layout';

const App = () => {
  const { currentUser, authReady } = useContext(AppContext);

  // Firebase oturumu cozulene kadar bekle; yoksa sayfa yenilendiginde
  // giris ekrani bir an gorunup sonra panele atliyor.
  if (!authReady) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-secondary)' }}>
        Yükleniyor...
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/" />} />
        
        {currentUser ? (
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/new-lead" element={<NewLead />} />
            <Route path="/lead-pool" element={currentUser.level >= 4 ? <LeadPool /> : <Navigate to="/" />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/leads/:id" element={<LeadDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/users" element={currentUser.level === 5 ? <Users /> : <Navigate to="/" />} />
            <Route path="/logs" element={currentUser.level === 5 ? <Logs /> : <Navigate to="/" />} />
            <Route path="/integrations" element={Number(currentUser.level) === 5 ? <Integrations /> : <Navigate to="/" />} />
            <Route path="/settings" element={Number(currentUser.level) === 5 ? <Settings /> : <Navigate to="/" />} />
            <Route path="/reports" element={Number(currentUser.level) === 5 ? <Reports /> : <Navigate to="/" />} />
            <Route path="/notes-tasks" element={<NotesTasks />} />
            <Route path="/quote-form" element={<QuoteForm />} />
            <Route path="/support" element={<Support />} />
            <Route path="/finance/:subpage" element={currentUser.level >= 4 ? <Finance /> : <Navigate to="/" />} />
            <Route path="/appointments/:subpage" element={<Appointments />} />
            <Route path="/system/:subpage" element={currentUser.level === 5 ? <SystemPage /> : <Navigate to="/" />} />
            <Route path="/release-notes" element={currentUser.level >= 4 ? <ReleaseNotesPage /> : <Navigate to="/" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    </Router>
  );
};

export default App;
