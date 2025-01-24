import React from 'react';
import { useNetworkData, updateInvoice } from '@/hooks/useNetworkData';
import { ArrowLeft } from 'lucide-react';
import { InvoicingSection, UnpaidSection } from './NetworkAccountingDashboard';
import { networkAliases } from '@/utils/networkAliases';

interface NetworkViewProps {
  networkName: string;
  onBack: () => void;
}

const NetworkView = ({ networkName, onBack }: NetworkViewProps) => {
  const { loading, error, invoices, setInvoices } = useNetworkData();

  const handleUpdate = async (invoice: any) => {
    try {
      await updateInvoice(invoice);
      const updatedInvoices = invoices.map(inv => 
        inv.Network === invoice.Network ? invoice : inv
      );
      setInvoices(updatedInvoices);
    } catch (error) {
      console.error('Error updating invoice:', error);
    }
  };

  const handleUndo = (invoice: any) => {
    // Implement undo logic if needed
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  // Filter invoices for this network - case insensitive matching
  const networkInvoices = invoices
    .filter(inv => {
      const invNetwork = inv.Network.trim().toLowerCase();
      const searchNetwork = networkName.toLowerCase();
      
      // Check if either name matches any alias
      const invAlias = Object.entries(networkAliases)
        .find(([key, _]) => key.toLowerCase() === invNetwork)?.[1]?.toLowerCase();
      const searchAlias = Object.entries(networkAliases)
        .find(([key, _]) => key.toLowerCase() === searchNetwork)?.[1]?.toLowerCase();
      
      return invNetwork === searchNetwork || 
             invNetwork === searchAlias || 
             invAlias === searchNetwork || 
             invAlias === searchAlias;
    })
    .sort((a, b) => {
      // Sort by Pay Period End date, most recent first
      return new Date(b.Pay_Period_End).getTime() - new Date(a.Pay_Period_End).getTime();
    });

  // Create sections for different statuses
  const needsInvoicing = networkInvoices.filter(inv => inv.Status === 'Needs Invoicing');
  const unpaidInvoices = networkInvoices.filter(inv => inv.Status === 'Unpaid');
  const paidInvoices = networkInvoices.filter(inv => inv.Status === 'Paid');
  const futureInvoices = networkInvoices.filter(inv => {
    const dueDate = new Date(inv.Due_Date);
    return dueDate > new Date();
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-8">
          <button 
            onClick={onBack}
            className="mr-4 p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-bold">{networkName}</h1>
        </div>

        {needsInvoicing.length > 0 && (
          <InvoicingSection 
            invoices={needsInvoicing} 
            onUpdate={handleUpdate} 
            onUndo={handleUndo} 
          />
        )}

        {unpaidInvoices.length > 0 && (
          <UnpaidSection 
            invoices={unpaidInvoices} 
            onUpdate={handleUpdate} 
            onUndo={handleUndo} 
          />
        )}

        {paidInvoices.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Paid Invoices</h2>
            <UnpaidSection 
              invoices={paidInvoices} 
              onUpdate={handleUpdate} 
              onUndo={handleUndo} 
            />
          </div>
        )}

        {futureInvoices.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Future Pay Periods</h2>
            <UnpaidSection 
              invoices={futureInvoices} 
              onUpdate={handleUpdate} 
              onUndo={handleUndo} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkView; 