import React from "react";
import "../styles/SuccessModal.css";
import {successgif} from "../assets";  // Adjust the path to your success GIF

const SuccessModal = ({ show, onClose }) => {
    if (!show) return null;

    return (
        <div className="succes5-modal-overlay">
            <div className="succes5-modal-content">
                <img src={successgif} alt="Success" className="succes5-success-gif" />
                <p>Item has been added to your shopping cart</p>
                <button onClick={onClose} className="succes5-close-button">Close</button>
            </div>
        </div>
    );
};

export default SuccessModal;