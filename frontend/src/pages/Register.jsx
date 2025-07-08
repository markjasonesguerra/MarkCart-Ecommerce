import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
    logowhite,
    errorIcon,
    markcartSale, // Import the illustration
} from "../assets"; 
import "../styles/LoginSignUp.css";
import Footer from "../components/Footer.jsx";

const Register = () => {
    const [user, setUser] = useState({
        name: "",
        email: "",
        password: "",
        addressLine1: "",  // Address line 1
        addressLine2: "",  // Address line 2 (optional)
        city: "",          // City
        state: "",         // State (optional)
        postalCode: "",    // Postal code
        phoneNumber: "",
        role: "Customer",  // Default role
    });
    const API_BASE_URL =
        (process.env.NODE_ENV === 'development'
            ? 'http://localhost:8800'
            : process.env.REACT_APP_API_BASE_URL
        ).replace(/\/$/, '');


    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
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

    const handleChange = (e) => {
        setUser((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleClick = async (e) => {
        e.preventDefault();
        if (!validateEmail(user.email)) {
            setError("Invalid email format");
            return;
        }
        const passwordError = validatePassword(user.password);
        if (passwordError) {
            setError(passwordError);
            return;
        }
        if (!user.name || !user.addressLine1 || !user.city || !user.phoneNumber || !user.postalCode) {
            setError("All address fields are required");
            return;
        }
        if (!/^\d{11}$/.test(user.phoneNumber)) {
            setError("Phone number must be exactly 11 digits long");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            console.log("Sending registration data:", user); // Log the data being sent
            await axios.post(`${API_BASE_URL}/auth/register`, user);
            navigate("/login"); // Redirect to the login page
        } catch (err) {
            console.error("Registration error:", err.response ? err.response.data : err.message); // Log the error
            setError("Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <header className="login-header">
                <img src={logowhite} alt="Mark Cart" className="logo" onClick={() => navigate("/")}/>
                <button className="help-button">Need help?</button>
            </header>

            <div className="login-container">
                <div className="promo-section">
                    <img src={markcartSale} alt="Mark Cart Sale" className="markcart-sale" /> {/* Add the illustration */}
                </div>

                <div className="form-section">
                    <h3>Register</h3>
                    {error && (
                        <div className="error-message">
                            <img src={errorIcon} alt="Error" className="error-icon" />
                            <span>{error}</span>
                        </div>
                    )}
                    <form onSubmit={handleClick}>
                        <input
                            type="text"
                            placeholder="Name"
                            onChange={handleChange}
                            name="name"
                            value={user.name}
                            required
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            onChange={handleChange}
                            name="email"
                            value={user.email}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            onChange={handleChange}
                            name="password"
                            value={user.password}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Address Line 1"
                            onChange={handleChange}
                            name="addressLine1"
                            value={user.addressLine1}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Address Line 2 (Optional)"
                            onChange={handleChange}
                            name="addressLine2"
                            value={user.addressLine2}
                        />
                        <input
                            type="text"
                            placeholder="City"
                            onChange={handleChange}
                            name="city"
                            value={user.city}
                            required
                        />
                        <input
                            type="text"
                            placeholder="State (Optional)"
                            onChange={handleChange}
                            name="state"
                            value={user.state}
                        />
                        <input
                            type="text"
                            placeholder="Postal Code"
                            onChange={handleChange}
                            name="postalCode"
                            value={user.postalCode}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Phone Number"
                            onChange={handleChange}
                            name="phoneNumber"
                            pattern="\d{11}"
                            required
                        />
                        <button type="submit" className="login-button" disabled={loading}>
                            {loading ? "Registering..." : "Register"}
                        </button>
                    </form>
                    <p className="signup" style={{ marginTop: "20px" }}>
                        Already have an account? <a href="/login"><span className="signup-login">Log In</span></a>
                    </p>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Register;