import React from 'react';
import PropTypes from 'prop-types';
import '../styles/ConfirmationModal.css'; // Create this CSS file for styling

const ConfirmationModal = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="com-modal-overlay">
      <div className="com-modal-content">
        <h2>Confirmation</h2>
        <p>{message}</p>
        <div className="com-modal-actions">
          <button className="com-confirm-button" onClick={onConfirm}>Confirm</button>
          <button className="com-cancel-button" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

ConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  message: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default ConfirmationModal;