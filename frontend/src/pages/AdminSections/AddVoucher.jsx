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
    <div className="form-container">
      <h1>Add New Voucher</h1>
      <form className="voucher-form" onSubmit={handleSubmit}>
        <label>
          Voucher Code:
          <input
            type="text"
            placeholder="Voucher Code"
            name="code"
            value={voucher.code}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Description:
          <textarea
            placeholder="Description"
            name="description"
            value={voucher.description}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Voucher Usage Period:
          <div className="date-inputs">
            <input
              type="date"
              name="startDate"
              value={voucher.startDate}
              onChange={handleChange}
              required
            />
            <span>–</span>
            <input
              type="date"
              name="endDate"
              value={voucher.endDate}
              onChange={handleChange}
              required
            />
          </div>
        </label>
        <label>
          Discount Type | Amount:
          <div className="discount-inputs">
            <select
              name="discountType"
              value={voucher.discountType}
              onChange={handleChange}
              required
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
            <input
              type="number"
              placeholder={voucher.discountType === "percentage" ? "%OFF" : "Amount ₱"}
              name="discountValue"
              value={voucher.discountValue}
              onChange={handleChange}
              required
              style={{ width: "160px" }} // Adjust the width as needed
            />
          </div>
        </label>
        <label>
          Minimum Basket Price:
          <input
            type="number"
            placeholder="₱ Minimum Purchase"
            name="minPurchase"
            value={voucher.minPurchase}
            onChange={handleChange}
          />
        </label>
        {voucher.discountType === "percentage" && (
          <label>
            Maximum Price Discount:
            <input
              type="number"
              placeholder="₱ Maximum Discount"
              name="maxDiscount"
              value={voucher.maxDiscount}
              onChange={handleChange}
            />
          </label>
        )}
        <label>
          Usage Quantity:
          <input
            type="number"
            placeholder="Usage Limit"
            name="usageLimit"
            value={voucher.usageLimit}
            onChange={handleChange}
            required
          />
        </label>
        <div className="button-group">
          <button type="submit" className="voucher-confirm-button">Confirm</button>
          <button type="button" className="voucher-cancel-button" onClick={() => navigate("/admin/manage-vouchers")}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default AddVoucher;