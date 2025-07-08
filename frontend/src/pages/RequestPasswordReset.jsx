import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
    logo,
    errorIcon,
    successIcon // Import the success icon
} from "../assets"; 
import "../styles/LoginSignUp.css";
import Footer from "../components/Footer.jsx";

const RequestPasswordReset = () => {
    const API_BASE_URL =
        (process.env.NODE_ENV === 'development'
            ? 'http://localhost:8800'
            : process.env.REACT_APP_API_BASE_URL
        ).replace(/\/$/, '');
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            console.log("Sending password reset request for email:", email); // Log the email being sent
            await axios.post(`${API_BASE_URL}/password-reset/request-password-reset`, { email });
            setMessage(`A verification email has been sent. Please verify it.`);
            setError(""); // Clear any previous error
        } catch (err) {
            console.error("Error during password reset request:", err); // Log the error
            setMessage(""); // Clear any previous message
            setError(err.response ? err.response.data.error : err.message);
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
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <button type="submit" className="login-button">Request Password Reset</button>
                    </form>
                    <div className="links">
                        <Link to="/login">Back to Login</Link>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default RequestPasswordReset;