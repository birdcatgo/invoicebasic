"use client";

import React, { useEffect, useState } from 'react';
import { useNetworkData } from '@/hooks/useNetworkData';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Use the same Invoice interface from useNetworkData
interface Invoice {
  Network: string;
  Invoice_Number: string;
  Amount_Due: string;
  Pay_Period?: string;
  Status?: string;
}

const NetworkDetailsPage = () => {
  const { loading, error, networks, fetchNetworkDetails } = useNetworkData();
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [networkInvoices, setNetworkInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    if (selectedNetwork) {
      const invoices = fetchNetworkDetails(selectedNetwork);
      setNetworkInvoices(invoices);
    }
  }, [selectedNetwork, fetchNetworkDetails]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-8">
          <Link href="/">
            <button className="mr-4 p-2 hover:bg-gray-100 rounded-full">
              <ArrowLeft className="h-6 w-6" />
            </button>
          </Link>
          <h1 className="text-2xl font-bold">Network Details</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {networks.map((network) => (
            <button
              key={network}
              onClick={() => setSelectedNetwork(network)}
              className={`p-4 rounded-lg shadow ${
                selectedNetwork === network
                  ? 'bg-blue-50 border-2 border-blue-500'
                  : 'bg-white hover:bg-gray-50'
              }`}
            >
              <h3 className="font-semibold">{network}</h3>
            </button>
          ))}
        </div>

        {selectedNetwork && networkInvoices.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">{selectedNetwork} Invoices</h2>
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Invoice Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount Due
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Pay Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {networkInvoices.map((invoice, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.Invoice_Number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.Amount_Due}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.Pay_Period}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.Status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkDetailsPage;