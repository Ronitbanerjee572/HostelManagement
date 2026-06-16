import { useCallback, useEffect, useState } from 'react';
import api from '../config/api';
import { field, recordId } from '../utils/records';

export default function ComplaintsTerminal() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionId, setActionId] = useState(null);
  const [toast, setToast] = useState(null);

  const loadComplaints = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/complaints/active');
      const data = res.data || [];
      setComplaints(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  const resolveComplaint = async (complaint) => {
    const id = recordId(complaint, 'id', 'complaint_id');
    if (id == null) return;

    setActionId(`resolve-${id}`);
    setError(null);
    try {
      const res = await api.put(`/complaints/${id}/resolve`);
      const data = res.data || {};
      setToast(data.message || `Complaint #${id} resolved.`);
      await loadComplaints();
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to resolve complaint');
    } finally {
      setActionId(null);
    }
  };

  const deleteComplaint = async (complaint) => {
    const id = recordId(complaint, 'id', 'complaint_id');
    if (id == null) return;

    if (!window.confirm(`Delete complaint #${id}? This cannot be undone.`)) {
      return;
    }

    setActionId(`delete-${id}`);
    setError(null);
    try {
      const res = await api.delete(`/complaints/${id}`);
      const data = res.data || {};
      setToast(data.message || `Complaint #${id} deleted.`);
      await loadComplaints();
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to delete complaint');
    } finally {
      setActionId(null);
    }
  };

  const isResolved = (row) => {
    const status = String(field(row, 'status', 'complaint_status') ?? '').toLowerCase();
    return status === 'resolved';
  };

  if (loading) {
    return <div className="panel-loading">Loading active complaints…</div>;
  }

  return (
    <>
      {toast && (
        <div className="alert alert-success" role="status">
          {toast}
        </div>
      )}
      {error && (
        <div className="alert alert-error">
          {error}
          <button type="button" className="btn btn-sm btn-ghost" onClick={loadComplaints}>
            Retry
          </button>
        </div>
      )}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Student</th>
              {/* Category removed: database has no category field */}
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {complaints.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-cell">
                  No active complaints on file.
                </td>
              </tr>
            ) : (
              complaints.map((row, index) => {
                const id = recordId(row, 'id', 'complaint_id') ?? index;
                const resolved = isResolved(row);
                const busyResolve = actionId === `resolve-${id}`;
                const busyDelete = actionId === `delete-${id}`;

                return (
                  <tr key={id}>
                    <td>{id}</td>
                    <td>{field(row, 'name', 'student_name') ?? field(row, 'student_id', 'STUDENT_ID') ?? '—'}</td>
                    {/* category column removed */}
                    <td className="desc-cell">{field(row, 'description', 'details') ?? '—'}</td>
                    <td>
                      <span
                        className={`status-pill ${
                          resolved ? 'status-resolved' : 'status-pending'
                        }`}
                      >
                        {field(row, 'status', 'complaint_status') ?? 'Active'}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        disabled={resolved || busyResolve || busyDelete}
                        onClick={() => resolveComplaint(row)}
                      >
                        {busyResolve ? 'Updating…' : 'Mark Resolved'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        disabled={busyResolve || busyDelete}
                        onClick={() => deleteComplaint(row)}
                      >
                        {busyDelete ? 'Removing…' : 'Remove'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
