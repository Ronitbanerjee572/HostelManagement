import { useCallback, useEffect, useState } from 'react';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';

export default function StudentComplaintsPanel() {
  const { studentId } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [withdrawing, setWithdrawing] = useState(null);

  const load = useCallback(() => {
    if (!studentId) return;
    setLoading(true);
    setError(null);
    api.get(`/student/${studentId}/complaints`)
      .then((res) => setComplaints(res.data || []))
      .catch((err) => setError(err.response?.data?.error || err.message))
      .finally(() => setLoading(false));
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  const withdraw = async (id) => {
    setWithdrawing(id);
    try {
      const { data } = await api.delete(`/complaints/${id}`);
      setToast(data.message || 'Complaint withdrawn successfully');
      setTimeout(() => setToast(null), 3500);
      load();
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      setError(msg);
      setToast(msg);
      setTimeout(() => setToast(null), 5000);
    } finally {
      setWithdrawing(null);
    }
  };

  if (!studentId) return <p>Please log in to view your complaints.</p>;
  if (loading) return <p>Loading complaints...</p>;

  return (
    <div>
      {toast && (
        <div className={`alert ${error ? 'alert-error' : 'alert-success'}`} role="status">
          {toast}
        </div>
      )}

      {!complaints.length ? (
        <p className="muted">You have no complaints logged.</p>
      ) : (
        <ul>
          {complaints.map((c) => (
            <li key={c.complaint_id} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div><strong>{c.title}</strong> — <span className="muted">{c.status}</span></div>
                  <div>{c.description}</div>
                  <div className="muted">Created: {(() => {
                    const d = c.created_at;
                    if (!d) return '—';
                    const t = Date.parse(d);
                    if (isNaN(t)) return d;
                    return new Date(t).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                  })()}</div>
                </div>
                <div>
                  {c.status === 'PENDING' && (
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => withdraw(c.complaint_id)}
                      disabled={withdrawing === c.complaint_id}
                    >
                      {withdrawing === c.complaint_id ? 'Withdrawing…' : 'Withdraw'}
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
