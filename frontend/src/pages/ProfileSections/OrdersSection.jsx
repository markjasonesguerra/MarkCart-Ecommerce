import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/ProfileDashboard.css";
import StarRating from "../../components/StarRating.jsx";
import { noOrders } from "../../assets/index.js";

const OrdersSection = ({ orders, selectedCategory, user }) => {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({
    productID: null,
    productName: "",
    productImage: "",
    comment: "",
    productQuality: 0,
    performance: "",
    suitability: "",
    sellerService: 0,
    deliveryService: 0,
  });
  const [existingReview, setExistingReview] = useState(null);
  const [reviewedProducts, setReviewedProducts] = useState(new Set()); // Track reviewed products
  const API_BASE_URL =
    process.env.NODE_ENV === 'development'
        ? 'http://localhost:8800'
        : process.env.REACT_APP_API_BASE_URL;

  const handleOrderReceived = async (orderID) => {
    try {
      await axios.put(`${API_BASE_URL}/orders/mark-received/${orderID}`);
      alert("Order marked as received successfully.");
      // Optionally, refresh the orders list or update the state to reflect the change
    } catch (err) {
      alert("Failed to mark order as received. Please try again later.");
    }
  };

  const handleRateClick = async (item) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/reviews/${item.productID}/${user.id}`);
      if (res.data) {
        setReviewData((prev) => ({
          ...prev,
          productID: item.productID,
          productName: item.productName,
          productImage: item.productImage,
          ...res.data,
        }));
        setReviewedProducts((prev) => new Set([...prev, item.productID])); // Mark as reviewed
        setExistingReview(res.data); // Set existing review
      }
    } catch (err) {
      setReviewData({
        productID: item.productID,
        productName: item.productName,
        productImage: item.productImage,
        comment: "",
        productQuality: 0,
        performance: "",
        suitability: "",
        sellerService: 0,
        deliveryService: 0,
      });
      setExistingReview(null);
    }
    setShowReviewModal(true);
  };

  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setReviewData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStarRatingChange = (name, value) => {
    setReviewData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReviewSubmit = async () => {
    if (!user || !user.id) {
      alert("You need to be logged in to submit a review.");
      return;
    }

    if (
      reviewData.productQuality < 1 || reviewData.productQuality > 5 ||
      reviewData.sellerService < 1 || reviewData.sellerService > 5 ||
      reviewData.deliveryService < 1 || reviewData.deliveryService > 5
    ) {
      alert("Ratings must be between 1 and 5.");
      return;
    }

    if (!reviewData.performance || !reviewData.suitability || !reviewData.comment) {
      alert("All fields must be filled out.");
      return;
    }

    try {
      if (existingReview) {
        // Update existing review
        await axios.put(`${API_BASE_URL}/reviews/${existingReview.reviewID}`, {
          ...reviewData,
          userID: user.id,
        });
        alert("Review updated successfully.");
      } else {
        // Create new review
        const res = await axios.post(`${API_BASE_URL}/reviews`, {
          ...reviewData,
          userID: user.id,
        });
        setExistingReview(res.data); // Update existingReview with the newly created review
        setReviewedProducts((prev) => new Set([...prev, reviewData.productID])); // Mark as reviewed
        alert("Review submitted successfully.");
      }

      setShowReviewModal(false);
    } catch (err) {
      alert("Failed to submit review. Please try again later.");
    }
  };

  const filteredOrders = orders.filter((order) => {
    switch (selectedCategory) {
      case "toPay":
        return order.paymentStatus === "Pending" && order.status === "Pending" && order.paymentMethodID !== 1;
      case "toShip":
        return order.status === "Pending" && (order.paymentStatus === "Pending" || order.paymentStatus === "Completed");
      case "toReceive":
        return (order.paymentStatus === "Completed" && order.status === "Shipped") || (order.paymentMethodID === 1 && order.status === "Shipped");
      case "completed":
        return order.paymentStatus === "Completed" && order.status === "Delivered";
      case "cancelled":
        return order.status === "Cancelled";
      default:
        return true; // Show all orders
    }
  });

  return (
    <div className="orders-section">
      {filteredOrders.length === 0 ? (
        <div className="no-orders-container">
          <img src={noOrders} alt="No Orders" className="no-orders-image" />
          <p>No orders found in this category.</p>
        </div>
      ) : (
        <div className="orders-container">
          {filteredOrders.map((order) => (
            <div key={order.orderID} className="order-card">
              <div className="order-header">
                <div className="order-status">{order.status === "Delivered" ? "COMPLETED" : order.status}</div>
              </div>
              <div className="order-details1">
                <ul className="items">
                  {order.orderItems.map((item, index) => (
                    <li key={index} className="item">
                      <img
                        src={`${API_BASE_URL}/${item.productImage}`} // Ensure the correct path
                        alt={item.productName}
                        className="product-image"
                      />
                      <div className="item-details1">
                        <p className="product-name1">{item.productName}</p>
                        <p className="quantity1">Quantity: {item.quantity}</p>
                        <p className="item-price1"> ₱{Number(item.price).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        {selectedCategory === "completed" && (
                          <button className="rate-button1" onClick={() => handleRateClick(item)}>
                            {reviewedProducts.has(item.productID) || (existingReview && existingReview.productID === item.productID)
                              ? "View Item Rating"
                              : "Rate"}
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="order-total">
                <p className="order-total-text">Order Total:</p>
                <p className="order-total-price">₱{Number(order.totalAmount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              {selectedCategory === "toReceive" && (
                <button className="order-received-button" onClick={() => handleOrderReceived(order.orderID)}>Order Received</button>
              )}
            </div>
          ))}
        </div>
      )}

      {showReviewModal && (
        <div className="review-modal">
          <div className="review-modal-content">
            <h2>Rate Product</h2>
            <div className="review-item">
              <span className="review-item">
                <img
                  src={`${API_BASE_URL}/${reviewData.productImage}`} // Ensure the correct path
                  alt={reviewData.productName}
                  className="product-image"
                />
                <p className="product-name">{reviewData.productName}</p>
              </span>
            </div>
            <label>
              Product Quality:
              <StarRating
                rating={reviewData.productQuality}
                onRatingChange={(value) => handleStarRatingChange("productQuality", value)}
              />
            </label>
            <label>
              Performance:
              <textarea name="performance" value={reviewData.performance} onChange={handleReviewChange}></textarea>
            </label>
            <label>
              Suitability:
              <textarea name="suitability" value={reviewData.suitability} onChange={handleReviewChange}></textarea>
            </label>
            <label>
              Seller Service:
              <StarRating
                rating={reviewData.sellerService}
                onRatingChange={(value) => handleStarRatingChange("sellerService", value)}
              />
            </label>
            <label>
              Delivery Service:
              <StarRating
                rating={reviewData.deliveryService}
                onRatingChange={(value) => handleStarRatingChange("deliveryService", value)}
              />
            </label>
            <label>
              Comment:
              <textarea name="comment" value={reviewData.comment} onChange={handleReviewChange}></textarea>
            </label>
            <div className="button-container">
              <button className="cancl-button" onClick={() => setShowReviewModal(false)}>Cancel</button>
              <button className="submit-button" onClick={handleReviewSubmit}>Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersSection;