import { useCallback, useEffect, useState } from 'react';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import { field, matchesStudentId } from '../utils/records';

export default function StudentFeesPanel() {
  const { studentId } = useAuth();
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadFees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!studentId) {
        setFees([]);
        return;
      }

      const res = await api.get(`/student/${studentId}/fees`);
      const data = res.data || [];
      const list = Array.isArray(data) ? data : [];
      setFees(list);
    } catch (err) {
      setError(err.message);
      setFees([]);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadFees();
  }, [loadFees]);

  if (loading) {
    return <div className="panel-loading">Loading your fee records…</div>;
  }

  if (error) {
    return (
      <div className="alert alert-error">
        {error}
        <button type="button" className="btn btn-sm btn-ghost" onClick={loadFees}>
          Retry
        </button>
      </div>
    );
  }

  if (fees.length === 0) {
    return (
      <div className="empty-state">
        <p>No outstanding fees found for your account.</p>
        <p className="muted">Student ID: {studentId}</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Amount</th>
            <th>Due date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {fees.map((row, index) => (
            <tr key={field(row, 'id', 'invoice_id', 'fee_id') ?? index}>
              <td>{field(row, 'id', 'invoice_id', 'fee_id') ?? '—'}</td>
              <td>{field(row, 'amount', 'fee_amount', 'total') ?? '—'}</td>
              <td>{(() => {
                const d = field(row, 'due_date', 'duedate', 'due');
                if (!d) return '—';
                const t = Date.parse(d);
                if (isNaN(t)) return d;
                return new Date(t).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
              })()}</td>
              <td>
                <span className="status-pill status-pending">
                  {field(row, 'status', 'payment_status') ?? 'Outstanding'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
