/**
 * 1-5 star rating + optional comment, shown after a request reaches Completed.
 * Disabled once the current user has already reviewed this request (server also enforces this).
 */
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function ReviewForm({ requestId, alreadyReviewed, onDone }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (alreadyReviewed) {
    return <div className="review-form-done">✔ You've already submitted a review for this request. Thank you!</div>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/requests/${requestId}/reviews`, { rating, comment });
      toast.success('Thanks for your feedback!');
      onDone?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <h3>Leave a rating</h3>
      <div className="star-picker">
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} className={n <= rating ? 'star star-filled' : 'star'} onClick={() => setRating(n)}>★</button>
        ))}
      </div>
      <textarea
        rows={3}
        maxLength={500}
        placeholder="Optional short review…"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <button className="btn btn-primary" type="submit" disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit Review'}
      </button>
    </form>
  );
}
