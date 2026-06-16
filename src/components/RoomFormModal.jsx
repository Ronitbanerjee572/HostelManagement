import { useState, useEffect } from 'react';
import api from '../config/api';

export default function RoomFormModal({ room, onClose, onSaved }) {
  const isEdit = Boolean(room?.room_id);
  const [roomNumber, setRoomNumber] = useState(room?.room_number || '');
  const [capacity, setCapacity] = useState(room?.capacity || '');
  const [status, setStatus] = useState(room?.status || 'AVAILABLE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setRoomNumber(room?.room_number || '');
    setCapacity(room?.capacity || '');
    setStatus(room?.status || 'AVAILABLE');
  }, [room]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!roomNumber.trim() || !capacity) {
      setError('Room number and capacity are required');
      return;
    }
    setLoading(true);
    try {
      if (isEdit) {
        const res = await api.put(`/rooms/${room.room_id}`, {
          room_number: roomNumber.trim(),
          capacity: Number(capacity),
          status,
        });
        onSaved?.(res.data);
      } else {
        const res = await api.post('/rooms', {
          room_number: roomNumber.trim(),
          capacity: Number(capacity),
          status,
        });
        onSaved?.(res.data);
      }
      onClose?.();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="modal" role="dialog" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h3>{isEdit ? 'Edit room' : 'Add new room'}</h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </header>
        <form className="modal-body" onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}

          <label className="field">
            <span>Room number</span>
            <input value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} />
          </label>

          <label className="field">
            <span>Capacity</span>
            <input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
          </label>

          <label className="field">
            <span>Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="FULL">FULL</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
            </select>
          </label>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
