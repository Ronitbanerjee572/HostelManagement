import { useState } from 'react';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['Wifi', 'Water', 'Electricity', 'Cleanliness', 'Security', 'Maintenance', 'Other'];

export default function ComplaintForm({ onSubmitted }) {
  const { studentId } = useAuth();
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!description.trim()) {
      setError('Please describe the issue.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/complaints', {
        student_id: studentId,
        title: category, // backend expects `title`
        description: description.trim(),
      });

      const data = res.data || {};
      setMessage(data.message || 'Complaint submitted successfully.');
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
        <span>Category</span>
        <select value={category} onChange={(e) => setCategory(e.target.value)} disabled={loading}>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
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
