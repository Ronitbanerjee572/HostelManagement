import { useCallback, useEffect, useState } from 'react';
import api from '../config/api';

export default function AdminAllocations() {
  const [allocs, setAllocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionId, setActionId] = useState(null);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/allocations');
      setAllocs(res.data || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load allocations');
      setAllocs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const revoke = async (alloc) => {
    const id = alloc.allocation_id || alloc.allocationId || alloc.id;
    if (!id) return;
    if (!window.confirm('Revoke this allocation?')) return;
    setActionId(id);
    try {
      await api.delete(`/allocations/${id}`);
      setToast('Allocation revoked');
      await load();
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to revoke allocation');
    } finally {
      setActionId(null);
    }
  };

  if (loading) return <div className="panel-loading">Loading allocations…</div>;

  return (
    <div>
      {toast && <div className="alert alert-success">{toast}</div>}
      {error && (
        <div className="alert alert-error">
          {error}
          <button className="btn btn-sm btn-ghost" onClick={load}>
            Retry
          </button>
        </div>
      )}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Allocation</th>
              <th>Student</th>
              <th>Room</th>
              <th>Start</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allocs.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-cell">No allocations found.</td>
              </tr>
            ) : (
              allocs.map((a) => (
                <tr key={a.allocation_id || a.id}>
                  <td>{a.allocation_id}</td>
                  <td>{a.student_name || a.student_id}</td>
                  <td>{a.room_number || a.room_id}</td>
                  <td>{(() => {
                    const d = a.start_date;
                    if (!d) return '—';
                    const t = Date.parse(d);
                    if (isNaN(t)) return d;
                    return new Date(t).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                  })()}</td>
                  <td>
                    <button className="btn btn-sm btn-danger" onClick={() => revoke(a)} disabled={actionId === a.allocation_id}>
                      {actionId === a.allocation_id ? 'Revoking…' : 'Revoke'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
