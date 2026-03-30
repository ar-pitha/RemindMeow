import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from './Icons';
import '../styles/calendar.css';

export const Calendar = ({ tasks, onDateSelect, selectedDate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Count tasks for each day
  const tasksByDate = useMemo(() => {
    const map = {};
    tasks?.forEach((task) => {
      const taskDate = new Date(task.alarmTime);
      const dateKey = `${taskDate.getFullYear()}-${taskDate.getMonth()}-${taskDate.getDate()}`;
      if (!map[dateKey]) {
        map[dateKey] = { pending: 0, completed: 0 };
      }
      if (task.status === 'completed') {
        map[dateKey].completed++;
      } else {
        map[dateKey].pending++;
      }
    });
    return map;
  }, [tasks]);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateClick = (day) => {
    const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    onDateSelect(clickedDate);
  };

  const isSelectedDate = (day) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth.getMonth() &&
      selectedDate.getFullYear() === currentMonth.getFullYear()
    );
  };

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Create array of day cells with empty cells at the start
  const dayCells = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    dayCells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    dayCells.push(day);
  }

  return (
    <div className="calendar-container">
      {/* Header */}
      <div className="calendar-header">
        <button className="calendar-nav-btn" onClick={handlePrevMonth}>
          <ChevronLeft size={18} />
        </button>
        <h3 className="calendar-month-year">{monthName}</h3>
        <button className="calendar-nav-btn" onClick={handleNextMonth}>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Weekday labels */}
      <div className="calendar-weekdays">
        {dayLabels.map((label) => (
          <div key={label} className="calendar-weekday">
            {label}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="calendar-days">
        {dayCells.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="calendar-day empty"></div>;
          }

          const dateKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}-${day}`;
          const taskCount = tasksByDate[dateKey] || { pending: 0, completed: 0 };
          const isSelected = isSelectedDate(day);
          const hasTasksOnDay = taskCount.pending > 0 || taskCount.completed > 0;

          return (
            <div
              key={day}
              className={`calendar-day ${isSelected ? 'selected' : ''} ${hasTasksOnDay ? 'has-tasks' : ''}`}
              onClick={() => handleDateClick(day)}
            >
              <div className="calendar-day-number">{day}</div>
              {hasTasksOnDay && (
                <div className="calendar-task-indicators">
                  {taskCount.pending > 0 && (
                    <span className="task-badge pending" title={`${taskCount.pending} Pending`}>
                      {taskCount.pending}
                    </span>
                  )}
                  {taskCount.completed > 0 && (
                    <span className="task-badge completed" title={`${taskCount.completed} Completed`}>
                      {taskCount.completed}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
