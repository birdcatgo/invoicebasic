"use client";

import React, { useState, useRef, useEffect } from 'react';
import { BarChart3 } from 'lucide-react'; // Only keep what you need
import { useNetworkData } from '@/hooks/useNetworkData'; // Only keep what you need
import Link from 'next/link';
import type { Invoice } from '@/types/invoice';

// Define Sections type
interface Sections {
  currentPeriod: Invoice[];
  unpaidInvoices: Invoice[];
  discrepancyCheck: Invoice[];
  needsInvoicing: Invoice[];
  alertInvoices: Invoice[];
}

// Define SectionKey type (remove null)
type SectionKey = keyof Sections;

// Define InvoiceTableProps type
interface InvoiceTableProps {
  invoices: Invoice[];
  onUpdate: (invoice: Invoice, section?: SectionKey) => void;
  onUndo: (invoice: Invoice) => void;
  type: 'invoicing' | 'unpaid' | 'current';
}

// StatsCard Component
const StatsCard = ({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ElementType }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-sm text-gray-500">{title}</h3>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
      <div className="bg-blue-50 p-2 rounded-lg">
        <Icon className="h-5 w-5 text-blue-500" />
      </div>
    </div>
    <div className="mt-2">
      <BarChart3 className="h-4 w-4 text-gray-400" />
    </div>
  </div>
);

// InvoiceRow Component
interface InvoiceRowProps {
  invoice: Invoice;
  onUpdate: (invoice: Invoice, section?: SectionKey) => void;
  onUndo: (invoice: Invoice) => void;
  type: 'invoicing' | 'unpaid' | 'current';
}

