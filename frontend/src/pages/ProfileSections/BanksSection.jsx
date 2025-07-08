import React from "react";
import "../../styles/ProfileDashboard.css"; // Ensure this path is correct
import {add} from "../../assets"; // Ensure this path is correct
 
const BanksSection = ({ banks, handleAddBank }) => {
  return (
    <div className="banks-section">
        <button onClick={handleAddBank} className="add-bank-button"> <img src={add} alt="Add" className="button-icon" />Add Bank or Card</button>
      {banks.length === 0 ? (
        <p className="empty-message">No banks or cards added.</p>
      ) : (
        <ul className="banks-list">
          {banks.map((bank) => (
            <li key={bank.id} className="bank-item">
              <span className="bank-name">{bank.name}</span>
              <span className="bank-card-number">{bank.cardNumber}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BanksSection;