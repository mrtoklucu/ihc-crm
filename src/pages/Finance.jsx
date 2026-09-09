import React from 'react';
import { useParams } from 'react-router-dom';
import NewSale from '../components/finance/NewSale';
import SalesList from '../components/finance/SalesList';
import RecordExpense from '../components/finance/RecordExpense';
import CompanyList from '../components/finance/CompanyList';
import CashDesk from '../components/finance/CashDesk';

const Finance = () => {
  const { subpage } = useParams();

  // Helper to format subpage title
  const getSubpageComponent = (id) => {
    switch(id) {
      case 'new-sale': return <NewSale />;
      case 'sales-list': 
      case 'balance-list':
      case 'incomes':
        return <SalesList />;
      case 'cash-desk': return <CashDesk />;
      case 'record-expense': return <RecordExpense />;
      case 'new-company':
      case 'company-list':
        return <CompanyList />;
      case 'new-purchase':
      case 'expenses':
        return <RecordExpense expenseType="purchase" />; // Placeholder logic for now
      default: return <CashDesk />;
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s' }}>
      {getSubpageComponent(subpage)}
    </div>
  );
};

export default Finance;
