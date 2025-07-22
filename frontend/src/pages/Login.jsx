import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import {
    logowhite,
    fbIcon,
    googleIcon,
    errorIcon,
    adminIcon,
    markcartSale // Import the illustration
} from "../assets"; 
import "../styles/LoginSignUp.css";
import Footer from "../components/Footer.jsx";

const Login = ({ setUser }) => {
    const API_BASE_URL =
        (process.env.NODE_ENV === 'development'
            ? 'http://localhost:8800'
            : process.env.REACT_APP_API_BASE_URL
        ).replace(/\/$/, '');
    const [pendingUser, setPendingUser] = useState(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [token, setToken] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [show2FA, setShow2FA] = useState(false);
    const [secret, setSecret] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);
    const [showAdminNotice, setShowAdminNotice] = useState(false);
    const [cooldown, setCooldown] = useState(false);  // New state for cooldown
    const [cooldownTimer, setCooldownTimer] = useState(0);  // Track the cooldown time
    const navigate = useNavigate();

    useEffect(() => {
        if (isAdmin) {
            setShowAdminNotice(true);
            const timer = setTimeout(() => {
                setShowAdminNotice(false);
            }, 5000); // Hide after 5 seconds
            return () => clearTimeout(timer);
        }
    }, [isAdmin]);

    useEffect(() => {
        let timer;
        if (cooldownTimer > 0) {
            timer = setInterval(() => {
                setCooldownTimer((prev) => prev - 1);  // Decrease the timer every second
            }, 1000);
        } else if (cooldownTimer === 0 && cooldown) {
            setCooldown(false);  // Allow the user to request again
        }

        return () => clearInterval(timer);  // Clean up the interval
    }, [cooldownTimer, cooldown]);

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateEmail(email)) {
            setError("Invalid email format");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters long");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            console.log("Sending login data:", { email, password }); // Log the data being sent
            const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
            const user = res.data.user;

            // // Save user info to local storage or state
            // localStorage.setItem("user", JSON.stringify(user));
            // setUser(user);
            setPendingUser(user); // Set pending user state

            // Check if the user is an admin
            if (user.role === "Admin") {
                setIsAdmin(true); // Set admin flag
            }

            // Show 2FA input
            setSecret(res.data.secret);
            setShow2FA(true);
        } catch (err) {
            console.error("Login error:", err.response ? err.response.data : err.message); // Log the error
            setError("Invalid email or password");
        } finally {
            setLoading(false);
        }
    };

    const handle2FASubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            console.log("Sending 2FA token:", { token, secret }); // Log the data being sent
            const res = await axios.post(`${API_BASE_URL}/auth/verify-2fa`, { token, secret });
            if (res.status === 200) {
                if (pendingUser) {
                    localStorage.setItem("user", JSON.stringify(pendingUser));
                    setUser(pendingUser);
                }
                if (isAdmin) {
                    navigate("/admin"); // Redirect to the admin dashboard
                } else {
                    navigate("/"); // Redirect to the home page
                }
            } else {
                setError("Invalid 2FA token");
            }
        } catch (err) {
            console.error("2FA verification error:", err.response ? err.response.data : err.message); // Log the error
            setError("Invalid 2FA token");
        } finally {
            setLoading(false);
        }
    };

    const handleResend = () => {
        if (cooldown) {
            setError("Please wait before requesting a new code.");
            return;
        }
        setCooldown(true); // Set cooldown to true
        setCooldownTimer(120); // Start a 2-minute timer
        // Request a new 2FA code from the server 
        axios.post(`${API_BASE_URL}/auth/resend-2fa`, { email })
            .then(() => {
                setError(null);
                setCooldownTimer(120); // Start the cooldown timer again
            })
            .catch(() => setError("Failed to resend 2FA code"));
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
                    <h3>Log In</h3>
                    {error && (
                        <div className="error-message">
                            <img src={errorIcon} alt="Error" className="error-icon" />
                            <span>{error}</span>
                        </div>
                    )}
                    {!show2FA ? (
                        <form onSubmit={handleSubmit}>
                            <input
                                type="text"
                                placeholder="Phone number / Username / Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button type="submit" className="login-button" disabled={loading}>
                                {loading ? "Logging in..." : "LOG IN"}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handle2FASubmit}>
                            {isAdmin && showAdminNotice && (
                                <p className="admin-notice">
                                    <img src={adminIcon} alt="Admin Icon" className="admin-icon" />
                                    Admin authentication required.
                                </p>
                            )}
                            <input
                                type="text"
                                placeholder="Enter 2FA token"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                required
                                disabled={cooldown} // Disable input during cooldown
                            />
                            {cooldown && (
                                <div className="cooldown-message">
                                    <p>Please wait {cooldownTimer} seconds before requesting a new code.</p>
                                    <button onClick={handleResend} disabled={cooldown}>Resend Code</button>
                                </div>
                            )}
                            <button type="submit" className="login-button" disabled={loading || cooldown}>
                                {loading ? "Verifying..." : "Verify 2FA"}
                            </button>
                        </form>
                    )}
                    <div className="links">
                        <Link to="/request-password-reset">Forgot Password</Link>
                        <span> | </span>
                        <a href="/login-phone">Log in with Phone Number</a>
                    </div>
                    <div className="social-login">
                        <div className="divider">
                            <span>OR</span>
                        </div>
                        <button className="social-button facebook">
                            <img src={fbIcon} alt="Facebook" /> Facebook
                        </button>
                        <button className="social-button google">
                            <img src={googleIcon} alt="Google" /> Google
                        </button>
                    </div>
                    <p className="signup">
                        New to Mark Cart? <a href="/signup"><span className="signup-login">Sign Up</span ></a>
                    </p>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Login;