"use client";

import { useState, useEffect } from 'react';
import type { Invoice } from '@/types/invoice';

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

  // Fetch all data
  const fetchData = async () => {
    try {
      const response = await fetch('/api/sheets?sheet=networkAccounting&range=A:Z');
      const data = await response.json();
      console.log('Fetched data:', data);
      
      if (data.success && data.data) {
        setInvoices(data.data);
      } else {
        setError('Failed to fetch data');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { loading, error, invoices, setInvoices, summaryStats, missingNetworks: summaryStats.missingNetworks, networks };
};

export const updateInvoice = async (invoice: Invoice) => {
  // Implement the update logic here
  // This should make an API call to update the Google Sheet
  console.log('Updating invoice:', invoice);
};