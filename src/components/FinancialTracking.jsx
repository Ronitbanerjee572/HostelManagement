import { useCallback, useEffect, useState } from 'react';
import api from '../config/api';
import { field, recordId } from '../utils/records';

export default function FinancialTracking() {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payingId, setPayingId] = useState(null);
  const [toast, setToast] = useState(null);

  const loadFees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/fees/defaulters');
      const data = res.data || [];
      setFees(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setFees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFees();
  }, [loadFees]);

  const markAsPaid = async (fee) => {
    const id = recordId(fee, 'id', 'invoice_id', 'fee_id');
    if (id == null) {
      setError('This record has no payable invoice ID.');
      return;
    }

    setPayingId(id);
    setError(null);
    try {
      const res = await api.put(`/fees/${id}`, { status: 'PAID' });
      const data = res.data || {};
      setToast(data.message || `Invoice #${id} marked as paid.`);
      await loadFees();
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Payment update failed');
    } finally {
      setPayingId(null);
    }
  };

  if (loading) {
    return <div className="panel-loading">Loading financial records…</div>;
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
          <button type="button" className="btn btn-sm btn-ghost" onClick={loadFees}>
            Retry
          </button>
        </div>
      )}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Student ID</th>
              <th>Amount</th>
              <th>Due date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {fees.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-cell">
                  No outstanding fee records.
                </td>
              </tr>
            ) : (
              fees.map((row, index) => {
                const id = recordId(row, 'id', 'invoice_id', 'fee_id') ?? index;
                return (
                  <tr key={id}>
                    <td>{field(row, 'id', 'invoice_id', 'fee_id') ?? '—'}</td>
                    <td>{field(row, 'student_id', 'STUDENT_ID') ?? '—'}</td>
                    <td>{field(row, 'amount', 'fee_amount', 'total') ?? '—'}</td>
                    <td>{field(row, 'due_date', 'duedate', 'due') ?? '—'}</td>
                    <td>
                      <span className="status-pill status-pending">
                        {field(row, 'status', 'payment_status') ?? 'Outstanding'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-success"
                        disabled={payingId === id}
                        onClick={() => markAsPaid(row)}
                      >
                        {payingId === id ? 'Updating…' : 'Mark as Paid'}
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
