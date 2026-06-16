import { useState } from 'react';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';

export default function ComplaintForm({ onSubmitted }) {
  const { studentId } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!title.trim()) {
      setError('Please provide a short title for the complaint.');
      return;
    }

    if (!description.trim()) {
      setError('Please describe the issue.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/complaints', {
        student_id: studentId,
        title: title.trim(),
        description: description.trim(),
      });

      const data = res.data || {};
      setMessage(data.message || 'Complaint submitted successfully.');
      setTitle('');
      setDescription('');
      onSubmitted?.();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="complaint-form card" onSubmit={handleSubmit}>
      {message && (
        <div className="alert alert-success" role="status">
          {message}
        </div>
      )}
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      <label className="field">
        <span>Student ID</span>
        <input type="text" value={studentId ?? ''} readOnly className="input-readonly" />
      </label>

      <label className="field">
        <span>Title</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Short summary (e.g., 'WiFi down on 3rd floor')"
          disabled={loading}
        />
      </label>

      <label className="field">
        <span>Description</span>
        <textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the facility issue in detail…"
          disabled={loading}
        />
      </label>

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? 'Submitting…' : 'Submit complaint'}
      </button>
    </form>
  );
}
