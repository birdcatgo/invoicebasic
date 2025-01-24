"use client";

import React, { useState, useEffect } from 'react';
import { useNetworkData } from '@/hooks/useNetworkData';
import Link from 'next/link';

// Define Invoice type (if not already defined in useNetworkData)
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

const NetworkDetailsPage = () => {
  const { networks, fetchNetworkDetails } = useNetworkData();
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [networkDetails, setNetworkDetails] = useState<Invoice[]>([]);

  // Fetch network details when a network is selected
  useEffect(() => {
    if (selectedNetwork) {
      const details = fetchNetworkDetails(selectedNetwork);
      setNetworkDetails(details);
    }
  }, [selectedNetwork, fetchNetworkDetails]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold mb-8">Network Details</h1>

        {/* Back to Dashboard Link */}
        <Link href="/dashboard">
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 mb-8">
            Back to Dashboard
          </button>
        </Link>

        {/* Network Selection Dropdown */}
        <div className="mb-8">
          <label htmlFor="network" className="block text-sm font-medium text-gray-700">
            Select Network
          </label>
          <select
            id="network"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={selectedNetwork || ''}
            onChange={(e) => setSelectedNetwork(e.target.value)}
          >
            <option value="">Select a network</option>
            {networks.map((network) => (
              <option key={network} value={network}>
                {network}
              </option>
            ))}
          </select>
        </div>

        {/* Network Details Table */}
        {selectedNetwork && (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pay Period Start
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pay Period End
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount Due
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount Paid
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Difference
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {networkDetails.map((detail, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {detail.Pay_Period_Start}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {detail.Pay_Period_End}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {detail.Amount_Due}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {detail.Amount_Paid}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {detail.Payment_Difference}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {detail.Status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkDetailsPage;