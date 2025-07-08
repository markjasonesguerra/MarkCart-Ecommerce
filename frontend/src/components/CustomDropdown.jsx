import React, { useState } from 'react';
import PropTypes from 'prop-types';
import "../styles/adminStyles/CustomDropdown.css";

const CustomDropdown = ({ options, value, onChange, name }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOptionClick = (optionValue) => {
    onChange({ target: { name, value: optionValue } });
    setIsOpen(false);
  };

  return (
    <div className={`custom-dropdown ${name === 'status' || name === 'paymentStatus' ? 'margin-bottom' : ''}`}>
      <div className="custom-dropdown-selected" onClick={() => setIsOpen(!isOpen)}>
        {options.find(option => option.value === value)?.label}
        <span className="dropdown-arrow">&#9662;</span>
      </div>
      {isOpen && (
        <div className="custom-dropdown-options">
          {options.map((option) => (
            <div
              key={option.value}
              className={`custom-dropdown-option ${value === option.value ? 'selected' : ''}`}
              onClick={() => handleOptionClick(option.value)}
            >
              <img src={option.icon} alt={option.label} className="icon" />
              <span>{option.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

CustomDropdown.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.string.isRequired,
    })
  ).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
};

export default CustomDropdown;