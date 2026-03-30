import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { TrendingUp, AlertTriangle, Calendar, CheckCircle, Crown } from './Icons';
import '../styles/habitInsights.css';

export const HabitInsights = () => {
  const [habits, setHabits] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHabitInsights();
  }, []);

  const fetchHabitInsights = async () => {
    try {
      setLoading(true);
      const response = await api.get('/ai/habits');
      if (response.data.success) {
        setHabits(response.data.habits);
      }
    } catch (err) {
      console.error('Error fetching habit insights:', err);
      // Not an error - just no data yet
      setHabits(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="habit-insights loading">Loading insights...</div>;
  }

  if (!habits) {
    return (
      <div className="habit-insights empty">
        <CheckCircle size={32} color="#6B7280" />
        <p>No habit insights yet</p>
        <span>Complete more tasks to unlock habit tracking</span>
      </div>
    );
  }

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="habit-insights">
      <div className="insights-header">
        <h3>
          <TrendingUp size={20} /> Habit Insights
        </h3>
      </div>

      <div className="insights-grid">
        {/* Completion Rate */}
        <div className="insight-card">
          <div className="card-header">
            <AlertTriangle size={18} color="#10B981" />
            <span>Completion Rate</span>
          </div>
          <div className="card-value">{habits.completionRate}%</div>
          <p className="card-description">Tasks completed on time</p>
          <div className="progress-bar">
            <div className="progress" style={{ width: `${habits.completionRate}%` }}></div>
          </div>
        </div>

        {/* Current Streak */}
        <div className="insight-card">
          <div className="card-header">
            <Crown size={18} color="#F59E0B" />
            <span>Current Streak</span>
          </div>
          <div className="card-value">{habits.currentStreak}</div>
          <p className="card-description">Days in a row</p>
          {habits.longestStreak > habits.currentStreak && (
            <p className="card-hint">Longest: {habits.longestStreak} days</p>
          )}
        </div>

        {/* Average Daily Tasks */}
        <div className="insight-card">
          <div className="card-header">
            <Calendar size={18} color="#3B82F6" />
            <span>Daily Average</span>
          </div>
          <div className="card-value">{habits.averageTasksPerDay.toFixed(1)}</div>
          <p className="card-description">Tasks per day</p>
        </div>

        {/* Peak Productivity Days */}
        {habits.peakProductivityDays && habits.peakProductivityDays.length > 0 && (
          <div className="insight-card">
            <div className="card-header">
              <AlertTriangle size={18} color="#8B5CF6" />
              <span>Most Productive</span>
            </div>
            <div className="days-list">
              {habits.peakProductivityDays.map(dayIndex => (
                <span key={dayIndex} className="day-badge">
                  {dayNames[dayIndex]?.substring(0, 3)}
                </span>
              ))}
            </div>
            <p className="card-description">Peak productivity days</p>
          </div>
        )}
      </div>

      {/* Preferred Times */}
      {habits.preferredTimes && (
        <div className="preferred-times-section">
          <h4>Preferred Task Times</h4>
          <div className="times-grid">
            {[
              { label: 'Morning (6am-12pm)', value: habits.preferredTimes.morning, color: '#FBBF24' },
              { label: 'Afternoon (12pm-6pm)', value: habits.preferredTimes.afternoon, color: '#10B981' },
              { label: 'Evening (6pm-12am)', value: habits.preferredTimes.evening, color: '#8B5CF6' },
              { label: 'Night (12am-6am)', value: habits.preferredTimes.night, color: '#3B82F6' },
            ].map((time, idx) => (
              <div key={idx} className="time-item">
                <div className="time-label">{time.label}</div>
                <div className="time-bar">
                  <div
                    className="time-fill"
                    style={{
                      width: `${(time.value / Math.max(...Object.values(habits.preferredTimes))) * 100}%`,
                      backgroundColor: time.color,
                    }}
                  ></div>
                </div>
                <div className="time-count">{time.value} tasks</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completion Patterns */}
      {habits.completionPatterns && (
        <div className="completion-patterns-section">
          <h4>Completion Patterns</h4>
          <div className="patterns-grid">
            <div className="pattern-item on-time">
              <span className="label">On Time</span>
              <span className="value">{habits.completionPatterns.onTimeCount}</span>
            </div>
            <div className="pattern-item late">
              <span className="label">Late</span>
              <span className="value">{habits.completionPatterns.lateCount}</span>
            </div>
            {habits.completionPatterns.avgDaysToComplete && (
              <div className="pattern-item avg">
                <span className="label">Avg Days to Complete</span>
                <span className="value">{habits.completionPatterns.avgDaysToComplete.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <button className="refresh-btn" onClick={fetchHabitInsights} title="Refresh insights">
        🔄 Refresh
      </button>
    </div>
  );
};

export default HabitInsights;
