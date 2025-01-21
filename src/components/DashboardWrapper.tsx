'use client';

import dynamic from 'next/dynamic';

const NetworkAccountingDashboard = dynamic(
  () => import('@/components/NetworkAccountingDashboard'),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    ),
    ssr: false
  }
);

export default function DashboardWrapper() {
  return <NetworkAccountingDashboard />;
} 