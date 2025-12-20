import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../../styles/adminStyles/ManageOrders.css";
import CustomDropdown from "../../components/CustomDropdown.jsx";
import {
  cancellation,
  completed,
  delivered,
  pending,
  pendingPayment,
  shipped,
  unpaid,
  successgif,

} from "../../assets";

const API_BASE_URL =
    (process.env.NODE_ENV === 'development'
        ? 'http://localhost:8800'
        : process.env.REACT_APP_API_BASE_URL
    ).replace(/\/$/, '');

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [editingOrder, setEditingOrder] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatedOrder, setUpdatedOrder] = useState({
    status: "",
    paymentStatus: "",
  });
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false); // State for success modal
  const editSectionRef = useRef(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/orders`);
        setOrders(res.data);
      } catch (err) {
        console.error("Error fetching orders:", err);
        alert("Failed to fetch orders. Please try again later.");
      }
    };

    fetchOrders();
  }, []);

  useEffect(() => {
    if (editingOrder) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [editingOrder]);

  const handleEditClick = (order) => {
    setEditingOrder(order);
    setUpdatedOrder({
      status: order.status,
      paymentStatus: order.paymentStatus,
    });
  };

  const handleDetailsClick = (order) => {
    setSelectedOrder(order);
  };

  const handleUpdateChange = (e) => {
    const { name, value } = e.target;
    setUpdatedOrder((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateClick = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_BASE_URL}/orders/update-status/${editingOrder.orderID}`, updatedOrder);
      setOrders(orders.map((order) =>
        order.orderID === editingOrder.orderID
          ? { ...order, ...updatedOrder }
          : order
      ));
      setEditingOrder(null);
      setShowSuccessModal(true); // Show success modal
    } catch (err) {
      console.error("Error updating order:", err);
      alert("Failed to update order. Please try again later.");
    }
  };

  const handleCancelClick = () => {
    setEditingOrder(null);
  };

  const handleCloseModal = () => {
    setSelectedOrder(null);
    setShowSuccessModal(false); // Close success modal
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredOrders = orders.filter((order) => {
    if (filter === "All") return true;
    return order.status === filter;
  }).filter((order) =>
    order.products.some(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || order.orderID.toString().includes(searchQuery)
  );

  const toPayCount = orders.filter(order => order.paymentStatus === "Pending").length;
  const toShipCount = orders.filter(order => order.status === "Shipped").length;
  const toReceiveCount = orders.filter(order => order.status === "Shipped").length;
  const completedCount = orders.filter(order => order.status === "Delivered").length;
  const cancelledCount = orders.filter(order => order.status === "Cancelled").length;

  const statusOptions = [
    { value: "Pending", label: "Pending", icon: pending },
    { value: "Shipped", label: "Shipped", icon: shipped },
    { value: "Delivered", label: "Delivered", icon: delivered },
    { value: "Cancelled", label: "Cancelled", icon: cancellation },
  ];

  const paymentStatusOptions = [
    { value: "Pending", label: "Pending Payment", icon: pendingPayment },
    { value: "Completed", label: "Completed", icon: completed },
    { value: "Failed", label: "Failed Payment", icon: unpaid },
  ];

  const formatCurrency = (value) =>
    `₱${Number(value).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const getStatusTone = (status) => {
    switch (status) {
      case "Delivered":
      case "Completed":
        return "status-delivered";
      case "Shipped":
        return "status-shipped";
      case "Pending":
        return "status-pending";
      case "Cancelled":
        return "status-cancelled";
      default:
        return "status-neutral";
    }
  };

  const getPaymentTone = (paymentStatus) => {
    switch (paymentStatus) {
      case "Completed":
        return "status-delivered";
      case "Pending":
        return "status-pending";
      case "Failed":
        return "status-cancelled";
      default:
        return "status-neutral";
    }
  };

  return (
    <div className="orders-container">
      <div className="header-dashboard">
        <h2>Order Dashboard</h2>
        <div className="dashboard-container">
          <div className="dashboard-actions">
            <div className="dashboard-item">
              <span className="dashboard-number">{toPayCount}</span>
              <span>To Pay</span>
            </div>
            <div className="dashboard-item">
              <span className="dashboard-number">{toShipCount}</span>
              <span>To Ship</span>
            </div>
            <div className="dashboard-item">
              <span className="dashboard-number">{toReceiveCount}</span>
              <span>To Receive</span>
            </div>
            <div className="dashboard-item">
              <span className="dashboard-number">{completedCount}</span>
              <span>Completed</span>
            </div>
            <div className="dashboard-item">
              <span className="dashboard-number">{cancelledCount}</span>
              <span>Cancelled</span>
            </div>
          </div>
        </div>
      </div>
      <div className="orders-header">
        <h2>Manage Orders</h2>
        <div className="orders-header-actions">
          <input
            type="text"
            placeholder="Search by product name or ID"
            value={searchQuery}
            onChange={handleSearch}
            className="orders-search-bar"
          />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="orders-filter-select">
            <option value="All">All</option>
            <option value="Pending">Unpaid</option>
            <option value="Shipped">To ship</option>
            <option value="Delivered">Completed</option>
            <option value="Cancelled">Cancellation</option>
          </select>
        </div>
      </div>
      {editingOrder && (
      <div className="orders-edit-container" ref={editSectionRef}>
        <div className="orders-edit-form">
          <h2>Edit Order</h2>
          <label htmlFor="status">Status</label>
          <CustomDropdown
            name="status"
            value={updatedOrder.status}
            onChange={handleUpdateChange}
            options={statusOptions}
          />
          <label htmlFor="paymentStatus">Payment Status</label>
          <CustomDropdown
            name="paymentStatus"
            value={updatedOrder.paymentStatus}
            onChange={handleUpdateChange}
            options={paymentStatusOptions}
          />
          <div className="orders-edit-buttons">
            <button onClick={handleUpdateClick} className="orders-update-button">Update Order</button>
            <button onClick={handleCancelClick} className="orders-cancel-button">Cancel</button>
          </div>
        </div>
        <div className="order-details-form">
          <h2>Order Details</h2>
          <div className="order-details">
            <div className="order-details-labels">
              <p><strong>Order ID:</strong></p>
              <p><strong>Customer Name:</strong></p>
              <p><strong>Total Price:</strong></p>
              <p><strong>Payment Method:</strong></p>
              <p><strong>Shipping Channel:</strong></p>
              <p><strong>Status:</strong></p>
              <p><strong>Payment Status:</strong></p>
            </div>
            <div className="order-details-values">
              <p>{editingOrder.orderID}</p>
              <p>{editingOrder.customerName}</p>
              <p>₱{Number(editingOrder.total).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p>{editingOrder.paymentMethod}</p>
              <p>{editingOrder.shippingChannel}</p>
              <p style={{ color: editingOrder.status === 'Pending' ? '#F29339' : editingOrder.status === 'Shipped' ? '#0055AA' : editingOrder.status === 'Delivered' || editingOrder.status === 'Cancelled' || editingOrder.status === 'Completed' ? 'green' : 'inherit' }}>
                {editingOrder.status}
              </p>
              <p style={{ color: editingOrder.paymentStatus === 'Pending' ? '#F29339' : editingOrder.paymentStatus === 'Completed' ? 'green' : editingOrder.paymentStatus === 'Failed' ? 'red' : 'inherit' }}>
                {editingOrder.paymentStatus}
              </p>
            </div>
          </div>
        </div>
      </div>
    )}
      <div className="orders-list">
        <div className="orders-list-header">
          <span className="orders-product-column">Product(s)</span>
          <span className="orders-total-column">Order Total</span>
          <span className="orders-status-column">Status</span>
          <span className="orders-shipping-column">Shipping Channel</span>
          <span className="orders-action-column">Action</span>
        </div>
        {filteredOrders.map((order) => (
          <div key={order.orderID} className="orders-item">
            <div className="orders-product-info">
              {order.products && order.products.map((product) => (
                <div key={product.productID} className="orders-product-item">
                  <img src={`${API_BASE_URL}/${product.image}`} alt={product.name} className="orders-product-image" />
                  <div>
                    <h3>{product.name}</h3>
                    <p>Order ID: {order.orderID}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="orders-total">
              <p>₱{Number(order.total).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p>{order.paymentMethod}</p>
            </div>
            <div className="orders-status">
              <p style={{ 
                color: order.status === 'Delivered' ? 'green' : 
                      order.status === 'Cancelled' ? 'red' : 
                      order.status === 'Pending' ? '#F29339' : 
                      order.status === 'Shipped' ? '#0055AA' : 
                      'inherit' 
              }}>
                {order.status}
              </p>
            </div>
            <div className="orders-shipping">
              <p>{order.shippingChannel}</p>
            </div>
            <div className="orders-actions">
              <button onClick={() => handleEditClick(order)} className="orders-edit-button">Edit</button>
              <button onClick={() => handleDetailsClick(order)} className="orders-details-button">Details</button>
            </div>
          </div>
        ))}
      </div>
      {selectedOrder && (
        <div className="modal">
          <div className="modal-card" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div className="modal-title-group">
                <p className="modal-eyebrow">Order</p>
                <h3 className="modal-title">#{selectedOrder.orderID}</h3>
              </div>
              <div className="modal-badges">
                <span className={`detail-chip ${getStatusTone(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
                <span className={`detail-chip ${getPaymentTone(selectedOrder.paymentStatus)}`}>
                  {selectedOrder.paymentStatus}
                </span>
              </div>
            </div>

            <div className="modal-body">
              <div className="modal-grid">
                <div className="modal-field">
                  <span className="field-label">Customer</span>
                  <span className="field-value">{selectedOrder.customerName}</span>
                </div>
                <div className="modal-field">
                  <span className="field-label">Total Price</span>
                  <span className="field-value">{formatCurrency(selectedOrder.total)}</span>
                </div>
                <div className="modal-field">
                  <span className="field-label">Payment Method</span>
                  <span className="field-value">{selectedOrder.paymentMethod}</span>
                </div>
                <div className="modal-field">
                  <span className="field-label">Shipping Channel</span>
                  <span className="field-value">{selectedOrder.shippingChannel}</span>
                </div>
                <div className="modal-field">
                  <span className="field-label">Order Date</span>
                  <span className="field-value">{selectedOrder.orderDate || "—"}</span>
                </div>
                <div className="modal-field">
                  <span className="field-label">Payment Status</span>
                  <span className={`detail-chip ${getPaymentTone(selectedOrder.paymentStatus)}`}>
                    {selectedOrder.paymentStatus}
                  </span>
                </div>
                <div className="modal-field">
                  <span className="field-label">Order Status</span>
                  <span className={`detail-chip ${getStatusTone(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
              </div>
            </div>

            {selectedOrder.products && selectedOrder.products.length > 0 && (
              <div className="modal-products">
                <div className="modal-products-header">
                  <h4>Products</h4>
                  <span>{selectedOrder.products.length} item(s)</span>
                </div>
                <div className="modal-products-grid">
                  {selectedOrder.products.map((product) => (
                    <div key={product.productID || product.name} className="modal-product-card">
                      <div className="modal-product-thumb">
                        <img src={`${API_BASE_URL}/${product.image}`} alt={product.name} />
                      </div>
                      <div className="modal-product-meta">
                        <p className="modal-product-name">{product.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button onClick={handleCloseModal} className="modal-close-button">Close</button>
            </div>
          </div>
        </div>
      )}
      {showSuccessModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Success</h2>
            <img src={successgif} alt="Success" className="success-gif" /> {/* Add the success GIF */}
            <p>Order updated successfully!</p>
            <button onClick={handleCloseModal} className="modal-close-button">OK</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageOrders;