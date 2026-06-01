import { useCallback, useEffect, useState } from 'react';
import { API_BASE } from '../config/api';
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
      const response = await fetch(`${API_BASE}/complaints/active`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to load complaints');
      }
      const data = await response.json();
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
      const response = await fetch(`${API_BASE}/complaints/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Resolved' }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to resolve complaint');
      }

      setToast(data.message || `Complaint #${id} resolved.`);
      await loadComplaints();
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      setError(err.message);
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
      const response = await fetch(`${API_BASE}/complaints/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to delete complaint');
      }

      setToast(data.message || `Complaint #${id} deleted.`);
      await loadComplaints();
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      setError(err.message);
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
              <th>Category</th>
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
                    <td>{field(row, 'student_id', 'STUDENT_ID') ?? '—'}</td>
                    <td>{field(row, 'category', 'complaint_category') ?? '—'}</td>
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
