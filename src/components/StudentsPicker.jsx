import { useEffect, useState } from 'react';
import api from '../config/api';

export default function StudentsPicker({ onSelect, onClose }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/students');
        setStudents(res.data || []);
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Failed to load students');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="panel-loading">Loading students…</div>;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h3>Select a student</h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </header>
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Roll</th>
                  <th>Email</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.student_id}>
                    <td>{s.student_id}</td>
                    <td>{s.name || '—'}</td>
                    <td>{s.roll_number || '—'}</td>
                    <td>{s.email || '—'}</td>
                    <td>
                      <button className="btn btn-sm btn-primary" onClick={() => onSelect(s)}>
                        Choose
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
