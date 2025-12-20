import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../styles/adminStyles/ManageVouchers.css";

const AddVoucher = () => {
  const [voucher, setVoucher] = useState({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    minPurchase: "",
    maxDiscount: "",
    startDate: "",
    endDate: "",
    usageLimit: 1,
    createdAt: new Date().toISOString().split("T")[0],
  });

  const navigate = useNavigate();
  const API_BASE_URL =
      (process.env.NODE_ENV === 'development'
          ? 'http://localhost:8800'
          : process.env.REACT_APP_API_BASE_URL
      ).replace(/\/$/, '');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setVoucher((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/vouchers`, voucher);
      alert("Voucher added successfully!");
      navigate("/admin/manage-vouchers");
    } catch (err) {
      console.error("Error adding voucher:", err);
      alert("Failed to add voucher.");
    }
  };

  return (
    <div className="form-container add-voucher-container">
      <div className="form-header">
        <h1>Add New Voucher</h1>
        <p className="form-subtitle">Create a new voucher for your customers</p>
      </div>
      
      <form className="add-voucher-form" onSubmit={handleSubmit}>
        
        <div className="voucher-form-row">
          <div className="voucher-form-group">
            <label>Voucher Code</label>
            <input
              type="text"
              placeholder="e.g. SUMMER2024"
              name="code"
              value={voucher.code}
              onChange={handleChange}
              required
            />
          </div>
          <div className="voucher-form-group">
            <label>Usage Quantity</label>
            <input
              type="number"
              placeholder="100"
              name="usageLimit"
              value={voucher.usageLimit}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="voucher-form-group full-width">
          <label>Description</label>
          <textarea
            placeholder="Describe the voucher details..."
            name="description"
            value={voucher.description}
            onChange={handleChange}
            required
            rows="3"
          />
        </div>

        <div className="voucher-form-row">
          <div className="voucher-form-group">
            <label>Start Date</label>
            <input
              type="date"
              name="startDate"
              value={voucher.startDate}
              onChange={handleChange}
              required
            />
          </div>
          <div className="voucher-form-group">
            <label>End Date</label>
            <input
              type="date"
              name="endDate"
              value={voucher.endDate}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="voucher-form-row">
          <div className="voucher-form-group">
            <label>Discount Type</label>
            <select
              name="discountType"
              value={voucher.discountType}
              onChange={handleChange}
              required
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (₱)</option>
            </select>
          </div>
          <div className="voucher-form-group">
            <label>Discount Value</label>
            <div className="input-wrapper">
                <input
                type="number"
                placeholder={voucher.discountType === "percentage" ? "10" : "100"}
                name="discountValue"
                value={voucher.discountValue}
                onChange={handleChange}
                required
                />
                <span className="input-suffix">{voucher.discountType === "percentage" ? "%" : "₱"}</span>
            </div>
          </div>
        </div>

        <div className="voucher-form-row">
          <div className="voucher-form-group">
            <label>Minimum Basket Price</label>
            <div className="input-wrapper">
                <span className="input-prefix">₱</span>
                <input
                type="number"
                placeholder="0.00"
                name="minPurchase"
                value={voucher.minPurchase}
                onChange={handleChange}
                />
            </div>
          </div>
          
          <div className="voucher-form-group">
            <label>Maximum Price Discount</label>
            <div className="input-wrapper">
                <span className="input-prefix">₱</span>
                <input
                type="number"
                placeholder="0.00"
                name="maxDiscount"
                value={voucher.maxDiscount}
                onChange={handleChange}
                disabled={voucher.discountType !== "percentage"}
                style={{ opacity: voucher.discountType !== "percentage" ? 0.5 : 1 }}
                />
            </div>
          </div>
        </div>

        <div className="button-group">
          <button type="button" className="voucher-cancel-button" onClick={() => navigate("/admin/manage-vouchers")}>Cancel</button>
          <button type="submit" className="voucher-confirm-button">Create Voucher</button>
        </div>
      </form>
    </div>
  );
};

export default AddVoucher;