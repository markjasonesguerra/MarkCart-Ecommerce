import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import {
    logowhite,
    errorIcon,
    markcartSale,
    googleIcon
} from "../assets"; 
import "../styles/LoginSignUp.css";
import Footer from "../components/Footer.jsx";

const Register = ({ setUser }) => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        phoneNumber: "",
        role: "Customer",
    });
    const API_BASE_URL =
        (process.env.NODE_ENV === 'development'
            ? 'http://localhost:8800'
            : process.env.REACT_APP_API_BASE_URL
        ).replace(/\/$/, '');


    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    // 2FA states
    const [show2FA, setShow2FA] = useState(false);
    const [pendingUser, setPendingUser] = useState(null);
    const [token, setToken] = useState("");
    const [secret, setSecret] = useState("");
    const [qrCodeUrl, setQrCodeUrl] = useState("");

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
            return "Password must contain at least one special character (!@#$%^&*).";
        }
        return null;
    };

    const getPasswordRequirements = (password) => {
        return [
            { text: "At least 8 characters", met: password.length >= 8 },
            { text: "Uppercase letter", met: /[A-Z]/.test(password) },
            { text: "Lowercase letter", met: /[a-z]/.test(password) },
            { text: "Number", met: /[0-9]/.test(password) },
            { text: "Special character", met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
        ];
    };

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateEmail(formData.email)) {
            setError("Invalid email format");
            return;
        }
        const passwordError = validatePassword(formData.password);
        if (passwordError) {
            setError(passwordError);
            return;
        }
        if (formData.password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        if (!formData.name || !formData.addressLine1 || !formData.city || !formData.phoneNumber || !formData.postalCode) {
            setError("All address fields are required");
            return;
        }
        if (!/^\d{11}$/.test(formData.phoneNumber)) {
            setError("Phone number must be exactly 11 digits long");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await axios.post(`${API_BASE_URL}/auth/register`, formData);
            navigate("/login");
        } catch (err) {
            console.error("Registration error:", err.response ? err.response.data : err.message);
            if (err.response && err.response.data && err.response.data.error) {
                setError(err.response.data.error);
            } else {
                setError("Registration failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const googleSignup = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const res = await axios.post(`${API_BASE_URL}/auth/google-login`, {
                    token: tokenResponse.access_token,
                });
                
                if (!res.data.isNewUser) {
                    // User already exists, redirect to login with state
                    navigate("/login", { 
                        state: { 
                            pendingUser: res.data.user, 
                            secret: res.data.secret,
                            message: "Account already exists. Proceeding to login..."
                        } 
                    });
                    return;
                }

                setPendingUser(res.data.user);
                setSecret(res.data.secret);
                if (res.data.qrCode) {
                    setQrCodeUrl(res.data.qrCode);
                }
                setShow2FA(true);
            } catch (err) {
                console.error("Google signup error:", err);
                setError("Google signup failed");
            }
        },
        onError: () => {
            setError("Google signup failed");
        }
    });

    const handle2FASubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await axios.post(`${API_BASE_URL}/auth/verify-2fa`, { token, secret });
            if (res.status === 200) {
                if (pendingUser) {
                    localStorage.setItem("user", JSON.stringify(pendingUser));
                    setUser(pendingUser);
                    navigate("/");
                }
            } else {
                setError("Invalid 2FA token");
            }
        } catch (err) {
            setError("Invalid 2FA token");
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
                    
                    {!show2FA ? (
                        <>
                            <div className="social-login">
                                <button className="social-button google" onClick={() => googleSignup()}>
                                    <img src={googleIcon} alt="Google" /> Sign up with Google
                                </button>
                            </div>
                            
                            <div className="divider">
                                <span>OR</span>
                            </div>

                            <form onSubmit={handleSubmit} className="register-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <input
                                            type="text"
                                            placeholder="Name"
                                            onChange={handleChange}
                                            name="name"
                                            value={formData.name}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <input
                                            type="text"
                                            placeholder="Phone Number"
                                            onChange={handleChange}
                                            name="phoneNumber"
                                            pattern="\d{11}"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        onChange={handleChange}
                                        name="email"
                                        value={formData.email}
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <div className="password-wrapper">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Password"
                                                onChange={handleChange}
                                                name="password"
                                                value={formData.password}
                                                required
                                            />
                                            <span 
                                                className="password-toggle"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? "Hide" : "Show"}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <div className="password-wrapper">
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                placeholder="Confirm Password"
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                value={confirmPassword}
                                                required
                                            />
                                            <span 
                                                className="password-toggle"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            >
                                                {showConfirmPassword ? "Hide" : "Show"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {formData.password && (
                                    <div className="password-requirements">
                                        <p>Password must contain:</p>
                                        <ul>
                                            {getPasswordRequirements(formData.password).map((req, index) => (
                                                <li key={index} className={req.met ? "met" : "unmet"}>
                                                    {req.met ? "✓" : "○"} {req.text}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="form-group">
                                    <input
                                        type="text"
                                        placeholder="Address Line 1"
                                        onChange={handleChange}
                                        name="addressLine1"
                                        value={formData.addressLine1}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <input
                                        type="text"
                                        placeholder="Address Line 2 (Optional)"
                                        onChange={handleChange}
                                        name="addressLine2"
                                        value={formData.addressLine2}
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <input
                                            type="text"
                                            placeholder="City"
                                            onChange={handleChange}
                                            name="city"
                                            value={formData.city}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <input
                                            type="text"
                                            placeholder="State (Optional)"
                                            onChange={handleChange}
                                            name="state"
                                            value={formData.state}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <input
                                            type="text"
                                            placeholder="Postal Code"
                                            onChange={handleChange}
                                            name="postalCode"
                                            value={formData.postalCode}
                                            required
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="login-button" disabled={loading}>
                                    {loading ? "Registering..." : "Register"}
                                </button>
                            </form>
                        </>
                    ) : (
                        <form onSubmit={handle2FASubmit}>
                            <p style={{ textAlign: 'center', marginBottom: '15px' }}>
                                Please enter the 2FA code sent to your email.
                            </p>
                            {qrCodeUrl && (
                                <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                                    <p>Or scan this QR code with your authenticator app:</p>
                                    <img src={qrCodeUrl} alt="2FA QR Code" style={{ width: '150px', height: '150px' }} />
                                </div>
                            )}
                            <input
                                type="text"
                                placeholder="Enter 2FA Token"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                required
                            />
                            <button type="submit" className="login-button" disabled={loading}>
                                {loading ? "Verifying..." : "Verify"}
                            </button>
                        </form>
                    )}

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