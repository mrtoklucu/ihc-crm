import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppContext } from './context/AppContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewLead from './pages/NewLead';
import Leads from './pages/Leads';
import Users from './pages/Users';
import Layout from './components/Layout';

const App = () => {
  const { currentUser } = useContext(AppContext);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/" />} />
        
        {currentUser ? (
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/new-lead" element={<NewLead />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/users" element={currentUser.level === 5 ? <Users /> : <Navigate to="/" />} />
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
