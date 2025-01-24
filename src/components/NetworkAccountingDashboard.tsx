"use client";

import React, { useState, useRef, useEffect } from 'react';
import { BarChart3, AlertCircle, XCircle, Download } from 'lucide-react';
import { useNetworkData, updateInvoice } from '@/hooks/useNetworkData';
import NetworkView from './NetworkView';
import { networkAliases } from '@/utils/networkAliases';
import Link from 'next/link';

// Define Invoice type
interface Invoice {
  Network: string;
  Pay_Period_Start: string;
  Pay_Period_End: string;
  Due_Date: string;
  Amount_Due: string;
  Invoice_Number: string;
  Status: string;
  Due_Status: string;
  Amount_Paid: string;
  Date_Paid: string;
  Payment_Difference: string;
  Ad_Revenue: string; // Required
  Paid_Date: string; // Required
}

// Define Sections type
interface Sections {
  currentPeriod: Invoice[];
  unpaidInvoices: Invoice[];
  discrepancyCheck: Invoice[];
  needsInvoicing: Invoice[];
}

// Define SectionKey type (remove null)
type SectionKey = keyof Sections;

// Define InvoiceTableProps type
interface InvoiceTableProps {
  invoices: Invoice[];
  onUpdate: (invoice: Invoice) => void;
  onUndo: (invoice: Invoice) => void;
  type: 'invoicing' | 'unpaid';
}

// StatsCard Component
const StatsCard = ({ title, value, icon: Icon }: { title: string; value: string | number; icon: any }) => (
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
  onUpdate: (invoice: Invoice) => void;
  onUndo: (invoice: Invoice) => void;
  type: 'invoicing' | 'unpaid';
}

