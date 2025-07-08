import React, { useState } from "react";
import "../../styles/ProfileDashboard.css"; // Ensure this path is correct
import {add} from "../../assets"; // Ensure this path is correct

const AddressesSection = ({
  addresses,
  handleAddAddress,
  handleEditAddress,
  handleDeleteAddress,
  handleSetPrimaryAddress,
}) => {
  const [editingAddressID, setEditingAddressID] = useState(null);
  const [addressForm, setAddressForm] = useState({
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    isPrimary: false,
  });
  const [isAdding, setIsAdding] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEditClick = (address) => {
    setEditingAddressID(address.addressID);
    setAddressForm({
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      isPrimary: address.isPrimary,
    });
    setIsModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setAddressForm((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (isAdding) {
      await handleAddAddress(addressForm);
    } else {
      await handleEditAddress(editingAddressID, addressForm);
    }
    setEditingAddressID(null);
    setIsAdding(false);
    setIsModalOpen(false);
    setAddressForm({
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      isPrimary: false,
    });
  };

  const handleAddClick = () => {
    setIsAdding(true);
    setEditingAddressID(null);
    setAddressForm({
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      isPrimary: false,
    });
    setIsModalOpen(true);
  };

  return (
    <div className="addresses-section">
      <button className="add-address-btn" onClick={handleAddClick}>
        <img src={add} alt="Add" className="button-icon" />
        Add New Address
      </button>

      {isModalOpen && (
        <div className="address-modal-overlay">
            <div className="address-modal-content">
            <h2>{isAdding ? "Add New Address" : "Edit Address"}</h2>
            <form className="address-form" onSubmit={handleFormSubmit}>
                <div className="form-group">
                    <label htmlFor="addressLine1">Address Line 1</label>
                    <input
                    type="text"
                    id="addressLine1"
                    name="addressLine1"
                    value={addressForm.addressLine1}
                    onChange={handleFormChange}
                    placeholder="Address Line 1"
                    required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="addressLine2">Address Line 2</label>
                    <input
                    type="text"
                    id="addressLine2"
                    name="addressLine2"
                    value={addressForm.addressLine2}
                    onChange={handleFormChange}
                    placeholder="Address Line 2"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="city">City</label>
                    <input
                    type="text"
                    id="city"
                    name="city"
                    value={addressForm.city}
                    onChange={handleFormChange}
                    placeholder="City"
                    required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="state">Region</label>
                    <input
                    type="text"
                    id="state"
                    name="state"
                    value={addressForm.state}
                    onChange={handleFormChange}
                    placeholder="State"
                    required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="postalCode">Postal Code</label>
                    <input
                    type="text"
                    id="postalCode"
                    name="postalCode"
                    value={addressForm.postalCode}
                    onChange={handleFormChange}
                    placeholder="Postal Code"
                    required
                    />
                </div>
                <div className="address-modal-actions">
                    <button type="submit" className="address-save-button">Save</button>
                    <button
                    type="button"
                    className="address-cancel-button"
                    onClick={() => setIsModalOpen(false)}
                    >
                    Cancel
                    </button>
                </div>
                </form>

            </div>
        </div>
        )}


      <div className="address-list">
        {addresses.map((address) => (
          <div
            key={address.addressID}
            className={`address-card ${
              address.isPrimary ? "primary-address" : ""
            }`}
          >
            <div className="address-info">
              <p>
                {address.addressLine1}
                {address.addressLine2 && `, ${address.addressLine2}`} <br />
                {address.city}, {address.state}, {address.postalCode}
              </p>
            </div>
            <div className="address-actions">
              <button
                onClick={() => handleSetPrimaryAddress(address.addressID)}
                disabled={address.isPrimary}
                className="default-btn"
              >
                {address.isPrimary ? "Default" : "Set as Default"}
              </button>
              <button onClick={() => handleEditClick(address)}>Edit</button>
              <button onClick={() => handleDeleteAddress(address.addressID)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AddressesSection;