import { useState } from 'react';
import Layout from '../components/Layout';
import RoomManagement from '../components/RoomManagement';
import FinancialTracking from '../components/FinancialTracking';
import ComplaintsTerminal from '../components/ComplaintsTerminal';
import AdminAllocations from '../components/AdminAllocations';

const TABS = [
  { id: 'rooms', label: 'Room occupancy' },
  { id: 'allocations', label: 'Allocations' },
  { id: 'fees', label: 'Financial tracking' },
  { id: 'complaints', label: 'Operations terminal' },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('rooms');

  return (
    <Layout
      title="Admin dashboard"
      subtitle="Manage room occupancy, fee collections, and facility complaints."
    >
      <nav className="tab-nav" aria-label="Admin sections">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <section className="panel">
        {activeTab === 'rooms' && (
          <>
            <h3 className="panel-title">Room occupancy</h3>
            <p className="panel-desc muted">
              View active rooms and assign students via the allocation API.
            </p>
            <RoomManagement />
          </>
        )}

        {activeTab === 'fees' && (
          <>
            <h3 className="panel-title">Outstanding fees</h3>
            <p className="panel-desc muted">
              Full defaulters list — mark invoices as paid when settled.
            </p>
            <FinancialTracking />
          </>
        )}

        {activeTab === 'complaints' && (
          <>
            <h3 className="panel-title">Active complaints</h3>
            <p className="panel-desc muted">
              Resolve or remove facility tickets as operations are completed.
            </p>
            <ComplaintsTerminal />
          </>
        )}
        
        {activeTab === 'allocations' && (
          <>
            <h3 className="panel-title">Current allocations</h3>
            <p className="panel-desc muted">View and revoke current room allocations.</p>
            <AdminAllocations />
          </>
        )}
      </section>
    </Layout>
  );
}
