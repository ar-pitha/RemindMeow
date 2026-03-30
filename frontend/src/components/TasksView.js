import React, { useContext, useMemo } from 'react';
import { TaskContext } from '../context/TaskContext';
import { AuthContext } from '../context/AuthContext';
import { formatAlarmTimeIST12Hour } from '../utils/dateFormatter';
import { TaskList } from './TaskList';
import { Calendar } from './Calendar';
import { ChevronDown, ChevronUp } from './Icons';
import '../styles/tasksView.css';

export const TasksView = ({ selectedDate, onDateSelect, tasks: allTasks }) => {
  const { tasks } = useContext(TaskContext);
  const [expandedCategory, setExpandedCategory] = React.useState('pending');

  // Use passed tasks or context tasks
  const tasksList = allTasks || tasks;

  const tasksForSelectedDate = useMemo(() => {
    if (!selectedDate) return { pending: [], completed: [] };

    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const filtered = {
      pending: [],
      completed: [],
    };

    tasksList?.forEach((task) => {
      const taskDate = new Date(task.alarmTime);
      if (taskDate >= startOfDay && taskDate <= endOfDay) {
        if (task.status === 'completed') {
          filtered.completed.push(task);
        } else {
          filtered.pending.push(task);
        }
      }
    });

    // Sort by alarm time
    filtered.pending.sort((a, b) => new Date(a.alarmTime) - new Date(b.alarmTime));
    filtered.completed.sort((a, b) => new Date(a.alarmTime) - new Date(b.alarmTime));

    return filtered;
  }, [tasksList, selectedDate]);

  const handleTasksUpdated = () => {
    // Trigger refresh if needed
  };

  if (!selectedDate) {
    return null;
  }

  const dateString = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="tasks-view-container">
      <div className="tasks-view-header">
        <h2 className="tasks-view-title">Tasks for {dateString}</h2>
        <p className="tasks-view-subtitle">
          {tasksForSelectedDate.pending.length} Pending • {tasksForSelectedDate.completed.length} Completed
        </p>
      </div>

      {/* Pending Tasks Section */}
      <div className="tasks-category-section">
        <button
          className="tasks-category-header"
          onClick={() => setExpandedCategory(expandedCategory === 'pending' ? 'completed' : 'pending')}
        >
          <div className="category-info">
            <span className="category-title">
              <span className="pending-indicator"></span>Pending Tasks
            </span>
            <span className="task-count pending">{tasksForSelectedDate.pending.length}</span>
          </div>
          {expandedCategory === 'pending' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {expandedCategory === 'pending' && (
          <div className="tasks-category-content">
            {tasksForSelectedDate.pending.length > 0 ? (
              <TaskList tasks={tasksForSelectedDate.pending} onTasksUpdated={handleTasksUpdated} />
            ) : (
              <div className="empty-state">
                <p>No pending tasks for this day</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Completed Tasks Section */}
      <div className="tasks-category-section">
        <button
          className="tasks-category-header"
          onClick={() => setExpandedCategory(expandedCategory === 'completed' ? 'pending' : 'completed')}
        >
          <div className="category-info">
            <span className="category-title">
              <span className="completed-indicator"></span>Completed Tasks
            </span>
            <span className="task-count completed">{tasksForSelectedDate.completed.length}</span>
          </div>
          {expandedCategory === 'completed' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {expandedCategory === 'completed' && (
          <div className="tasks-category-content">
            {tasksForSelectedDate.completed.length > 0 ? (
              <TaskList tasks={tasksForSelectedDate.completed} onTasksUpdated={handleTasksUpdated} />
            ) : (
              <div className="empty-state">
                <p>No completed tasks for this day</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
