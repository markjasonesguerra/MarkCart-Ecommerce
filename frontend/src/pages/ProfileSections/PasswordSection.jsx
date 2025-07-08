import React, { useState } from "react";
import { successIcon, errorIcon } from "../../assets";
import "../../styles/ProfileDashboard.css"; // Ensure this path is correct

const ChangePasswordSection = ({ handleChangePassword, verifyOldPassword }) => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [step, setStep] = useState(1); // Step 1: Verify old password, Step 2: Change password
  const [loading, setLoading] = useState(false);

  const handleVerifyOldPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await verifyOldPassword(oldPassword);
      setStep(2);
    } catch (err) {
      setError(err.message || "Failed to verify old password. Please try again.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      return `Password must be at least ${minLength} characters long.`;
    }
    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      return "Password must include uppercase, lowercase, number, and special character.";
    }
    return null;
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setError(null);
  
    // Validate new password
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      setTimeout(() => setError(null), 3000);
      return;
    }
  
    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      setTimeout(() => setError(null), 3000);
      return;
    }
  
    setLoading(true);
    try {
      await handleChangePassword(oldPassword, newPassword);
      setSuccess("Password changed successfully!");
  
      // Keep the success message visible for a few seconds before resetting the form
      setTimeout(() => {
        setSuccess(null);
        setStep(1);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }, 3000); // Success message visible for 3 seconds
    } catch (err) {
      setError(err.message || "Failed to change password. Please try again.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="change-password-section">
      {step === 1 && (
        <form onSubmit={handleVerifyOldPassword} className="password-form">
          {error && (
            <div className="error-message">
              <img src={errorIcon} alt="Error" className="error-icon" />
              {error}
            </div>
          )}
          <div className="form-group">
            <input
              type="password"
              placeholder="Old Password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="password-button" disabled={loading}>
            {loading ? "Verifying..." : "Verify Old Password"}
          </button>
        </form>
      )}
      {step === 2 && (
        <form onSubmit={handleChangePasswordSubmit} className="password-form">
          {error && (
            <div className="error-message">
              <img src={errorIcon} alt="Error" className="error-icon" />
              {error}
            </div>
          )}
          {success && (
            <div className="success-overlay">
              <div className="success-dialog">
                <img src={successIcon} alt="Success" className="success-icon" />
                {success}
              </div>
            </div>
          )}
          <div className="form-group">
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="password-button" disabled={loading}>
            {loading ? "Changing..." : "Change Password"}
          </button>
        </form>
      )}
    </div>
  );
};

export default ChangePasswordSection;