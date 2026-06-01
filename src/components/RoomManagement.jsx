import { useCallback, useEffect, useState } from 'react';
import { API_BASE } from '../config/api';
import { field } from '../utils/records';
import AssignRoomModal from './AssignRoomModal';

export default function RoomManagement() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [assignRoom, setAssignRoom] = useState(null);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/rooms`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to load rooms');
      }
      const data = await response.json();
      setRooms(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const handleAssignSuccess = (message) => {
    setToast(message || 'Room assigned successfully.');
    loadRooms();
    setTimeout(() => setToast(null), 4000);
  };

  if (loading) {
    return <div className="panel-loading">Loading room occupancy…</div>;
  }

  if (error) {
    return (
      <div className="alert alert-error">
        {error}
        <button type="button" className="btn btn-sm btn-ghost" onClick={loadRooms}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      {toast && (
        <div className="alert alert-success" role="status">
          {toast}
        </div>
      )}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Room</th>
              <th>Capacity</th>
              <th>Occupied</th>
              <th>Student</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rooms.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-cell">
                  No room records available.
                </td>
              </tr>
            ) : (
              rooms.map((room, index) => {
                const roomNumber = field(room, 'room_number', 'room_no', 'room') ?? `Room-${index}`;
                const occupied = field(room, 'occupied', 'is_occupied', 'occupancy');
                const student = field(room, 'student_id', 'assigned_student', 'resident_id');

                return (
                  <tr key={roomNumber}>
                    <td>
                      <strong>{roomNumber}</strong>
                    </td>
                    <td>{field(room, 'capacity', 'max_capacity') ?? '—'}</td>
                    <td>
                      <span
                        className={`status-pill ${
                          occupied === true ||
                          occupied === 'Y' ||
                          occupied === 1 ||
                          occupied === '1' ||
                          student
                            ? 'status-occupied'
                            : 'status-vacant'
                        }`}
                      >
                        {student || occupied === true || occupied === 'Y' || occupied === 1
                          ? 'Occupied'
                          : 'Vacant'}
                      </span>
                    </td>
                    <td>{student ?? '—'}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => setAssignRoom(roomNumber)}
                      >
                        Assign student
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {assignRoom && (
        <AssignRoomModal
          roomNumber={assignRoom}
          onClose={() => setAssignRoom(null)}
          onSuccess={handleAssignSuccess}
        />
      )}
    </>
  );
}