const InvoiceRow = ({ invoice, onUpdate, onUndo, type }: InvoiceRowProps) => {
  const invoiceNumberRef = useRef<HTMLInputElement>(null);
  const amountPaidRef = useRef<HTMLInputElement>(null);
  const datePaidRef = useRef<HTMLInputElement>(null);

  const formatCurrency = (amount: string) => {
    if (!amount) return '';
    const value = parseFloat(amount.replace(/[$,]/g, '') || '0');
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const calculatePaymentDifference = (invoice: Invoice) => {
    const amountDue = parseFloat(invoice.Amount_Due.replace(/[$,]/g, '') || '0');
    const amountPaid = parseFloat(invoice.Amount_Paid.replace(/[$,]/g, '') || '0');
    return amountDue - amountPaid;
  };

  const handleUpdate = () => {
    const updatedInvoice = {
      ...invoice,
      Invoice_Number: invoiceNumberRef.current?.value || '',
      Amount_Paid: amountPaidRef.current?.value?.replace(/[$,]/g, '') || '',
      Paid_Date: datePaidRef.current?.value || '',
    };
    onUpdate(updatedInvoice);
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
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">{invoice.Network}</td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(invoice.Pay_Period_Start)}</td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(invoice.Pay_Period_End)}</td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(invoice.Due_Date)}</td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">{formatCurrency(invoice.Amount_Due)}</td>
      <td className="px-4 py-3 whitespace-nowrap">
        <input
          ref={invoiceNumberRef}
          type="text"
          className="w-32 px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500"
          defaultValue={invoice.Invoice_Number}
          placeholder="Enter invoice #"
        />
      </td>
      {type === 'unpaid' && (
        <>
          <td className="px-4 py-3 whitespace-nowrap">
            <span className={`px-2 py-1 text-sm rounded-full ${
              invoice.Due_Status === 'Overdue' 
                ? 'bg-red-100 text-red-800'
                : invoice.Due_Status === 'Alert'
                ? 'bg-yellow-100 text-yellow-800'
                : invoice.Due_Status === 'Paid'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {invoice.Due_Status}
            </span>
          </td>
          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatCurrency(invoice.Ad_Revenue)}</td>
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
              ref={datePaidRef}
              type="date"
              className="w-32 px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500"
              defaultValue={invoice.Paid_Date}
            />
          </td>
        </>
      )}
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
        {formatCurrency(calculatePaymentDifference(invoice).toString())}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
        {isDiscrepancy(invoice) ? (
          <span className="px-2 py-1 text-sm rounded-full bg-red-100 text-red-800">
            Discrepancy
          </span>
        ) : (
          <span className="px-2 py-1 text-sm rounded-full bg-green-100 text-green-800">
            No Discrepancy
          </span>
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm space-x-2">
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
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pay Period Start</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pay Period End</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Due</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Number</th>
            {type === 'unpaid' && (
              <>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ad Revenue</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Paid</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid Date</th>
              </>
            )}
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Difference</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discrepancy Check</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {invoices.map((invoice: Invoice, index: number) => (
            <InvoiceRow
              key={`${invoice.Network}-${index}`}
              invoice={invoice}
              onUpdate={onUpdate}
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
const CurrentPeriodSection = ({ invoices, onUpdate, onUndo }: { invoices: Invoice[], onUpdate: (invoice: Invoice) => void, onUndo: (invoice: Invoice) => void }) => (
  <div className="mb-8">
    <h2 className="text-lg font-semibold mb-4">Current Period</h2>
    <InvoiceTable invoices={invoices} onUpdate={onUpdate} onUndo={onUndo} type="invoicing" />
  </div>
);

// DiscrepancyCheckSection Component
const DiscrepancyCheckSection = ({ invoices, onUpdate, onUndo }: { invoices: Invoice[], onUpdate: (invoice: Invoice) => void, onUndo: (invoice: Invoice) => void }) => (
  <div className="mb-8">
    <h2 className="text-lg font-semibold mb-4">Discrepancy Check</h2>
    <InvoiceTable invoices={invoices} onUpdate={onUpdate} onUndo={onUndo} type="unpaid" />
  </div>
);

// InvoicingSection Component
const InvoicingSection = ({ invoices, onUpdate, onUndo }: { invoices: Invoice[], onUpdate: (invoice: Invoice) => void, onUndo: (invoice: Invoice) => void }) => {
  const filteredInvoices = invoices.filter(inv => inv.Network && inv.Amount_Due !== '0');
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-4">Needs Invoicing</h2>
      <InvoiceTable invoices={filteredInvoices} onUpdate={onUpdate} onUndo={onUndo} type="invoicing" />
    </div>
  );
};

// UnpaidSection Component
const UnpaidSection = ({ invoices, onUpdate, onUndo }: { invoices: Invoice[], onUpdate: (invoice: Invoice) => void, onUndo: (invoice: Invoice) => void }) => (
  <div className="mb-8">
    <h2 className="text-lg font-semibold mb-4">Unpaid Invoices</h2>
    <InvoiceTable invoices={invoices} onUpdate={onUpdate} onUndo={onUndo} type="unpaid" />
  </div>
);

// Main Dashboard Component
const NetworkAccountingDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { loading, error, invoices, setInvoices, summaryStats, missingNetworks } = useNetworkData();
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [sections, setSections] = useState<Sections>({
    currentPeriod: [],
    unpaidInvoices: [],
    discrepancyCheck: [],
    needsInvoicing: [],
  });

  // Parse the raw data
  useEffect(() => {
    if (invoices) {
      console.log('Raw invoices data:', invoices); // Debugging: Log raw data
      const parsedData = parseData(invoices);
      console.log('Parsed sections:', parsedData); // Debugging: Log parsed data
      setSections(parsedData);
    }
  }, [invoices]);

  const parseData = (data: any[]): Sections => {
    const sections: Sections = {
      currentPeriod: [],
      unpaidInvoices: [],
      discrepancyCheck: [],
      needsInvoicing: [],
    };

    let currentSection: SectionKey | null = null;

    data.forEach((row) => {
      if (row.length === 0 || !row.Network) return; // Skip empty rows or rows without a Network

      // Detect section headers
      if (row.Network === 'Current Period Networks with Ad Revenue:') {
        currentSection = 'currentPeriod';
        return;
      } else if (row.Network === 'Unpaid Invoices:') {
        currentSection = 'unpaidInvoices';
        return;
      } else if (row.Network === 'Discrepancy Check:') {
        currentSection = 'discrepancyCheck';
        return;
      } else if (row.Network === 'Needs Invoicing:') {
        currentSection = 'needsInvoicing';
        return;
      }

      // Skip header rows
      if (row.Network === 'Network') return;

      // Map rows to objects
      const invoice: Invoice = {
        Network: row.Network || '',
        Pay_Period_Start: row.Pay_Period_Start || '',
        Pay_Period_End: row.Pay_Period_End || '',
        Due_Date: row.Due_Date || '',
        Amount_Due: row.Amount_Due || '',
        Invoice_Number: row.Invoice_Number || '',
        Status: row.Status || '',
        Due_Status: row.Due_Status || '',
        Amount_Paid: row.Amount_Paid || '',
        Date_Paid: row.Date_Paid || '',
        Payment_Difference: row.Payment_Difference || '',
        Ad_Revenue: row.Ad_Revenue || '', // Default to empty string if undefined
        Paid_Date: row.Paid_Date || '', // Default to empty string if undefined
      };

      // Add to the appropriate section
      if (currentSection) {
        sections[currentSection].push(invoice);
      } else if (invoice.Status === 'Current') {
        // If no section is explicitly set, but the invoice status is 'Current', add it to currentPeriod
        sections.currentPeriod.push(invoice);
      }
    });

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
  const handleUpdate = async (invoice: Invoice, section: SectionKey) => {
    try {
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