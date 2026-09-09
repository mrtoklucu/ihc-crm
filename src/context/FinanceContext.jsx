import React, { createContext, useState, useEffect, useContext } from 'react';
import { db } from '../config/firebase';
import { collection, doc, getDocs, addDoc, query, orderBy, where, deleteDoc, updateDoc, increment, Timestamp } from 'firebase/firestore';
import { AppContext } from './AppContext';

export const FinanceContext = createContext();

export const FinanceProvider = ({ children }) => {
  const { tenantSlug, addLog, currentUser } = useContext(AppContext);
  const [loading, setLoading] = useState(true);
  
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [cashDesk, setCashDesk] = useState({ balance: 0, operations: [] });

  useEffect(() => {
    if (!tenantSlug) return;
    
    const fetchFinanceData = async () => {
      setLoading(true);
      try {
        const tenantRef = doc(db, 'tenants', tenantSlug);
        
        // Sales
        const salesSnap = await getDocs(query(collection(tenantRef, 'sales'), orderBy('date', 'desc')));
        const salesList = salesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSales(salesList);

        // Expenses
        const expensesSnap = await getDocs(query(collection(tenantRef, 'expenses'), orderBy('date', 'desc')));
        const expensesList = expensesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setExpenses(expensesList);

        // Companies (Suppliers/Vendors)
        const companiesSnap = await getDocs(collection(tenantRef, 'finance_companies'));
        setCompanies(companiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Calculate Balance
        let balance = 0;
        salesList.forEach(s => { if(s.status === 'collected') balance += Number(s.amount); });
        expensesList.forEach(e => { balance -= Number(e.amount); });
        
        setCashDesk({ balance, operations: [] }); // Simple implementation for now

      } catch (err) {
        console.error("Finance data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFinanceData();
  }, [tenantSlug]);

  const addSale = async (saleData) => {
    try {
      const tenantRef = doc(db, 'tenants', tenantSlug);
      const newSale = {
        ...saleData,
        date: new Date().toISOString(),
        createdBy: currentUser?.name || 'Sistem',
        status: saleData.status || 'pending'
      };
      const docRef = await addDoc(collection(tenantRef, 'sales'), newSale);
      setSales(prev => [{ id: docRef.id, ...newSale }, ...prev]);
      addLog('Finans - Yeni Satış', `${saleData.amount} tutarında satış kaydedildi.`);
      return true;
    } catch (err) {
      console.error("Add sale error:", err);
      return false;
    }
  };

  const addExpense = async (expenseData) => {
    try {
      const tenantRef = doc(db, 'tenants', tenantSlug);
      const newExpense = {
        ...expenseData,
        date: new Date().toISOString(),
        createdBy: currentUser?.name || 'Sistem'
      };
      const docRef = await addDoc(collection(tenantRef, 'expenses'), newExpense);
      setExpenses(prev => [{ id: docRef.id, ...newExpense }, ...prev]);
      addLog('Finans - Gider', `${expenseData.amount} tutarında gider kaydedildi.`);
      return true;
    } catch (err) {
      console.error("Add expense error:", err);
      return false;
    }
  };

  const addCompany = async (companyData) => {
    try {
      const tenantRef = doc(db, 'tenants', tenantSlug);
      const docRef = await addDoc(collection(tenantRef, 'finance_companies'), companyData);
      setCompanies(prev => [...prev, { id: docRef.id, ...companyData }]);
      return true;
    } catch (err) {
      console.error("Add company error:", err);
      return false;
    }
  };

  return (
    <FinanceContext.Provider value={{
      loading, sales, expenses, companies, cashDesk,
      addSale, addExpense, addCompany
    }}>
      {children}
    </FinanceContext.Provider>
  );
};
