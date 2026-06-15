import { useState } from 'react';
import api from '../config/api'; // Use the Axios instance that attaches the JWT

export default function AssignRoomModal({ room, onClose, onSuccess }) {
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!studentId.trim()) {
      setError('Student ID is required.');
      return;
    }

    setLoading(true);
    try {
      // Send the exact fields required by your Oracle Allocations table
      await api.post('/allocations', {
        student_id: Number(studentId.trim()), 
        room_id: room.room_id,
        start_date: new Date().toISOString().split('T')[0], // Sends today's date as YYYY-MM-DD
      });

      // Optional future enhancement: You could also trigger a PUT request to /api/rooms/${room.room_id} 
      // here to automatically update the room's status to 'FULL' if capacity is reached!

      onSuccess?.(`Student assigned to ${room.room_number} successfully.`);
      onClose();
    } catch (err) {
      // Axios stores the server error inside err.response.data
      const serverMessage = err.response?.data?.error || err.response?.data?.details || err.message;
      setError(`Allocation failed: ${serverMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-labelledby="assign-room-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h3 id="assign-room-title">Assign student to room {room?.room_number}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}

          <label className="field">
            <span>Student ID (Database ID)</span>
            <input
              type="number"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="e.g. 13000123076"
              disabled={loading}
              autoFocus
            />
          </label>

          <label className="field">
            <span>Room number</span>
            {/* Read the room number from the passed room object */}
            <input type="text" value={room?.room_number || ''} readOnly className="input-readonly" />
          </label>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Assigning…' : 'Assign room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}