import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { AlertTriangle, TrendingUp, Calendar, Clock, CheckCircle, Sparkles } from './Icons';
import '../styles/aiSuggestions.css';

export const AISuggestions = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/ai/suggestions?limit=5');
      if (response.data.success) {
        setSuggestions(response.data.suggestions);
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setError('Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptSuggestion = async (suggestionId) => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const response = await api.post(`/ai/suggestions/${suggestionId}/accept`, {
        alarmTime: tomorrow.toISOString(),
        reminderTimes: [30, 15],
      });

      if (response.data.success) {
        setSuggestions(suggestions.filter(s => s._id !== suggestionId));
        // Show success message
        alert('✅ Task created from suggestion!');
      }
    } catch (err) {
      console.error('Error accepting suggestion:', err);
      alert('Failed to create task');
    }
  };

  const handleRejectSuggestion = async (suggestionId) => {
    try {
      await api.post(`/ai/suggestions/${suggestionId}/reject`);
      setSuggestions(suggestions.filter(s => s._id !== suggestionId));
    } catch (err) {
      console.error('Error rejecting suggestion:', err);
    }
  };

  if (loading) {
    return <div className="ai-suggestions loading">Loading suggestions...</div>;
  }

  if (suggestions.length === 0) {
    return (
      <div className="ai-suggestions empty">
        <Sparkles size={32} color="#6366F1" />
        <p>No suggestions yet</p>
        <span>Create more tasks to get AI recommendations</span>
      </div>
    );
  }

  return (
    <div className="ai-suggestions">
      <div className="suggestions-header">
        <h3>
          <Sparkles size={20} /> Smart Suggestions
        </h3>
        <button className="refresh-btn" onClick={fetchSuggestions} title="Refresh suggestions">
          🔄
        </button>
      </div>

      <div className="suggestions-list">
        {suggestions.map(suggestion => (
          <div key={suggestion._id} className="suggestion-card">
            <div className="suggestion-info">
              <div className="suggestion-title">{suggestion.title}</div>
              <div className="suggestion-description">{suggestion.description}</div>

              <div className="suggestion-meta">
                <span className="badge category-badge">{suggestion.suggestedCategory}</span>
                <span className="badge confidence-badge">
                  {suggestion.confidenceScore}% confident
                </span>
                <span className="badge reason-badge">
                  {suggestion.reasonType.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            <div className="suggestion-actions">
              <button
                className="btn btn-accept"
                onClick={() => handleAcceptSuggestion(suggestion._id)}
                title="Create task from this suggestion"
              >
                <CheckCircle size={16} /> Accept
              </button>
              <button
                className="btn btn-reject"
                onClick={() => handleRejectSuggestion(suggestion._id)}
                title="Not interested in this suggestion"
              >
                ✕ Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchSuggestions}>Retry</button>
        </div>
      )}
    </div>
  );
};

export default AISuggestions;
