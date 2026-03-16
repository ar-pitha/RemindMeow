import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/header.css';

export const Header = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatTime = (date) => {
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12
    const hoursStr = String(hours).padStart(2, '0');
    return `${hoursStr}:${minutes}:${seconds} ${ampm}`;
  };

  // Show header on all pages including auth pages
  // (removed the conditional hiding)

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="header-logo-icon">🔔</div>
        <h1 className="app-title">Alarm Reminder</h1>
      </div>

      <div className="header-center">
        <div className="header-clock">
          <span className="header-clock-dot"></span>
          <span>{formatTime(currentTime)} GMT+5:30</span>
        </div>
      </div>

      <nav className="header-nav">
        {isAuthenticated ? (
          <div className="auth-section logged-in">
            <span className="user-name">Welcome, {user?.name}</span>
            <button className="btn-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <div className="auth-section logged-out">
            <button
              className="btn-login"
              onClick={() => navigate('/login')}
              aria-label="Go to login page"
            >
              Login
            </button>
            <button
              className="btn-signup"
              onClick={() => navigate('/register')}
              aria-label="Go to sign up page"
            >
              Sign Up
            </button>
          </div>
        )}
      </nav>
    </header>
  );
};
