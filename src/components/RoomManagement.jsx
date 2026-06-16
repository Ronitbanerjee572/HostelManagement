import { useCallback, useEffect, useState } from 'react';
import api from '../config/api';
import AssignRoomModal from './AssignRoomModal';
import RoomFormModal from './RoomFormModal';

export default function RoomManagement() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [assignRoom, setAssignRoom] = useState(null);
  const [roomForm, setRoomForm] = useState(null);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/rooms');
      setRooms(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Failed to load rooms';
      setError(message);
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
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button className="btn btn-primary" onClick={() => setRoomForm({})}>
          Add room
        </button>
      </div>
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
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rooms.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty-cell">
                  No room records available.
                </td>
              </tr>
            ) : (
              rooms.map((room) => {
                // Direct mapping to Oracle columns (ORDS lowercases column names by default)
                const roomId = room.room_id;
                const roomNumber = room.room_number;
                const capacity = room.capacity;
                const status = room.status || 'AVAILABLE';

                return (
                  <tr key={roomId || roomNumber}>
                    <td>
                      <strong>{roomNumber}</strong>
                    </td>
                    <td>{capacity ?? '—'}</td>
                    <td>
                      <span
                        className={`status-pill ${
                          status === 'AVAILABLE' ? 'status-vacant' : 'status-occupied'
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              onClick={() => setAssignRoom(room)} // Pass the whole room object, not just the number
                              disabled={status === 'FULL' || status === 'MAINTENANCE'}
                            >
                              Assign
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-ghost"
                              onClick={() => setRoomForm(room)}
                            >
                              Edit
                            </button>
                          </div>
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
          room={assignRoom}
          onClose={() => setAssignRoom(null)}
          onSuccess={handleAssignSuccess}
        />
      )}
      {roomForm && (
        <RoomFormModal
          room={roomForm}
          onClose={() => setRoomForm(null)}
          onSaved={() => {
            loadRooms();
            setRoomForm(null);
          }}
        />
      )}
    </>
  );
}