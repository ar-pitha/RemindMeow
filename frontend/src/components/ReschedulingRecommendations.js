import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Calendar, Clock, AlertTriangle, CheckCircle } from './Icons';
import '../styles/reschedulingRecommendations.css';

export const ReschedulingRecommendations = ({ taskId }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [appliedRecommendation, setAppliedRecommendation] = useState(null);

  useEffect(() => {
    if (taskId) {
      fetchRecommendations();
    }
  }, [taskId]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/ai/recommendations/${taskId}`);
      if (response.data.success) {
        setRecommendations(response.data.recommendations || []);
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'better_time_of_day':
        return <Clock size={18} />;
      case 'less_crowded_day':
        return <Calendar size={18} />;
      case 'more_realistic_deadline':
        return <AlertTriangle size={18} />;
      default:
        return <CheckCircle size={18} />;
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      better_time_of_day: 'Better Time',
      less_crowded_day: 'Best Day',
      more_realistic_deadline: 'Realistic Deadline',
    };
    return labels[type] || type;
  };

  const getReason = (recommendation) => {
    return recommendation.reason || 'Smart scheduling suggestion based on your patterns';
  };

  const applyRecommendation = async (recommendation) => {
    try {
      const { suggestedTime, suggestedDeadline } = recommendation;
      const updatePayload = {};

      if (suggestedTime) {
        updatePayload.alarmTime = new Date(suggestedTime).toISOString();
      }
      if (suggestedDeadline) {
        updatePayload.deadline = new Date(suggestedDeadline).toISOString();
      }

      if (Object.keys(updatePayload).length === 0) return;

      // Call update task API
      const response = await api.put(`/tasks/${taskId}`, updatePayload);
      if (response.data.success) {
        setAppliedRecommendation(recommendation.id);
        setTimeout(() => {
          alert('✅ Task rescheduled successfully!');
          setAppliedRecommendation(null);
        }, 300);
      }
    } catch (err) {
      console.error('Error applying recommendation:', err);
      alert('Failed to apply recommendation');
    }
  };

  if (loading) {
    return <div className="recommendations loading">Loading recommendations...</div>;
  }

  if (error) {
    return (
      <div className="recommendations error">
        <AlertTriangle size={32} color="#EF4444" />
        <p>{error}</p>
        <button onClick={fetchRecommendations} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="recommendations empty">
        <Calendar size={28} color="#6B7280" />
        <p>No scheduling recommendations</p>
        <span>Your task schedule looks good!</span>
      </div>
    );
  }

  return (
    <div className="recommendations">
      <div className="recommendations-header">
        <h4>
          <Calendar size={20} /> Smart Rescheduling
        </h4>
        <p className="header-subtitle">AI-powered timing suggestions</p>
      </div>

      <div className="recommendations-list">
        {recommendations.map((rec, idx) => (
          <div
            key={rec.id || idx}
            className={`recommendation-item ${
              appliedRecommendation === rec.id ? 'applied' : ''
            }`}
          >
            <div className="rec-icon" style={{ color: getColorForType(rec.type) }}>
              {getIconForType(rec.type)}
            </div>

            <div className="rec-content">
              <div className="rec-header">
                <span className="rec-type">{getTypeLabel(rec.type)}</span>
                {rec.confidenceScore && (
                  <span className="confidence-badge">
                    {rec.confidenceScore}% confidence
                  </span>
                )}
              </div>

              <p className="rec-reason">{getReason(rec)}</p>

              {rec.suggestedTime && (
                <div className="rec-detail">
                  <Clock size={14} />
                  <span>
                    Suggested time: {formatTime(new Date(rec.suggestedTime))}
                  </span>
                </div>
              )}

              {rec.suggestedDeadline && (
                <div className="rec-detail">
                  <Calendar size={14} />
                  <span>
                    New deadline: {formatDate(new Date(rec.suggestedDeadline))}
                  </span>
                </div>
              )}
            </div>

            <button
              className="apply-btn"
              onClick={() => applyRecommendation(rec)}
              disabled={appliedRecommendation === rec.id}
              title="Apply this recommendation"
            >
              {appliedRecommendation === rec.id ? '✓' : '→'}
            </button>
          </div>
        ))}
      </div>

      <div className="recommendations-footer">
        <button onClick={fetchRecommendations} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>
    </div>
  );
};

// Helper Functions
function formatTime(date) {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDate(date) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const tomorrowOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());

  if (dateOnly.getTime() === todayOnly.getTime()) {
    return 'Today';
  }
  if (dateOnly.getTime() === tomorrowOnly.getTime()) {
    return 'Tomorrow';
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function getColorForType(type) {
  const colors = {
    better_time_of_day: '#3B82F6',
    less_crowded_day: '#10B981',
    more_realistic_deadline: '#F59E0B',
  };
  return colors[type] || '#6366F1';
}

export default ReschedulingRecommendations;
