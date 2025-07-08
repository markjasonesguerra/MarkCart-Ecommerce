import React from "react";
import "../../styles/ProfileDashboard.css"; // Ensure this path is correct

const NotificationsSection = ({ notifications, handleNotificationChange }) => {
  return (
    <div className="notifications-section">
      {/* Email Notifications */}
      <div className="notification-category">
        <h3>Email Notifications</h3>
        <p>Important account notifications and reminders cannot be turned off</p>
        <div className="notification-item">
          <span>Order Updates</span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={notifications.email.orderUpdates}
              onChange={() => handleNotificationChange("email", "orderUpdates")}
            />
            <span className="slider"></span>
          </label>
        </div>
        <div className="notification-item">
          <span>Promotions</span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={notifications.email.promotions}
              onChange={() => handleNotificationChange("email", "promotions")}
            />
            <span className="slider"></span>
          </label>
        </div>
        <div className="notification-item">
          <span>Customer Surveys</span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={notifications.email.surveys}
              onChange={() => handleNotificationChange("email", "surveys")}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      {/* SMS Notifications */}
      <div className="notification-category">
        <h3>SMS Notifications</h3>
        <p>Important account notifications and reminders cannot be turned off</p>
        <div className="notification-item">
          <span>Promotions</span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={notifications.sms.promotions}
              onChange={() => handleNotificationChange("sms", "promotions")}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default NotificationsSection;
