"use client";

import React, { useState, useEffect } from 'react';
import { format, isAfter, parseISO } from 'date-fns';
import { ChartBarIcon, ExclamationCircleIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

// Types
interface Invoice {
  Network: string;
  Pay_Period_Start_Date: string;
  Pay_Period_End_Date: string;
  Due_Date: string;
  Amount_Due: string;
  Invoice_Number: string;
  Amount_Paid: string;
  Date_Paid: string;
  Pay_Period: string;
  Net_Terms: string;
  Status: string;
}

interface Alert {
  id: string;
  type: 'overdue' | 'missing_network' | 'period_end' | 'discrepancy' | 'error';
  message: string;
}

// At the top of the file, add a utility function for generating unique IDs
const generateUniqueId = (() => {
  let counter = 0;
  return (prefix: string) => `${prefix}-${Date.now()}-${counter++}`;
})();

// Summary Card Component
const SummaryCard = ({ title, value, icon: Icon, color }: { 
  title: string; 
  value: string | number; 
  icon: any;
  color: string;
}) => (
  <div className={`p-4 bg-white rounded-lg shadow-sm border ${color} hover:shadow-md transition-shadow`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{title}</p>
        <p className="text-xl font-semibold text-gray-900">{value}</p>
      </div>
      <Icon className="h-6 w-6 text-gray-400" />
    </div>
  </div>
);

// Enhanced Alert Component
const AlertDisplay = ({ alert }: { alert: Alert }) => {
  const alertConfig = {
    overdue: {
      icon: ExclamationCircleIcon,
      style: 'bg-red-50 text-red-700 border-red-200',
      iconColor: 'text-red-400'
    },
    missing_network: {
      icon: XCircleIcon,
      style: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      iconColor: 'text-yellow-400'
    },
    period_end: {
      icon: ChartBarIcon,
      style: 'bg-blue-50 text-blue-700 border-blue-200',
      iconColor: 'text-blue-400'
    },
    discrepancy: {
      icon: ExclamationCircleIcon,
      style: 'bg-orange-50 text-orange-700 border-orange-200',
      iconColor: 'text-orange-400'
    },
    error: {
      icon: XCircleIcon,
      style: 'bg-gray-50 text-gray-700 border-gray-200',
      iconColor: 'text-gray-400'
    }
  };

  const config = alertConfig[alert.type];
  const Icon = config.icon;

  return (
    <div className={`p-3 mb-2 border rounded-lg shadow-sm ${config.style} flex items-center space-x-2`}>
      <Icon className={`h-4 w-4 ${config.iconColor}`} />
      <span className="text-sm">{alert.message}</span>
    </div>
  );
};

// Enhanced Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
  const config = {
    Paid: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      icon: CheckCircleIcon
    },
    Unpaid: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      icon: XCircleIcon
    },
    default: {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      icon: XCircleIcon
    }
  };

  const statusConfig = config[status as keyof typeof config] || config.default;
  const Icon = statusConfig.icon;

  return (
    <span className={`px-2 py-0.5 inline-flex items-center space-x-1 text-xs font-medium rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
      <Icon className="h-3 w-3" />
      <span>{status}</span>
    </span>
  );
};

// Filter Bar Component
const FilterBar = ({ onFilterChange }: { onFilterChange: (filter: string) => void }) => (
  <div className="mb-4 flex space-x-3">
    <input
      type="text"
      placeholder="Search networks..."
      className="px-3 py-1.5 text-sm border rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
      onChange={(e) => onFilterChange(e.target.value)}
    />
    <select className="px-3 py-1.5 text-sm border rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent">
      <option value="all">All Statuses</option>
      <option value="paid">Paid</option>
      <option value="unpaid">Unpaid</option>
    </select>
  </div>
);

// Add a new component for grouping alerts by network
const GroupedAlerts = ({ alerts }: { alerts: Alert[] }) => {
  const missingNetworks = alerts
    .filter(alert => alert.type === 'missing_network')
    .map(alert => alert.message.split(' is ')[0].replace('Network ', ''));

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h2 className="text-base font-semibold mb-3">Missing Networks ({missingNetworks.length})</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {missingNetworks.map((network) => (
          <div key={network} className="bg-yellow-50 text-yellow-700 px-3 py-2 rounded-md text-sm">
            {network}
          </div>
        ))}
      </div>
    </div>
  );
};

// Invoice Table Row Component
const InvoiceTableRow = ({
  invoice,
  onPaymentUpdate
}: {
  invoice: Invoice;
  onPaymentUpdate: (invoiceId: string, amount: string, date: string) => void;
}) => (
  <tr className="bg-white hover:bg-gray-50 transition-colors duration-200">
    <td className="px-4 py-3 text-sm">{invoice.Network}</td>
    <td className="px-4 py-3 text-sm">{invoice.Invoice_Number || '—'}</td>
    <td className="px-4 py-3 text-sm">{invoice.Due_Date}</td>
    <td className="px-4 py-3 text-sm font-medium">
      {parseFloat(invoice.Amount_Due || '0').toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD'
      })}
    </td>
    <td className="px-4 py-3">
      <input
        type="text"
        className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500"
        value={invoice.Amount_Paid || ''}
        placeholder="Enter amount"
        onChange={(e) => onPaymentUpdate(invoice.Invoice_Number, e.target.value, invoice.Date_Paid)}
      />
    </td>
    <td className="px-4 py-3">
      <input
        type="date"
        className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500"
        value={invoice.Date_Paid || ''}
        onChange={(e) => onPaymentUpdate(invoice.Invoice_Number, invoice.Amount_Paid, e.target.value)}
      />
    </td>
    <td className="px-4 py-3">
      <StatusBadge status={invoice.Status || 'Needs Invoicing'} />
    </td>
    <td className="px-4 py-3">
      <button
        onClick={() => onPaymentUpdate(invoice.Invoice_Number, invoice.Amount_Due, format(new Date(), 'yyyy-MM-dd'))}
        className="px-3 py-1 text-xs font-medium text-white bg-blue-500 rounded hover:bg-blue-600 focus:ring-2"
      >
        Mark as Paid
      </button>
    </td>
  </tr>
);

const NetworkAccountingDashboard = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [networks, setNetworks] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const checkAlerts = (invoiceData: Invoice[], networkList: string[]) => {
    const newAlerts: Alert[] = [];
    const today = new Date();

    // Check for overdue invoices
    invoiceData.forEach(invoice => {
      if (invoice.Status === 'Unpaid' && isAfter(today, parseISO(invoice.Due_Date))) {
        newAlerts.push({
          id: generateUniqueId('overdue'),
          type: 'overdue',
          message: `Invoice ${invoice.Invoice_Number} for ${invoice.Network} is overdue`
        });
      }
    });

    // Check for missing networks
    const accountingNetworks = [...new Set(invoiceData.map(inv => inv.Network))];
    networkList.forEach(network => {
      if (!accountingNetworks.includes(network)) {
        newAlerts.push({
          id: generateUniqueId('missing'),
          type: 'missing_network',
          message: `Network ${network} is missing from accounting records`
        });
      }
    });

    // Check for period ends
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    invoiceData.forEach(invoice => {
      if (invoice.Pay_Period_End_Date && 
          isAfter(parseISO(invoice.Pay_Period_End_Date), yesterday) && 
          isAfter(today, parseISO(invoice.Pay_Period_End_Date))) {
        newAlerts.push({
          id: generateUniqueId('period'),
          type: 'period_end',
          message: `Period ended for ${invoice.Network}. Generate new invoice.`
        });
      }
    });

    setAlerts(newAlerts);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load cash flow data
        const cashFlowResponse = await fetch('/api/sheets?sheet=cashFlow&range=Main Sheet!A:K');
        const cashFlowData = await cashFlowResponse.json();
        const uniqueNetworks = [...new Set(cashFlowData.data.slice(1).map((row: string[]) => row[1]))].filter((val): val is string => Boolean(val));
        setNetworks(uniqueNetworks);

        // Load network accounting data
        const accountingResponse = await fetch('/api/sheets?sheet=networkAccounting&range=A:K');
        const accountingData = await accountingResponse.json();
        
        // Convert sheet data to invoice objects
        const invoicesData = accountingData.data.slice(1).map((row: string[]) => ({
          Network: row[0],
          Pay_Period_Start_Date: row[1],
          Pay_Period_End_Date: row[2],
          Due_Date: row[3],
          Amount_Due: row[4],
          Invoice_Number: row[5],
          Amount_Paid: row[6],
          Date_Paid: row[7],
          Pay_Period: row[8],
          Net_Terms: row[9],
          Status: row[10]
        }));

        setInvoices(invoicesData);
        checkAlerts(invoicesData, uniqueNetworks);
      } catch (error) {
        console.error('Error loading data:', error);
        setAlerts(prev => [...prev, {
          id: generateUniqueId('error'),
          type: 'error',
          message: 'Failed to load invoice data. Please try again.'
        }]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handlePaymentUpdate = async (invoiceId: string, amount: string, date: string) => {
    try {
      const invoiceIndex = invoices.findIndex(inv => inv.Invoice_Number === invoiceId);
      if (invoiceIndex === -1) return;

      const updatedInvoices = [...invoices];
      const updatedInvoice = {
        ...updatedInvoices[invoiceIndex],
        Amount_Paid: amount,
        Date_Paid: date,
        Status: amount ? 'Paid' : 'Unpaid'
      };
      updatedInvoices[invoiceIndex] = updatedInvoice;
      setInvoices(updatedInvoices);

      const rowNumber = invoiceIndex + 2;
      await fetch('/api/sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sheetName: 'networkAccounting',
          range: `G${rowNumber}:K${rowNumber}`,
          values: [[amount, date, updatedInvoice.Pay_Period, updatedInvoice.Net_Terms, updatedInvoice.Status]]
        }),
      });

      // Check for payment discrepancy
      const dueAmount = parseFloat(updatedInvoice.Amount_Due.replace(/[$,]/g, ''));
      const paidAmount = parseFloat(amount.replace(/[$,]/g, ''));
      
      if (!isNaN(dueAmount) && !isNaN(paidAmount) && dueAmount !== paidAmount) {
        setAlerts(prev => [...prev, {
          id: generateUniqueId('discrepancy'),
          type: 'discrepancy',
          message: `Payment discrepancy detected for invoice ${invoiceId}: Expected $${dueAmount}, received $${paidAmount}`
        }]);
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      setAlerts(prev => [...prev, {
        id: generateUniqueId('error'),
        type: 'error',
        message: 'Failed to update payment. Please try again.'
      }]);
    }
  };

  // Calculate summary statistics
  const summaryStats = {
    totalInvoices: invoices.length,
    unpaidInvoices: invoices.filter(inv => inv.Status === 'Unpaid').length,
    totalAmount: invoices.reduce((sum, inv) => {
      const amount = inv.Amount_Due?.replace(/[$,]/g, '') || '0';
      return sum + (parseFloat(amount) || 0);
    }, 0),
    missingNetworks: networks.length - new Set(invoices.map(inv => inv.Network)).size
  };

  // Filter invoices based on search
  const filteredInvoices = invoices.filter(invoice => {
    const searchTerm = filter.toLowerCase();
    const network = invoice.Network?.toLowerCase() || '';
    const invoiceNumber = invoice.Invoice_Number?.toLowerCase() || '';
    
    return network.includes(searchTerm) || invoiceNumber.includes(searchTerm);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Network Accounting Dashboard</h1>
        <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 text-sm rounded-md transition-colors">
          Export Data
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard 
          title="Total Invoices" 
          value={summaryStats.totalInvoices}
          icon={ChartBarIcon}
          color="border-blue-100"
        />
        <SummaryCard 
          title="Unpaid Invoices" 
          value={summaryStats.unpaidInvoices}
          icon={ExclamationCircleIcon}
          color="border-red-100"
        />
        <SummaryCard 
          title="Total Amount" 
          value={`$${summaryStats.totalAmount.toLocaleString()}`}
          icon={ChartBarIcon}
          color="border-green-100"
        />
        <SummaryCard 
          title="Missing Networks" 
          value={summaryStats.missingNetworks}
          icon={XCircleIcon}
          color="border-yellow-100"
        />
      </div>

      {/* Group missing network alerts separately */}
      {alerts.some(alert => alert.type === 'missing_network') && (
        <GroupedAlerts alerts={alerts} />
      )}

      {/* Other alerts */}
      {alerts.some(alert => alert.type !== 'missing_network') && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-base font-semibold mb-3">Alerts</h2>
          <div className="space-y-2">
            {alerts
              .filter(alert => alert.type !== 'missing_network')
              .map((alert) => (
                <AlertDisplay key={alert.id} alert={alert} />
              ))}
          </div>
        </div>
      )}

      {/* Enhanced Filter Bar */}
      <div className="flex flex-wrap gap-3 bg-white p-4 rounded-lg shadow-sm">
        <input
          type="text"
          placeholder="Search networks..."
          className="flex-1 min-w-[200px] px-3 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-500"
          onChange={(e) => setFilter(e.target.value)}
        />
        <select className="px-3 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-500">
          <option value="all">All Statuses</option>
          <option value="needs_invoicing">Needs Invoicing</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
        </select>
      </div>

      {/* Table with fixed layout */}
      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full">
          <colgroup>
            <col className="w-[15%]" /> {/* Network */}
            <col className="w-[10%]" /> {/* Invoice # */}
            <col className="w-[10%]" /> {/* Due Date */}
            <col className="w-[12%]" /> {/* Amount Due */}
            <col className="w-[15%]" /> {/* Amount Paid */}
            <col className="w-[15%]" /> {/* Date Paid */}
            <col className="w-[10%]" /> {/* Status */}
            <col className="w-[13%]" /> {/* Actions */}
          </colgroup>
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Network</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount Due</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount Paid</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Paid</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredInvoices.map((invoice, index) => (
              <InvoiceTableRow
                key={`${invoice.Invoice_Number}-${invoice.Network}-${index}`}
                invoice={invoice}
                onPaymentUpdate={handlePaymentUpdate}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NetworkAccountingDashboard;