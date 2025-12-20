import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { format } from "date-fns"; // Import date-fns for date formatting
import "../../styles/adminStyles/ManageVouchers.css";
import { add } from "../../assets"; // Ensure the icon is correctly imported

const API_BASE_URL =
    (process.env.NODE_ENV === 'development'
        ? 'http://localhost:8800'
        : process.env.REACT_APP_API_BASE_URL
    ).replace(/\/$/, '');

const ManageVouchers = () => {
  const [vouchers, setVouchers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    startDate: "",
    endDate: "",
    discountType: "fixed",
    discountValue: "",
    minPurchase: "",
    maxDiscount: "",
    usageLimit: "",
  });
  const [voucherUsage, setVoucherUsage] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteVoucher, setDeleteVoucher] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [endVoucher, setEndVoucher] = useState(null);

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/vouchers`);
        setVouchers(res.data);
        res.data.forEach(voucher => fetchVoucherUsage(voucher.voucherID));
      } catch (err) {
        console.error("Error fetching vouchers:", err);
        alert("Failed to fetch vouchers. Please try again later.");
      }
    };

    fetchVouchers();
  }, []);

  const fetchVoucherUsage = async (voucherID) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/vouchers/usage/${voucherID}`);
      setVoucherUsage((prevUsage) => ({
        ...prevUsage,
        [voucherID]: res.data[0]?.totalUsage || 0,
      }));
    } catch (err) {
      console.error("Error fetching voucher usage:", err);
      alert("Failed to fetch voucher usage. Please try again later.");
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleEdit = (voucher) => {
    setEditingVoucher(voucher.voucherID);
    setFormData({
      code: voucher.code,
      description: voucher.description,
      startDate: format(new Date(voucher.startDate), "yyyy-MM-dd"),
      endDate: format(new Date(voucher.endDate), "yyyy-MM-dd"),
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      minPurchase: voucher.minPurchase,
      maxDiscount: voucher.maxDiscount,
      usageLimit: voucher.usageLimit,
    });
  };

  const handleDelete = (voucher) => {
    setDeleteVoucher(voucher);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/vouchers/${deleteVoucher.voucherID}`);
      setVouchers(vouchers.filter((voucher) => voucher.voucherID !== deleteVoucher.voucherID));
      setIsModalOpen(false);
      setSuccessMessage("Voucher deleted successfully!");
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000); // Hide the message after 3 seconds
    } catch (err) {
      console.error("Error deleting voucher:", err);
      alert("Failed to delete voucher. Please try again later.");
    }
  };

  const handleEnd = (voucher) => {
    setEndVoucher(voucher);
    setIsEndModalOpen(true);
  };

  const confirmEnd = async () => {
    try {
      await axios.put(`${API_BASE_URL}/vouchers/end/${endVoucher.voucherID}`);
      const res = await axios.get(`${API_BASE_URL}/vouchers`);
      setVouchers(res.data);
      setIsEndModalOpen(false);
      setSuccessMessage("Voucher ended successfully!");
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000); // Hide the message after 3 seconds
    } catch (err) {
      console.error("Error ending voucher:", err);
      alert("Failed to end voucher. Please try again later.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingVoucher) {
        await axios.put(`${API_BASE_URL}/vouchers/${editingVoucher}`, formData);
      } else {
        const formDataToSend = { ...formData };
        if (formData.discountType === "fixed") {
          formDataToSend.maxDiscount = formData.discountValue; // Set maxDiscount to discountValue for fixed type
        }
        await axios.post(`${API_BASE_URL}/vouchers`, formDataToSend);
      }
      setEditingVoucher(null);
      setFormData({
        code: "",
        description: "",
        startDate: "",
        endDate: "",
        discountType: "fixed",
        discountValue: "",
        minPurchase: "",
        maxDiscount: "",
        usageLimit: "",
      });
      const res = await axios.get(`${API_BASE_URL}/vouchers`);
      setVouchers(res.data);
    } catch (err) {
      console.error("Error saving voucher:", err);
      alert("Failed to save voucher. Please try again later.");
    }
  };

  const handleCancelEdit = () => {
    setEditingVoucher(null);
    setFormData({
      code: "",
      description: "",
      startDate: "",
      endDate: "",
      discountType: "fixed",
      discountValue: "",
      minPurchase: "",
      maxDiscount: "",
      usageLimit: "",
    });
  };

  const filteredVouchers = vouchers.filter(
    (voucher) =>
      voucher.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      voucher.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatus = (startDate, endDate) => {
    const now = new Date();
    if (now < new Date(startDate)) {
      return { text: "Upcoming", color: "#ee4d2d", backgroundColor: "#FFF1F0" };
    } else if (now > new Date(endDate)) {
      return { text: "Expired", color: "#666", backgroundColor: "#EEEEEE" };
    } else {
      return { text: "Ongoing", color: "#5c7", backgroundColor: "#EAF9EF" };
    }
  };

  return (
    <div className="manage-vouchers">
      <div className="header">
        <h2>Manage Vouchers</h2>
        <div className="header-actions">
          <input
            type="text"
            placeholder="Search by code or description"
            value={searchQuery}
            onChange={handleSearch}
            className="search-bar"
          />
          <Link to="/admin/add-voucher" className="create-voucher-button">
            <img src={add} alt="Add" className="button-icon" />
            Create Voucher
          </Link>
        </div>
      </div>
      {(editingVoucher !== null || formData.code !== "") && (
        <form className="voucher-form" onSubmit={handleFormSubmit}>
          <label>
            Voucher Code:
            <input type="text" name="code" value={formData.code} onChange={handleInputChange} required />
          </label>
          <label>
            Description:
            <textarea name="description" value={formData.description} onChange={handleInputChange} required />
          </label>
          <label>
            Voucher Usage Period:
            <div className="date-inputs">
              <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} required />
              <span>–</span>
              <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} required />
            </div>
          </label>
          <label>
            Discount Type | Amount:
            <div className="discount-inputs">
              <select name="discountType" value={formData.discountType} onChange={handleInputChange} required>
                <option value="fixed">Fixed Amount</option>
                <option value="percentage">Percentage</option>
              </select>
              <input
                type="number"
                placeholder={formData.discountType === "percentage" ? "%OFF" : "Amount ₱"}
                name="discountValue"
                value={formData.discountValue}
                onChange={handleInputChange}
                required
                style={{ width: "160px" }} // Adjust the width as needed
              />
            </div>
          </label>
          <label>
            Minimum Basket Price:
            <input type="number" name="minPurchase" value={formData.minPurchase} onChange={handleInputChange} required />
          </label>
          {formData.discountType === "percentage" && (
            <label>
              Maximum Price Discount:
              <input type="number" name="maxDiscount" value={formData.maxDiscount} onChange={handleInputChange} />
            </label>
          )}
          <label>
            Usage Quantity:
            <input type="number" name="usageLimit" value={formData.usageLimit} onChange={handleInputChange} required />
          </label>
          <div className="button-group">
            <button type="submit" className="voucher-confirm-button">Confirm</button>
            <button type="button" className="voucher-cancel-button" onClick={handleCancelEdit}>Cancel</button>
          </div>
        </form>
      )}
      <div className="voucher-list">
        <div className="voucher-list-header">
          <span className="voucher-code-column">Voucher Code</span>
          <span className="voucher-min-purchase-column">Min Purchase</span>
          <span className="voucher-discount-column">Discount Amount</span>
          <span className="voucher-max-discount-column">Max Discount</span>          
          <span className="voucher-usage-limit-column">Usage Quantity</span>
          <span className="voucher-usage-column">Usage</span>
          <span className="voucher-period-column">Claiming Period</span>
          <span className="voucher-actions-column">Actions</span>
        </div>
        {filteredVouchers.map((voucher) => {
          const status = getStatus(voucher.startDate, voucher.endDate);
          const usage = voucherUsage[voucher.voucherID] || 0;
          return (
            <div key={voucher.voucherID} className="voucher-item">
              <div className="voucher-code-container">
                <p className="voucher-code"><strong>{voucher.code}</strong></p>
                <p className="voucher-status" style={{ color: status.color, backgroundColor: status.backgroundColor, fontSize: "12px", fontStyle: "bold", padding: "2px 4px", borderRadius: "4px" }}>
                  {status.text}
                </p>
              </div>
              <p className="voucher-min-purchase">{voucher.minPurchase}</p>
              <p className="voucher-discount">
                {voucher.discountType === "percentage"
                  ? `${voucher.discountValue}%`
                  : `₱${voucher.discountValue}`}
              </p>
              <p className="voucher-max-discount">
                {voucher.discountType === "fixed" ? `₱${voucher.discountValue}` : `₱${voucher.maxDiscount}`}
              </p>
              <p className="voucher-usage-limit">{voucher.usageLimit}</p>
              <p className="voucher-usage">{usage}</p>
              <p className="voucher-period">
                {new Date(voucher.startDate).toLocaleDateString()} - {new Date(voucher.endDate).toLocaleDateString()}
              </p>
              <div className="voucher-actions">
                {status.text === "Upcoming" ? (
                  <>
                    <button className="edit-button" onClick={() => handleEdit(voucher)}>Edit</button>
                    <button className="delete-button" onClick={() => handleDelete(voucher)}>Delete</button>
                  </>
                ) : status.text === "Expired" ? (
                  <button className="delete-button" onClick={() => handleDelete(voucher)}>Delete</button>
                ) : (
                  <button className="end-button" onClick={() => handleEnd(voucher)}>End</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {isModalOpen && deleteVoucher && (
        <div className="prod-modal-overlay">
          <div className="prod-modal-content">
            <h2>Delete Voucher</h2>
            <p>Are you sure you want to delete the following voucher? Warning: You cannot undo this action!</p>
            <div className="prod-modal-product-info">
              <p>{deleteVoucher.code}</p>
              <p>{deleteVoucher.description}</p>
            </div>
            <div className="prod-modal-actions">
              <button className="prod-cancel-button3" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="prod-confirm-button3" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
      {isEndModalOpen && endVoucher && (
        <div className="prod-modal-overlay">
          <div className="prod-modal-content">
            <h2>End Voucher</h2>
            <p>Are you sure you want to end the following voucher? Warning: You cannot undo this action!</p>
            <div className="prod-modal-product-info">
              <p>{endVoucher.code}</p>
              <p>{endVoucher.description}</p>
            </div>
            <div className="prod-modal-actions">
              <button className="prod-cancel-button3" onClick={() => setIsEndModalOpen(false)}>Cancel</button>
              <button className="prod-confirm-button3" onClick={confirmEnd}>End</button>
            </div>
          </div>
        </div>
      )}
      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}
    </div>
  );
};

export default ManageVouchers;