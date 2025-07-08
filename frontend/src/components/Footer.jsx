import React from "react";
import {
    fb,
    ig,
    tw,
    mastercard,
    visa,
    paypal,
    stripe,
    amex,
    gpay,
    applepay,
    googleplay,
    appstore,
    appgallery,
} from "../assets"; 

const Footer = () => {
    return (
        <footer className="login-footer">
            <div className="footer-links">
                <div>
                    <h4>Customer Service</h4>
                    <ul>
                        <li>Help Center</li>
                        <li>Payment Methods</li>
                        <li>Order Tracking</li>
                    </ul>
                </div>
                <div>
                    <h4>About Us</h4>
                    <ul>
                        <li>About Company</li>
                        <li>Privacy Policy</li>
                        <li>Careers</li>
                    </ul>
                </div>
                <div>
                    <h4>Payment</h4>
                    <ul>
                        <li>
                            <span><img src={visa} alt="Visa" /></span>
                            <span><img src={mastercard} alt="MasterCard" /></span>
                            <span><img src={amex} alt="AMEX" /></span>
                        </li>
                        <li>
                            <span><img src={stripe} alt="Stripe" /></span>
                            <span><img src={gpay} alt="Google Pay" /></span>
                            <span><img src={applepay} alt="Apple Pay" /></span>
                        </li>
                        <li>
                            <span><img src={paypal} alt="PayPal" /></span>
                        </li>
                    </ul>
                </div>
                <div>
                    <h4>Follow Us</h4>
                    <ul>
                        <li><img src={fb} alt="Facebook" className="social-icon" />Facebook</li>
                        <li><img src={ig} alt="Instagram" className="social-icon" />Instagram</li>
                        <li><img src={tw} alt="Twitter" className="social-icon" />Twitter</li>
                    </ul>
                </div>
                <div>
                    <h4>Mark Cart App Download</h4>
                    <ul>
                        <li><img src={appstore} alt="App Store" className="app-icon" /></li>
                        <li><img src={googleplay} alt="Google Play" className="app-icon" /></li>
                        <li><img src={appgallery} alt="AppGallery" className="app-icon" /></li>
                    </ul>
                </div>
            </div>

            <div className="footer-line"></div> {/* Line created using CSS */}
            <div className="footer-bottom">
                <span className="rights">© 2025 Mark Cart. All Rights Reserved.</span>
                <div className="country-region">
                    <p>Country & Region: </p>
                    <div className="country-list">
                        <span>Singapore</span>
                        <span>Indonesia</span>
                        <span>Thailand</span>
                        <span>Brazil</span>
                        <span>Malaysia</span>
                        <span>Vietnam</span>
                        <span>Philippines</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;