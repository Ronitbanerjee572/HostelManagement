import { useState } from 'react';
import Layout from '../components/Layout';
import ComplaintForm from '../components/ComplaintForm';
import StudentFeesPanel from '../components/StudentFeesPanel';

const TABS = [
  { id: 'fees', label: 'My fees' },
  { id: 'complaint', label: 'File a complaint' },
];

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('fees');
  const [complaintKey, setComplaintKey] = useState(0);

  return (
    <Layout
      title="Student dashboard"
      subtitle="View your outstanding fees and report facility issues."
    >
      <nav className="tab-nav" aria-label="Student sections">
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
        {activeTab === 'fees' && (
          <>
            <h3 className="panel-title">Personal fee records</h3>
            <p className="panel-desc muted">
              Showing only records linked to your student ID from the defaulters list.
            </p>
            <StudentFeesPanel />
          </>
        )}

        {activeTab === 'complaint' && (
          <>
            <h3 className="panel-title">File a complaint</h3>
            <p className="panel-desc muted">
              Your student ID is attached automatically to every submission.
            </p>
            <ComplaintForm key={complaintKey} onSubmitted={() => setComplaintKey((k) => k + 1)} />
          </>
        )}
      </section>
    </Layout>
  );
}