const InvoiceRow = ({ invoice, onUpdate, onUndo, type }: InvoiceRowProps) => {
  const invoiceNumberRef = useRef<HTMLInputElement>(null);
  const dashboardAmountRef = useRef<HTMLInputElement>(null);
  const amountPaidRef = useRef<HTMLInputElement>(null);
  const paidDateRef = useRef<HTMLInputElement>(null);
  const dueStatusRef = useRef<HTMLSelectElement>(null);

  const formatCurrency = (amount: string) => {
    const value = parseFloat(amount.replace(/[$,]/g, '') || '0');
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(value);
  };

  const handleUpdate = () => {
    if (type === 'current') {
      const updatedInvoice = {
        ...invoice,
        Invoice_Number: invoiceNumberRef.current?.value || '',
        Amount_Due: dashboardAmountRef.current?.value?.replace(/[$,]/g, '') || invoice.Amount_Due,
      };
      onUpdate(updatedInvoice, 'currentPeriod');
    } else if (type === 'unpaid') {
      const updatedInvoice = {
        ...invoice,
        Amount_Paid: amountPaidRef.current?.value?.replace(/[$,]/g, '') || '0',
        Paid_Date: paidDateRef.current?.value || '',
        Due_Status: dueStatusRef.current?.value || 'Not Due'
      };
      onUpdate(updatedInvoice, 'unpaidInvoices');
    }
  };

  const formatDate = (date: string) => {
    return date ? new Date(date).toLocaleDateString() : '';
  };

  const isDiscrepancy = (invoice: Invoice) => {
    const amountDue = parseFloat(invoice.Amount_Due.replace(/[$,]/g, '') || '0');
    const amountPaid = parseFloat(invoice.Amount_Paid.replace(/[$,]/g, '') || '0');
    return amountPaid > 0 && amountPaid < amountDue;
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{invoice.Network}</td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{invoice.Pay_Period}</td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatCurrency(invoice.Amount_Due)}</td>
      <td className="px-4 py-3 whitespace-nowrap">
        {type === 'current' ? (
          <input
            ref={invoiceNumberRef}
            type="text"
            className="w-32 px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500"
            defaultValue={invoice.Invoice_Number}
            placeholder="Enter invoice #"
          />
        ) : (
          <span className="text-sm text-gray-900">{invoice.Invoice_Number}</span>
        )}
      </td>
      {type === 'unpaid' && (
        <>
          <td className="px-4 py-3 whitespace-nowrap">
            <select
              ref={dueStatusRef}
              className="w-32 px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500"
              defaultValue={invoice.Due_Status}
            >
              <option value="Not Due">Not Due</option>
              <option value="Overdue">Overdue</option>
              <option value="Paid">Paid</option>
              <option value="Alert">Alert</option>
            </select>
          </td>
          <td className="px-4 py-3 whitespace-nowrap">
            <input
              ref={amountPaidRef}
              type="text"
              className="w-32 px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500"
              defaultValue={formatCurrency(invoice.Amount_Paid)}
              placeholder="Enter amount"
            />
          </td>
          <td className="px-4 py-3 whitespace-nowrap">
            <input
              ref={paidDateRef}
              type="date"
              className="w-32 px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500"
              defaultValue={invoice.Paid_Date}
            />
          </td>
        </>
      )}
      <td className="px-4 py-3 whitespace-nowrap">
        {type === 'current' ? (
          <input
            ref={dashboardAmountRef}
            type="text"
            className="w-32 px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500"
            defaultValue={formatCurrency(invoice.Amount_Due)}
            placeholder="Enter amount"
          />
        ) : (
          <span className="text-sm text-gray-900">{formatCurrency(invoice.Payment_Difference)}</span>
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap space-x-2">
        <button
          className="px-3 py-1 text-blue-600 hover:text-blue-900 border border-blue-600 rounded"
          onClick={handleUpdate}
        >
          Update
        </button>
        <button
          className="px-3 py-1 text-gray-600 hover:text-gray-900 border border-gray-600 rounded"
          onClick={() => onUndo(invoice)}
        >
          Undo
        </button>
      </td>
    </tr>
  );
};

// InvoiceTable Component
const InvoiceTable = ({ invoices, onUpdate, onUndo, type }: InvoiceTableProps) => {
  return (
    <div className="mt-6 bg-white rounded-lg shadow overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Network</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pay Period</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Due</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Number</th>
            {type === 'unpaid' && (
              <>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Paid</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid Date</th>
              </>
            )}
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {type === 'current' ? 'Dashboard Amount' : 'Payment Difference'}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {invoices.map((invoice: Invoice, index: number) => (
            <InvoiceRow
              key={`${invoice.Network}-${invoice.Pay_Period}-${index}`}
              invoice={invoice}
              onUpdate={(invoice) => onUpdate(invoice, type === 'current' ? 'currentPeriod' : type === 'unpaid' ? 'unpaidInvoices' : 'discrepancyCheck')}
              onUndo={onUndo}
              type={type}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

// CurrentPeriodSection Component
const CurrentPeriodSection = ({ 
  invoices, 
  onUpdate, 
  onUndo 
}: { 
  invoices: Invoice[], 
  onUpdate: (invoice: Invoice, section?: SectionKey) => void,  // Make section parameter optional
  onUndo: (invoice: Invoice) => void 
}) => (
  <div className="mb-8">
    <h2 className="text-lg font-semibold mb-4">Current Period</h2>
    <InvoiceTable 
      invoices={invoices} 
      onUpdate={(invoice) => onUpdate(invoice, 'currentPeriod')}
      onUndo={onUndo} 
      type="current" 
    />
  </div>
);

// DiscrepancyCheckSection Component
const DiscrepancyCheckSection = ({ invoices, onUpdate, onUndo }: { 
  invoices: Invoice[], 
  onUpdate: (invoice: Invoice, section?: SectionKey) => void, 
  onUndo: (invoice: Invoice) => void 
}) => (
  <div className="mb-8">
    <h2 className="text-lg font-semibold mb-4">Discrepancy Check</h2>
    <InvoiceTable invoices={invoices} onUpdate={onUpdate} onUndo={onUndo} type="unpaid" />
  </div>
);

// AlertSection Component
const AlertSection = ({ invoices, onUpdate, onUndo }: { 
  invoices: Invoice[], 
  onUpdate: (invoice: Invoice, section?: SectionKey) => void, 
  onUndo: (invoice: Invoice) => void 
}) => (
  <div className="mb-8">
    <h2 className="text-lg font-semibold mb-4 text-red-600">Payment Alerts</h2>
    <InvoiceTable invoices={invoices} onUpdate={onUpdate} onUndo={onUndo} type="unpaid" />
  </div>
);

// InvoicingSection Component
export const InvoicingSection = ({ invoices, onUpdate, onUndo }: { 
  invoices: Invoice[], 
  onUpdate: (invoice: Invoice, section?: SectionKey) => void, 
  onUndo: (invoice: Invoice) => void 
}) => {
  const filteredInvoices = invoices.filter(inv => inv.Network && inv.Amount_Due !== '0');
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-4">Needs Invoicing</h2>
      <InvoiceTable invoices={filteredInvoices} onUpdate={onUpdate} onUndo={onUndo} type="invoicing" />
    </div>
  );
};

// UnpaidSection Component
export const UnpaidSection = ({ invoices, onUpdate, onUndo }: { 
  invoices: Invoice[], 
  onUpdate: (invoice: Invoice, section?: SectionKey) => void, 
  onUndo: (invoice: Invoice) => void 
}) => (
  <div className="mb-8">
    <h2 className="text-lg font-semibold mb-4">Unpaid Invoices</h2>
    <InvoiceTable invoices={invoices} onUpdate={onUpdate} onUndo={onUndo} type="unpaid" />
  </div>
);

// Main Dashboard Component
const NetworkAccountingDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { loading, error, invoices, setInvoices } = useNetworkData();
  const [sections, setSections] = useState<Sections>({
    currentPeriod: [],
    unpaidInvoices: [],
    discrepancyCheck: [],
    needsInvoicing: [],
    alertInvoices: [],
  });

  useEffect(() => {
    if (invoices) {
      const parsedData = parseData(invoices);
      setSections(parsedData);
    }
  }, [invoices]);

  const parseData = (data: any[]): Sections => {
    console.log('Raw data:', data);

    const sections: Sections = {
      currentPeriod: [],
      unpaidInvoices: [],
      discrepancyCheck: [],
      needsInvoicing: [],
      alertInvoices: [],
    };

    let currentSection: SectionKey | null = null;

    data.forEach((row, index) => {
      if (row.length === 0) return;

      // Detect section headers
      if (row[0] === 'Current Network Exposure') {
        currentSection = 'currentPeriod';
        return;
      } else if (row[0] === 'Unpaid Invoices') {
        currentSection = 'unpaidInvoices';
        return;
      } else if (row[0] === 'Payment Alerts') {  // Updated header name
        currentSection = 'alertInvoices';
        return;
      } else if (row[0] === 'Discrepancy Check:') {
        currentSection = 'discrepancyCheck';
        return;
      } else if (row[0] === 'Needs Invoicing:') {
        currentSection = 'needsInvoicing';
        return;
      }

      // Skip header rows
      if (row[0] === 'Network' || !currentSection) return;

      // Map rows to objects
      if (row[0] && typeof row[0] === 'string') {
        let invoice: Invoice;
        
        if (currentSection === 'currentPeriod') {
          invoice = {
            Network: row[0] || '',
            Invoice_Number: row[1] || '',
            Amount_Due: row[2]?.replace(/[$,]/g, '') || '0',
            Pay_Period: row[3] || '',
            Status: '',
            Due_Status: 'Not Due',
            Amount_Paid: '0',
            Paid_Date: '',
            Payment_Difference: '0',
            Ad_Revenue: '0'
          };
        } else if (currentSection === 'alertInvoices') {  // Special handling for Payment Alerts
          invoice = {
            Network: row[0] || '',
            Invoice_Number: row[1] || '',
            Amount_Due: row[2]?.replace(/[$,]/g, '') || '0',
            Amount_Paid: row[3]?.replace(/[$,]/g, '') || '0',
            Payment_Difference: row[4]?.replace(/[$,]/g, '') || '0',
            Pay_Period: row[5] || '',
            Status: 'Alert',
            Due_Status: 'Alert',
            Paid_Date: '',
            Ad_Revenue: '0'
          };
        } else {
          invoice = {
            Network: row[0] || '',
            Invoice_Number: row[1] || '',
            Amount_Due: row[2]?.replace(/[$,]/g, '') || '0',
            Status: row[3] || '',
            Pay_Period: row[4] || '',
            Due_Status: row[5] === 'Yes' ? 'Overdue' : 'Not Due',
            Amount_Paid: row[6] || '0',
            Paid_Date: row[7] || '',
            Payment_Difference: row[8] || '0',
            Ad_Revenue: row[9] || '0'
          };
        }

        if (currentSection) {
          sections[currentSection].push(invoice);
        }
      }
    });

    console.log('Parsed sections:', sections);
    return sections;
  };

  // Filter invoices based on search term and status
  const filterInvoices = (invoices: Invoice[], searchTerm: string, statusFilter: string) => {
    return invoices.filter((invoice: Invoice) => {
      const matchesSearch = !searchTerm || invoice.Network.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || invoice.Status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  const filteredUnpaidInvoices = filterInvoices(sections.unpaidInvoices, searchTerm, statusFilter);
  const filteredNeedsInvoicing = filterInvoices(sections.needsInvoicing, searchTerm, statusFilter);
  const filteredCurrentPeriod = filterInvoices(sections.currentPeriod, searchTerm, statusFilter);
  const filteredDiscrepancyCheck = filterInvoices(sections.discrepancyCheck, searchTerm, statusFilter);

  // Handle update and undo
  const handleUpdate = async (invoice: Invoice, section?: SectionKey) => {
    try {
      if (!section) return; // Early return if section is undefined
      
      const updatedInvoice = { ...invoice };
      const updatedSections = { ...sections };
      updatedSections[section] = updatedSections[section].map((inv: Invoice) =>
        inv.Network === invoice.Network ? updatedInvoice : inv
      );

      setSections(updatedSections);
    } catch (error) {
      console.error('Failed to update invoice:', error);
    }
  };

  const handleUndo = (section: SectionKey) => {
    // Restore the previous state
    const updatedSections = { ...sections };
    updatedSections[section] = sections[section];
    setSections(updatedSections);
  };

  // Render sections
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold mb-8">Network Accounting Dashboard</h1>

        {/* Link to Network Details Page */}
        <Link href="/network-details">
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            View Network Details
          </button>
        </Link>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow p-4 mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search networks..."
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="px-4 py-2 border rounded-lg bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Needs Invoicing">Needs Invoicing</option>
            </select>
          </div>
        </div>

        {/* Current Period Section */}
        {filteredCurrentPeriod.length > 0 && (
          <CurrentPeriodSection
            invoices={filteredCurrentPeriod}
            onUpdate={(invoice: Invoice) => handleUpdate(invoice, 'currentPeriod')}
            onUndo={() => handleUndo('currentPeriod')}
          />
        )}

        {/* Alert Section */}
        {sections.alertInvoices.length > 0 && (
          <AlertSection
            invoices={sections.alertInvoices}
            onUpdate={(invoice: Invoice) => handleUpdate(invoice, 'alertInvoices')}
            onUndo={() => handleUndo('alertInvoices')}
          />
        )}

        {/* Unpaid Invoices Section */}
        {filteredUnpaidInvoices.length > 0 && (
          <UnpaidSection
            invoices={filteredUnpaidInvoices}
            onUpdate={(invoice: Invoice) => handleUpdate(invoice, 'unpaidInvoices')}
            onUndo={() => handleUndo('unpaidInvoices')}
          />
        )}

        {/* Discrepancy Check Section */}
        {filteredDiscrepancyCheck.length > 0 && (
          <DiscrepancyCheckSection
            invoices={filteredDiscrepancyCheck}
            onUpdate={(invoice: Invoice) => handleUpdate(invoice, 'discrepancyCheck')}
            onUndo={() => handleUndo('discrepancyCheck')}
          />
        )}

        {/* Needs Invoicing Section */}
        {filteredNeedsInvoicing.length > 0 && (
          <InvoicingSection
            invoices={filteredNeedsInvoicing}
            onUpdate={(invoice: Invoice) => handleUpdate(invoice, 'needsInvoicing')}
            onUndo={() => handleUndo('needsInvoicing')}
          />
        )}
      </div>
    </div>
  );
};

export default NetworkAccountingDashboard;

// Helper function for Due Status colors
const getDueStatusColor = (status: string) => {
  switch (status) {
    case 'Overdue': return 'bg-red-100 text-red-800';
    case 'Alert': return 'bg-yellow-100 text-yellow-800';
    case 'Paid': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};