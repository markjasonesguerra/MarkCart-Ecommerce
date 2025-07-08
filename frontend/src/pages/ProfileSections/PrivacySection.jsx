import React, { useState } from "react";
import "../../styles/ProfileDashboard.css"; // Ensure this path is correct

const PrivacySection = ({ handleDeleteProfile }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDeleteClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleProceed = () => {
    handleDeleteProfile();
    setIsModalOpen(false);
  };

  return (
    <div className="privacy-section">
      <div className="privacy-options">
        <p>Your account is private and secure. You can manage your privacy settings here.</p>
        <button className="delete-account-button" onClick={handleDeleteClick}>
          Delete Account
        </button>
      </div>

      {isModalOpen && (
        <div className="privacy-modal-overlay">
          <div className="privacy-modal-content">
            <h2>Important</h2>
            <p>
              By clicking on “Proceed”, you agree to the following:
              <ul>
                <li>Account deletion is irreversible. Upon successful deletion of your account, you will not be able to log in to the deleted account and view account history.</li>
                <li>Your account cannot be deleted if you have any pending purchases, sales and/or outstanding matters including legal matters.</li>
                <li>After successful deletion of your account, Tekko may retain certain data in accordance with Tekko Privacy Policy and applicable law.</li>
                <li>Tekko reserves the right to reject future account creation requests by you.</li>
                <li>The deletion of your account does not discharge you from any outstanding liabilities and/or obligations.</li>
              </ul>
            </p>
            <div className="privacy-modal-actions">
              <button className="privacy-proceed-button" onClick={handleProceed}>Proceed</button>
              <button className="privacy-cancel-button" onClick={handleCloseModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrivacySection;