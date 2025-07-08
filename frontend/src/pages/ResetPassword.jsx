import React, { useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import {
    logo,
    errorIcon,
    successIcon
} from "../assets"; 
import "../styles/LoginSignUp.css";
import Footer from "../components/Footer";

const ResetPassword = () => {
    const { token } = useParams();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const API_BASE_URL =
        (process.env.NODE_ENV === 'development'
            ? 'http://localhost:8800'
            : process.env.REACT_APP_API_BASE_URL
        ).replace(/\/$/, '');


    const validatePassword = (password) => {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (password.length < minLength) {
            return `Password must be at least ${minLength} characters long.`;
        }
        if (!hasUpperCase) {
            return "Password must contain at least one uppercase letter.";
        }
        if (!hasLowerCase) {
            return "Password must contain at least one lowercase letter.";
        }
        if (!hasNumber) {
            return "Password must contain at least one number.";
        }
        if (!hasSpecialChar) {
            return "Password must contain at least one special character.";
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationError = validatePassword(password);
        if (validationError) {
            setError(validationError);
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        try {
            const res = await axios.post(`${API_BASE_URL}/password-reset/reset/${token}`, { password });
            setMessage(res.data.message);
            setError("");
            console.log("Password reset successful:", res.data.message); // Log success message
            setTimeout(() => {
                navigate("/login");
            }, 5000); // Redirect after 5 seconds
        } catch (err) {
            setMessage("");
            setError(err.response ? err.response.data.error : err.message);
            console.error("Error during password reset:", err); // Log the error
        }
    };

    return (
        <div className="login-page">
            <header className="login-header">
                <img src={logo} alt="E-commerce Logo" className="logo" />
                <button className="help-button">Need help?</button>
            </header>

            <div className="login-container">
                <div className="form-section centered-form">
                    <h3>Reset Password</h3>
                    {message && (
                        <div className="success-message">
                            <img src={successIcon} alt="Success" className="success-icon" />
                            <span>{message}</span>
                        </div>
                    )}                    
                    {error && (
                        <div className="error-message">
                            <img src={errorIcon} alt="Error" className="error-icon" />
                            <span>{error}</span>
                        </div>
                    )}
                    <form onSubmit={handleSubmit}>
                        <input
                            type="password"
                            placeholder="New Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Confirm New Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                        <button type="submit" className="login-button">Reset Password</button>
                    </form>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ResetPassword;