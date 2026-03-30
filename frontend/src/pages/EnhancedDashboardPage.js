import React, { useContext, useEffect, useState, useRef, useCallback } from 'react';
import { TaskContext } from '../context/TaskContext';
import { AuthContext } from '../context/AuthContext';
import { TaskForm } from '../components/TaskForm';
import { TaskList } from '../components/TaskList';
import { Calendar } from '../components/Calendar';
import { TasksView } from '../components/TasksView';
import { UserAnalytics } from '../components/UserAnalytics';
import { NotificationPanel, NotificationBell } from '../components/NotificationPanel';
import { NotificationDiagnostics } from '../components/NotificationDiagnostics';
import { AISuggestions } from '../components/AISuggestions';
import { HabitInsights } from '../components/HabitInsights';
import { ReasonModal } from '../components/ReasonModal';
import { connectSocket, onTaskCompleted, onNotificationReceived, onAlarmRinging, disconnectSocket } from '../services/socket';
import { requestFCMToken } from '../firebase/firebase';
import alarmSoundService from '../services/alarmSound';
import { Plus, X, Clipboard, CheckCircle, BarChart3, Calendar as CalendarIcon, Sparkles, Activity } from '../components/Icons';
import '../styles/dashboard.css';

export const EnhancedDashboardPage = ({ setNotificationSlot }) => {
  const { tasks, getTasks, loading } = useContext(TaskContext);
  const { user, updateFCMToken } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('pending');
  const [showForm, setShowForm] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedDate, setSelectedDate] = useState(null);
  const [allTasks, setAllTasks] = useState([]);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [lateTask, setLateTask] = useState(null);
  const socketInitializedRef = useRef(false);
  const userIdRef = useRef(null);
  const fcmRefreshedRef = useRef(false);
  const countsInitializedRef = useRef(false);
  const lastCheckRef = useRef({});

  const handleUnreadCountChange = useCallback((count) => {
    setUnreadCount(count);
  }, []);

  // Push bell icon into header via prop
  useEffect(() => {
    if (setNotificationSlot) {
      setNotificationSlot(
        <NotificationBell
          unreadCount={unreadCount}
          onClick={() => setShowNotifications((prev) => !prev)}
        />
      );
    }
    return () => {
      if (setNotificationSlot) setNotificationSlot(null);
    };
  }, [setNotificationSlot, unreadCount]);

  // Monitor tasks for late detection (every 30 seconds)
  useEffect(() => {
    if (!user || !tasks.length) return;

    const monitorLateTask = () => {
      const now = new Date();

      tasks.forEach((task) => {
        // Only check pending tasks assigned to current user
        if (task.status !== 'pending' || task.assignedTo !== user._id) return;

        const alarmTime = task.alarmTime ? new Date(task.alarmTime) : null;
        if (!alarmTime) return;

        // Calculate 5 minutes after alarm time
        const fiveMinutesAfter = new Date(alarmTime.getTime() + 5 * 60000);

        // Check if current time is past the 5-minute threshold
        const isPastThreshold = now > fiveMinutesAfter;

        // Track if we already showed modal for this task
        if (!lastCheckRef.current[task._id]) {
          lastCheckRef.current[task._id] = false;
        }

        // Show modal only once when task becomes late
        if (isPastThreshold && !lastCheckRef.current[task._id]) {
          lastCheckRef.current[task._id] = true;
          setLateTask(task);
          setShowReasonModal(true);
          console.log(`[LATE DETECTION] Task "${task.title}" is late by 5+ minutes`);
        }

        // Reset tracking when task is completed
        if (task.status === 'completed' && lastCheckRef.current[task._id]) {
          delete lastCheckRef.current[task._id];
        }
      });
    };

    const monitoringInterval = setInterval(monitorLateTask, 30000); // Check every 30 seconds

    // Initial check
    monitorLateTask();

    return () => clearInterval(monitoringInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, tasks]);

  // Load counts for both tabs on initial mount
  useEffect(() => {
    if (user && !countsInitializedRef.current) {
      countsInitializedRef.current = true;
      const loadCounts = async () => {
        try {
          const pendingTasks = await getTasks('pending', true);
          setPendingCount(pendingTasks?.length || 0);
          const completedTasks = await getTasks('completed', true);
          setCompletedCount(completedTasks?.length || 0);
          await getTasks('pending', true);
        } catch (err) {
          console.error('Error loading task counts:', err);
        }
      };
      loadCounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Load tasks when tab changes and update counts
  useEffect(() => {
    if (user) {
      const loadTabData = async () => {
        try {
          if (activeTab === 'calendar') {
            const pendingTasks = await getTasks('pending', true);
            const completedTasks = await getTasks('completed', true);
            setPendingCount(pendingTasks?.length || 0);
            setCompletedCount(completedTasks?.length || 0);
            const merged = [...(pendingTasks || []), ...(completedTasks || [])];
            setAllTasks(merged);
          } else if (activeTab === 'analytics' || activeTab === 'ai' || activeTab === 'habits') {
            const pendingTasks = await getTasks('pending', true);
            const completedTasks = await getTasks('completed', true);
            setPendingCount(pendingTasks?.length || 0);
            setCompletedCount(completedTasks?.length || 0);
          } else {
            const tabTasks = await getTasks(activeTab, true);
            if (activeTab === 'pending') {
              setPendingCount(tabTasks?.length || 0);
            } else {
              setCompletedCount(tabTasks?.length || 0);
            }
          }
        } catch (err) {
          console.error('Error loading tab data:', err);
        }
      };
      loadTabData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Refresh FCM token
  useEffect(() => {
    if (user && !fcmRefreshedRef.current) {
      fcmRefreshedRef.current = true;
      const refreshFCMTokenOnDashboardLoad = async () => {
        try {
          const fcmToken = await requestFCMToken();
          if (fcmToken && updateFCMToken) {
            await updateFCMToken(fcmToken, 'Web Browser - Enhanced Dashboard Load');
          }
        } catch (err) {
          console.warn('Failed to refresh FCM token:', err.message);
        }
      };
      refreshFCMTokenOnDashboardLoad();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Setup websocket listeners
  useEffect(() => {
    if (!user) return;
    if (!socketInitializedRef.current || userIdRef.current !== user._id) {
      socketInitializedRef.current = true;
      userIdRef.current = user._id;
      connectSocket(user._id);

      const handleTaskCompleted = () => {
        getTasks(activeTab);
      };

      const handleNotification = (notification) => {
        setNotifications((prev) => [notification, ...prev]);
      };

      const handleAlarmRinging = (alarmData) => {
        console.log('[DASHBOARD] Alarm ringing:', alarmData);
        setNotifications((prev) => [{
          _id: `alarm-${alarmData.taskId}-${Date.now()}`,
          taskId: alarmData.taskId,
          title: alarmData.taskTitle,
          description: alarmData.taskDescription,
          type: 'alarm',
          read: false,
          createdAt: new Date(),
        }, ...prev]);
        alarmSoundService.initializeAudio();
        alarmSoundService.playNotificationSound();
      };

      onTaskCompleted(handleTaskCompleted);
      onNotificationReceived(handleNotification);
      onAlarmRinging(handleAlarmRinging);
    }

    return () => {
      disconnectSocket();
      socketInitializedRef.current = false;
      userIdRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  return (
    <div className="dashboard">
      <div className="dash-toolbar">
        <div className="dash-tabs">
          <button className={`dash-tab ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
            <Clipboard size={14} />
            <span className="dash-tab-label">Pending</span>
            <span className="dash-tab-badge">{pendingCount}</span>
          </button>
          <button className={`dash-tab ${activeTab === 'completed' ? 'active' : ''}`} onClick={() => setActiveTab('completed')}>
            <CheckCircle size={14} />
            <span className="dash-tab-label">Completed</span>
            <span className="dash-tab-badge">{completedCount}</span>
          </button>
          <button className={`dash-tab ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>
            <CalendarIcon size={14} />
            <span className="dash-tab-label">Calendar</span>
          </button>
          <button className={`dash-tab ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
            <BarChart3 size={14} />
            <span className="dash-tab-label">Analytics</span>
          </button>
          <button className={`dash-tab ${activeTab === 'ai' ? 'active' : ''}`} onClick={() => setActiveTab('ai')}>
            <Sparkles size={14} />
            <span className="dash-tab-label">Suggestions</span>
          </button>
          <button className={`dash-tab ${activeTab === 'habits' ? 'active' : ''}`} onClick={() => setActiveTab('habits')}>
            <Activity size={14} />
            <span className="dash-tab-label">Habits</span>
          </button>
        </div>
        <button className="dash-create-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? <X size={14} /> : <Plus size={14} />}
          <span>{showForm ? 'Close' : 'New Task'}</span>
        </button>
      </div>

      {showForm && (
        <TaskForm
          onSuccess={() => {
            setShowForm(false);
            getTasks(activeTab);
          }}
        />
      )}

      <div className="dash-panel">
        {loading && activeTab !== 'analytics' && activeTab !== 'calendar' && activeTab !== 'ai' && activeTab !== 'habits' ? (
          <div className="loading">Loading tasks...</div>
        ) : activeTab === 'calendar' ? (
          <div className="calendar-split-layout">
            <div className="calendar-left">
              <Calendar tasks={allTasks} onDateSelect={setSelectedDate} selectedDate={selectedDate} />
            </div>
            <div className="calendar-right">
              <TasksView selectedDate={selectedDate} onDateSelect={setSelectedDate} tasks={allTasks} />
            </div>
          </div>
        ) : activeTab === 'analytics' ? (
          <UserAnalytics />
        ) : activeTab === 'ai' ? (
          <div className="ai-tab-content">
            <AISuggestions />
          </div>
        ) : activeTab === 'habits' ? (
          <div className="habits-tab-content">
            <HabitInsights />
          </div>
        ) : (
          <TaskList
            tasks={activeTab === 'pending' ? pendingTasks : completedTasks}
            onTasksUpdated={async () => {
              try {
                const pending = await getTasks('pending', true);
                const completed = await getTasks('completed', true);
                setPendingCount(pending?.length || 0);
                setCompletedCount(completed?.length || 0);
              } catch (err) {
                console.error('Error refreshing tasks:', err);
              }
            }}
          />
        )}
      </div>

      <NotificationPanel
        notifications={notifications}
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        onUnreadCountChange={handleUnreadCountChange}
      />

      <NotificationDiagnostics />

      {showReasonModal && lateTask && (
        <ReasonModal
          task={lateTask}
          onClose={() => {
            setShowReasonModal(false);
            setLateTask(null);
          }}
          onSubmit={() => {
            setShowReasonModal(false);
            setLateTask(null);
            getTasks(activeTab);
          }}
        />
      )}
    </div>
  );
};

export default EnhancedDashboardPage;
