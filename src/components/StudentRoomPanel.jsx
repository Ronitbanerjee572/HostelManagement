import { useEffect, useState } from 'react';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';

export default function StudentRoomPanel() {
  const { studentId } = useAuth();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    setError(null);
    api.get(`/student/${studentId}/room`)
      .then((res) => {
        setRoom(res.data);
        setToast('Assigned room loaded');
        setTimeout(() => setToast(null), 3500);
      })
      .catch((err) => {
        const msg = err.response?.data?.error || err.message;
        setError(msg);
        setToast(msg);
        setTimeout(() => setToast(null), 5000);
      })
      .finally(() => setLoading(false));
  }, [studentId]);

  if (!studentId) return <p>Please log in to see your assigned room.</p>;
  if (loading) return <p>Loading assigned room...</p>;

  return (
    <div>
      {toast && (
        <div className={`alert ${error ? 'alert-error' : 'alert-success'}`} role="status">
          {toast}
        </div>
      )}

      {!room || room.message ? (
        <p className="muted">No active hostel room assignment found.</p>
      ) : (
        <div className="card">
          <h4 className="card-title">Assigned room</h4>
          <div className="card-body">
            <ul>
              <li><strong>Room:</strong> {room.room_number}</li>
              <li><strong>Capacity:</strong> {room.capacity}</li>
              <li><strong>Status:</strong> {room.status}</li>
              <li><strong>Assigned on:</strong> {(() => {
                const d = room.start_date;
                if (!d) return '—';
                const t = Date.parse(d);
                if (isNaN(t)) return d;
                return new Date(t).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
              })()}</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
