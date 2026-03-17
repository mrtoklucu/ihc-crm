import React, { createContext, useState, useEffect } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  
  const initialRoles = [
    { level: 1, name: 'Misafir' },
    { level: 2, name: 'Satış Danışmanı' },
    { level: 3, name: 'Uzman' },
    { level: 4, name: 'Genel Koordinatör' },
    { level: 5, name: 'Admin' },
  ];

  const [roles, setRoles] = useState(() => {
    const savedRoles = localStorage.getItem('crm_roles');
    return savedRoles ? JSON.parse(savedRoles) : initialRoles;
  });

  const initialUsers = [
    { id: 1, email: 'zafertoklucu@gmail.com', password: '1234512345', name: 'Zafer Toklucu', role: 'Admin', level: 5 },
    { id: 2, email: 'satis@gmail.com', password: '12345', name: 'Danışman', role: 'Satış Danışmanı', level: 2 },
    { id: 3, email: 'koordinator@gmail.com', password: '123', name: 'Genel Koordinator User', role: 'Genel Koordinatör', level: 4 },
    { id: 4, email: 'uzman@gmail.com', password: '123', name: 'Uzman User', role: 'Uzman', level: 3 },
    { id: 5, email: 'misafir@gmail.com', password: '123', name: 'Misafir Kullanıcı', role: 'Misafir', level: 1 }
  ];

  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('crm_users_v2');
    return saved ? JSON.parse(saved) : initialUsers;
  });

  const [leads, setLeads] = useState(() => {
    const saved = localStorage.getItem('crm_leads');
    return saved ? JSON.parse(saved) : [];
  });

  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem('crm_logs');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('crm_users_v2', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('crm_leads', JSON.stringify(leads));
  }, [leads]);
  
  useEffect(() => {
    localStorage.setItem('crm_roles', JSON.stringify(roles));
  }, [roles]);

  useEffect(() => {
    localStorage.setItem('crm_logs', JSON.stringify(logs));
  }, [logs]);

  const login = (email, password) => {
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      setCurrentUser(user);
      const newLog = {
        id: Date.now(),
        date: new Date().toISOString(),
        user: user.name,
        action: 'Sistem Girişi',
        detail: `${user.name} başarıyla giriş yaptı.`
      };
      setLogs(prev => [newLog, ...prev].slice(0, 1000));
      return true;
    }
    return false;
  };

  const logout = () => {
    if (currentUser) {
      addLog('Sistem Çıkışı', `${currentUser.name} sistemden çıkış yaptı.`);
    }
    setCurrentUser(null);
  };

  const addLog = (action, detail) => {
    const newLog = {
      id: Date.now(),
      date: new Date().toISOString(),
      user: currentUser ? currentUser.name : 'Sistem',
      action,
      detail
    };
    setLogs(prev => [newLog, ...prev].slice(0, 1000)); // Keep last 1000 logs
  };

  const addLead = (lead) => {
    const newLead = { 
      ...lead, 
      id: Date.now(), 
      assigneeId: null, 
      createdAt: new Date().toISOString(),
      status: 'Yeni',
      history: [{ date: new Date().toISOString(), note: 'Lead sisteme eklendi.', status: 'Yeni', author: currentUser ? currentUser.name : 'Sistem' }]
    };
    setLeads([...leads, newLead]);
    addLog('Yeni Lead', `${newLead.nameSurname} isimli lead eklendi.`);
  };

  const assignLead = (leadId, userId) => {
    const assignee = users.find(u => u.id === userId);
    setLeads(leads.map(lead => {
      if (lead.id === leadId) {
        const newHistory = [...(lead.history || []), {
          date: new Date().toISOString(),
          note: `Lead ${assignee ? assignee.name : 'birine'} atandı.`,
          status: lead.status || 'Yeni',
          author: currentUser ? currentUser.name : 'Sistem'
        }];
        return { ...lead, assigneeId: userId, history: newHistory };
      }
      return lead;
    }));
  };

  const addLeadHistory = (leadId, note, status) => {
    setLeads(leads.map(lead => {
      if (lead.id === leadId) {
        const newHistory = [...(lead.history || []), { 
          date: new Date().toISOString(), 
          note, 
          status: status || lead.status || 'Yeni',
          author: currentUser ? currentUser.name : 'Sistem'
        }];
        return { ...lead, status: status || lead.status || 'Yeni', history: newHistory };
      }
      return lead;
    }));
    const lead = leads.find(l => l.id === leadId);
    addLog('Lead Güncelleme', `${lead?.nameSurname} için not/durum güncellendi: ${status || 'Not eklendi'}`);
  };

  const addRole = (roleName, level) => {
    const newRole = { level: parseInt(level), name: roleName };
    setRoles([...roles, newRole]);
  };

  const addUser = (userData) => {
    const roleDef = roles.find(r => r.name === userData.role);
    const newUser = {
      id: Date.now(),
      ...userData,
      level: roleDef ? roleDef.level : 1
    };
    setUsers([...users, newUser]);
    addLog('Kullanıcı Ekleme', `${newUser.name} (${newUser.role}) sisteme eklendi.`);
  };

  const updateUser = (userId, updatedData) => {
    let oldName = '';
    setUsers(users.map(u => {
      if (u.id === userId) {
        oldName = u.name;
        const updatedUser = { ...u, ...updatedData };
        if (currentUser && currentUser.id === userId) {
          setCurrentUser(updatedUser);
        }
        return updatedUser;
      }
      return u;
    }));
    addLog('Kullanıcı Güncelleme', `${oldName} bilgileri güncellendi.`);
  };

  const deleteUser = (userId) => {
    if (currentUser && currentUser.id === userId) {
      alert('Kendi hesabınızı silemezsiniz!');
      return;
    }
    const userToDelete = users.find(u => u.id === userId);
    setUsers(users.filter(u => u.id !== userId));
    addLog('Kullanıcı Silme', `${userToDelete?.name} sistemi üzerinden silindi.`);
  };

  return (
    <AppContext.Provider value={{
      currentUser, users, leads, roles, logs,
      login, logout, addLead, assignLead, addRole, addUser, addLeadHistory, updateUser, deleteUser, addLog
    }}>
      {children}
    </AppContext.Provider>
  );
};
