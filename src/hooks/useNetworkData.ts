"use client";

import { useState, useEffect } from 'react';

interface Invoice {
  Network: string;
  Pay_Period_Start: string;
  Pay_Period_End: string;
  Due_Date: string;
  Amount_Due: string;
  Invoice_Number: string;
  Status: string;
  Due_Status: string;
  Ad_Revenue: string;
  Amount_Paid: string;
  Paid_Date: string;
  Payment_Difference: string;
}

interface SummaryStats {
  totalInvoices: number;
  unpaidInvoices: number;
  totalAmount: number;
  missingNetworks: string[];
}

export const useNetworkData = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [networks, setNetworks] = useState<string[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    totalInvoices: 0,
    unpaidInvoices: 0,
    totalAmount: 0,
    missingNetworks: [],
  });

  // Fetch all networks
  const fetchNetworks = async () => {
    try {
      const response = await fetch('/api/networks');
      const data = await response.json();
      setNetworks(data);
    } catch (err) {
      console.error('Error fetching networks:', err);
      setError('Failed to fetch networks');
    }
  };

  // Fetch network details
  const fetchNetworkDetails = (network: string): Invoice[] => {
    return invoices.filter((invoice) => invoice.Network === network);
  };

  // Fetch all data (invoices and networks)
  const fetchData = async () => {
    try {
      // Fetch network accounting data
      const accountingRes = await fetch('/api/sheets?sheet=networkAccounting&range=A2:L');
      const accountingData = await accountingRes.json();

      // Debug log
      console.log('Raw accounting data:', accountingData.data);

      // Fetch cash flow data for network list
      const cashFlowRes = await fetch('/api/sheets?sheet=cashFlow&range=A2:B');
      const cashFlowData = await cashFlowRes.json();

      if (!accountingData.success || !cashFlowData.success) {
        throw new Error('Failed to fetch data');
      }

      // Process invoices
      const processedInvoices = accountingData.data.map((row: any[]) => {
        const dueDate = new Date(row[3]);
        const today = new Date();
        const amountDue = parseFloat((row[4] || '0').replace(/[$,]/g, ''));
        const amountPaid = parseFloat((row[9] || '0').replace(/[$,]/g, ''));
        const paymentDifference = amountDue - amountPaid;

        // Determine status
        let dueStatus = row[7] || 'Not Due';
        if (row[6] === 'Unpaid') {
          if (amountPaid > 0 && Math.abs(paymentDifference) > 0.01) {
            dueStatus = 'Alert'; // Payment discrepancy
          } else if (amountPaid >= amountDue) {
            dueStatus = 'Paid'; // Full payment received
          } else if (dueDate < today) {
            dueStatus = 'Overdue'; // Past due date with no or partial payment
          }
        }

        return {
          Network: row[0] || '',
          Pay_Period_Start: row[1] || '',
          Pay_Period_End: row[2] || '',
          Due_Date: row[3] || '',
          Amount_Due: row[4] || '0',
          Invoice_Number: row[5] || '',
          Status: row[6] || 'Needs Invoicing',
          Due_Status: dueStatus,
          Ad_Revenue: row[8] || '0',
          Amount_Paid: row[9] || '',
          Paid_Date: row[10] || '',
          Payment_Difference: paymentDifference.toFixed(2),
        };
      });

      // Get unique networks from cash flow data
      const allNetworks = new Set(cashFlowData.data.map((row: any[]) => row[1]).filter(Boolean));

      // Calculate missing networks
      const accountingNetworks = new Set(processedInvoices.map((inv: Invoice) => inv.Network));
      const missingNetworks = [...allNetworks].filter((network) => !accountingNetworks.has(network));

      // Calculate summary stats
      const stats: SummaryStats = {
        totalInvoices: processedInvoices.length,
        unpaidInvoices: processedInvoices.filter((inv: Invoice) => inv.Status === 'Unpaid').length,
        totalAmount: processedInvoices.reduce((sum: number, inv: Invoice) => {
          if (!inv.Amount_Due) return sum;
          const amount = parseFloat((inv.Amount_Due || '').replace(/[$,]/g, '') || '0');
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0),
        missingNetworks: [...allNetworks].filter(
          (network): network is string => typeof network === 'string' && !accountingNetworks.has(network)
        ),
      };

      setInvoices(processedInvoices);
      setSummaryStats(stats);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchNetworks();
  }, []);

  return {
    loading,
    error,
    invoices,
    setInvoices,
    summaryStats,
    missingNetworks: summaryStats.missingNetworks,
    networks,
    fetchNetworkDetails,
  };
};

export const updateInvoice = async (invoice: Invoice) => {
  // Implement the update logic here
  // This should make an API call to update the Google Sheet
  console.log('Updating invoice:', invoice);
};