import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate, Link } from "react-router-dom";
import "../styles/Checkout.css"; 
import Footer from "../components/Footer.jsx"; 
import {
  logo,
  profileIcon,
  mapPin,
  intransit,
  voucherIcon,
  errorIcon,
  cancelIcon,

} from "../assets"; 

const Checkout = ({ user, setUser }) => {
  const API_BASE_URL =
      (process.env.NODE_ENV === 'development'
          ? 'http://localhost:8800'
          : process.env.REACT_APP_API_BASE_URL
      ).replace(/\/$/, '');
  const location = useLocation();
  const { state } = location;
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedItems, setSelectedItems] = useState(state?.selectedItems || []);  
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [shippingOption, setShippingOption] = useState("Standard");
  const [voucher, setVoucher] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
  const [showAddressModal, setShowAddressModal] = useState(false); // State for modal visibility
  const [tempSelectedAddress, setTempSelectedAddress] = useState(null); // State for temporary selected address
  const [showShippingModal, setShowShippingModal] = useState(false); // State for shipping modal visibility
  const [tempSelectedShippingOption, setTempSelectedShippingOption] = useState(shippingOption);
  const [showVoucherModal, setShowVoucherModal] = useState(false); // State for voucher modal visibility
  const [voucherError, setVoucherError] = useState(""); // State for voucher error message
  const [voucherCode, setVoucherCode] = React.useState("");
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(paymentMethod);

  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Fetch addresses and set primary
    const fetchAddresses = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/profile/addresses/${user.id}`);
        setAddresses(res.data);
        const primaryAddress = res.data.find((addr) => addr.isPrimary);
        setSelectedAddress(primaryAddress || res.data[0]);
      } catch (err) {
        console.error("Error fetching addresses:", err);
      }
    };

    fetchAddresses();
  }, [user, navigate]);

  const calculateMerchandiseTotal = () =>
    selectedItems.reduce((total, item) => total + Number(item.price) * item.quantity, 0);
  
  const calculateDiscount = () => {
    if (!voucher) return 0;
    if (voucher.discountType === "percentage") {
      const discount = (calculateMerchandiseTotal() * voucher.discountValue) / 100;
      return voucher.maxDiscount ? Math.min(discount, voucher.maxDiscount) : discount;
    }
    return voucher.discountValue;
  };
  
  const shippingCost = shippingOption === "Standard" ? 36 : 50; // Adjust shipping cost based on option
  const voucherDiscount = Number(calculateDiscount()); // Ensure voucherDiscount is a number
  const totalPayment = calculateMerchandiseTotal() + shippingCost - voucherDiscount;

  const handlePlaceOrder = async () => {
    const paymentMethodID = getPaymentMethodID(paymentMethod); // Function to get paymentMethodID based on paymentMethod name
  
    const orderData = {
      userID: user.id,
      items: selectedItems.map((item) => ({
        productID: item.productID, 
        quantity: item.quantity,
        price: Number(item.price).toFixed(2),
      })),
      totalAmount: totalPayment,
      shippingAddress: selectedAddress,
      shippingOption,
      paymentMethodID,
      discountAmount: voucherDiscount, // Include discount amount
      voucherID: voucher ? voucher.voucherID : null, // Include voucher ID if available
    };
  
    console.log("Order data being sent:", orderData); // Debugging line
  
    try {
      const res = await axios.post(`${API_BASE_URL}/orders`, orderData);
      console.log("Order placed successfully:", res.data);
  
      // Increment voucher usage count if a voucher was used
      if (voucher) {
        await axios.post(`${API_BASE_URL}/vouchers/increment-usage`, {
          userID: user.id,
          voucherID: voucher.voucherID,
        });
      }
  
      // Redirect to the "to pay" section in ProfileDashboard
      navigate("/profile?section=purchase&category=toPay");
    } catch (err) {
      console.error("Error placing order:", err);
      alert("Failed to place order. Please try again.");
    }
  };

  const getPaymentMethodID = (methodName) => {
    const paymentMethods = {
      "Cash on Delivery": 1,
      "MarkCartPay": 2,
      "Payment Center / E-Wallet": 3,
      "Linked Bank Account": 4,
      "Credit / Debit Card": 5,
      "Online Banking": 6,
      "Google Pay": 7,
    };
    return paymentMethods[methodName];
  };

  const handleAddressChange = () => {
    setTempSelectedAddress(selectedAddress);
    setShowAddressModal(true);
  };

  const handleConfirmAddress = () => {
    setSelectedAddress(tempSelectedAddress);
    setShowAddressModal(false);
  };

  const handleCancelAddress = () => {
    setTempSelectedAddress(null);
    setShowAddressModal(false);
  };

  const handleShippingChange = () => {
    setTempSelectedShippingOption(shippingOption);
    setShowShippingModal(true);
  };
  
  const handleConfirmShipping = () => {
    setShippingOption(tempSelectedShippingOption);
    setShowShippingModal(false);
  };

  const handleCancelShipping = () => {
    setTempSelectedShippingOption(shippingOption);
    setShowShippingModal(false);
  };
  
  const handleVoucherChange = () => {
    setShowVoucherModal(true);
  };

  const handleConfirmVoucher = () => {
    if (voucher && calculateMerchandiseTotal() < voucher.minPurchase) {
      setVoucherError(`Minimum spend of ₱${voucher.minPurchase} is required to use this voucher.`);
      return;
    }
    setShowVoucherModal(false);
  };

  const handleCancelVoucher = () => {
    setShowVoucherModal(false);
  };

  const getDeliveryDate = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  };

  const handleApplyVoucher = async () => {
    const trimmedVoucherCode = voucherCode.trim(); // Trim spaces
  
    // Check for empty input
    if (!trimmedVoucherCode) {
      setVoucherError("Please enter a voucher code.");
      return;
    }
  
    try {
      const res = await axios.post(`${API_BASE_URL}/vouchers/validate`, {
        code: trimmedVoucherCode,
        userID: user.id,
        merchandiseTotal: calculateMerchandiseTotal(), // Pass the merchandise total
      });
      setVoucherError(""); // Clear any previous error
  
      // Add the validated voucher to the list of available vouchers
      setAvailableVouchers((prevVouchers) => {
        // Check if the voucher is already in the list
        const voucherExists = prevVouchers.some(voucher => voucher.voucherID === res.data.voucherID);
        if (!voucherExists) {
          return [...prevVouchers, res.data];
        }
        return prevVouchers;
      });
  
      setVoucherCode(""); // Clear the input field
    } catch (err) {
      console.error("Error applying voucher:", err);
  
      if (err.response?.status === 404) {
        // Specific error for non-existing voucher
        setVoucherError(
          "This voucher code cannot be found. It may have been entered wrongly, in the wrong input bar, or is no longer in use."
        );
      } else if (err.response?.status === 400) {
        // Specific error for minimum purchase requirement
        setVoucherError(err.response.data.message);
      } else {
        // General fallback error
        setVoucherError("An unexpected error occurred. Please try again later.");
      }
  
      setVoucher(null); // Reset voucher state
    }
  };

  const fetchUserVouchers = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/vouchers/user/${user.id}`);
      setAvailableVouchers(res.data);
    } catch (err) {
      console.error("Error fetching user's vouchers:", err);
    }
  };
  
  useEffect(() => {
    fetchUserVouchers();
  }, [user]);

  const handleCancelPaymentMethod = () => {
    setShowPaymentMethodModal(false);
  };

  const handleConfirmPaymentMethod = (method) => {
    setSelectedPaymentMethod(method);
    setPaymentMethod(method);
    setShowPaymentMethodModal(false);
  };
  
  

  const handleRemoveVoucher = () => {
    setVoucherCode("");
    setVoucherError("");
    setVoucher(null);
  };

  return (
    <div className="checkout-page">
      {/* Top Navbar */}
      <div className="top-navbar">
          <div className="top-left">
              <a href="/download">Download</a> |{" "}
              <a href="https://www.facebook.com/profile.php?id=61576260396808" target="_blank" rel="noopener noreferrer">
                  Follow us on Instagram
              </a>|{" "} 
              <Link to="/build" target="_blank" rel="noopener noreferrer">Build A PC</Link>
          </div>
          <div className="top-right">
              <a href="/notifications">Notifications</a> |{" "}
              <a href="/help">Help</a> |{" "}
              <a href="/language">English</a>
          </div>
      </div>
      {/* Header */}
      <nav className="navbar">
          <img src={logo} alt="Mark Cart" className="logo" onClick={() => navigate("/")} />
          <div className="navbar-actions">
              {!user ? (
                  <button onClick={() => navigate("/login")}>Login</button>
              ) : (
                  <div className="profile-menu">
                      <button onClick={() => setShowProfileMenu(!showProfileMenu)}>
                      <img
                        src={
                          user && user.profilePicture && user.profilePicture.data
                            ? `data:${user.profilePicture.contentType};base64,${user.profilePicture.data}`
                            : profileIcon
                        }
                        alt="Profile"
                        className="profile-icon"
                      />
                          <span className="username" title={user.name}>{user.name}</span>
                      </button>
                      {showProfileMenu && (
                          <ul className="profile-dropdown">
                              <li onClick={() => navigate("/profile?section=account&category=profile")}>
                                  My Account
                              </li>
                              <li onClick={() => navigate("/profile?section=purchase&category=all")}>
                                  My Orders
                              </li>
                              <li
                                  onClick={() => {
                                      localStorage.removeItem("user");
                                      setUser(null);
                                      navigate("/login");
                                  }}
                              >
                                  Logout
                              </li>
                          </ul>
                      )}
                  </div>
              )}
          </div>
      </nav>

      <div className="checkout-container">
        {/* Delivery Address */}
        <div className="checkout-section delivery-address">
        <h2><img src={mapPin} alt="Location Icon" className="location-icon" /> Delivery Address</h2>
        <div className="address-card">
            <p><strong>{user.name} (+63) {user.phoneNumber}</strong></p>
            <p>
              {selectedAddress
                ? `${selectedAddress.addressLine1}, ${selectedAddress.city}, ${selectedAddress.state} ${selectedAddress.postalCode}`
                : "No address selected"}
            </p>
            <button onClick={handleAddressChange}>
              Change
            </button>
          </div>
        </div>

        {/* Address Selection Modal */}
        {showAddressModal && (
          <div className="address-modal">
            <div className="address-modal-content">
              <h2>Select Address</h2>
              {addresses.map((address) => (
                <div
                  key={address.addressID}
                  className={`address-item ${tempSelectedAddress?.addressID === address.addressID ? "selected" : ""}`}
                  onClick={() => setTempSelectedAddress(address)}
                >
                  <p>{address.addressLine1}, {address.city}, {address.state} {address.postalCode}</p>
                </div>
              ))}
              <div className="modal-actions">
                <button onClick={handleConfirmAddress}>Confirm</button>
                <button onClick={handleCancelAddress}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Products Ordered */}
        <div className="checkout-section products-ordered">
          <div className="table-header">
            <h2>Products Ordered</h2>
            <span className="unit-price-column">Unit Price</span>
            <span className="quantity-column">Quantity</span>
            <span className="subtotal-column">Item Subtotal</span>
          </div>
            {selectedItems.map((item) => {
              let images = [];
              if (item.images) {
                if (typeof item.images === 'string') {
                  try {
                    images = JSON.parse(item.images.replace(/\\/g, "/"));
                  } catch (err) {
                    console.error("Error parsing images:", err);
                  }
                } else if (Array.isArray(item.images)) {
                  images = item.images;
                } else {
                  console.error("Unexpected images format:", item.images);
                }
              }
              const imageUrl = images.length > 0 ? `${API_BASE_URL}/${images[0]}` : 'default-image-path.jpg'; // Get the first image URL, or fallback to the default image

              return (
                <div key={item.cartItemID} className="table-row">
                  <div className="product-details">
                    <img src={imageUrl} alt={item.title} />
                    <span>{item.title}</span>
                  </div>
                  <span>₱{Number(item.price).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <span>{item.quantity}</span>
                  <span className="item-subTotal"><strong>₱{(Number(item.price) * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                </div>
              );
            })}
          </div>

        {/* Shipping and Voucher Options */}
        <div className="checkout-section options-section no-padding">
          {/* Voucher Section */}
          <div className="voucher-section">
            <div className="voucher-header">
              <h2 className="section-header"><img src={voucherIcon} alt="Voucher Icon" className="voucher-icon" /> Tekko Voucher</h2>
              <button onClick={handleVoucherChange} className="change-button">Select Voucher</button>
            </div>
            {voucher && (
              <div className="selected-voucher">
                <p><strong>{voucher.code}</strong> - {voucher.description}</p>
                <button className="remove-button" onClick={() => setVoucher(null)}>Remove</button>
              </div>
            )}
          </div>

          {/* Shipping Option */}
          <div className="shipping-option">
            <div className="shipping-option-header">
              <h2 className="section-header">Shipping Option</h2>
              <button onClick={handleShippingChange} className="change-button">Change</button>
            </div>
            <div className="shipping-details">
              <p>
                {shippingOption} Local 
                <img src={intransit} alt="In Transit" className="intransit-icon" />
                <span className="delivery-date">
                  Guaranteed to get by {shippingOption === "Standard" ? `${getDeliveryDate(3)} - ${getDeliveryDate(5)}` : `${getDeliveryDate(1)} - ${getDeliveryDate(2)}`}
                </span>
              </p>
              <span className="price">₱{shippingCost}</span>
            </div>
          </div>
        </div>

        {/* Shipping Option Modal */}
        {showShippingModal && (
          <div className="shipping-modal">
            <div className="shipping-modal-content">
              <h2>Select Shipping Option</h2>
              <div className={`shipping-option-item ${tempSelectedShippingOption === "Standard" ? "selected" : ""}`} onClick={() => setTempSelectedShippingOption("Standard")}>
                <p>
                  Standard Local 
                  <img src={intransit} alt="In Transit" className="intransit-icon" />
                  <span className="delivery-date">
                    Guaranteed to get by {getDeliveryDate(3)} - {getDeliveryDate(5)}
                  </span>
                  <span className="price">₱36</span>
                </p>
              </div>
              <div className={`shipping-option-item ${tempSelectedShippingOption === "Expedited" ? "selected" : ""}`} onClick={() => setTempSelectedShippingOption("Expedited")}>
                <p>
                  Expedited Local 
                  <img src={intransit} alt="In Transit" className="intransit-icon" />
                  <span className="delivery-date">
                    Guaranteed to get by {getDeliveryDate(1)} - {getDeliveryDate(2)}
                  </span>
                  <span className="price">₱50</span>
                </p>
              </div>
              <div className="shipping-modal-actions">
                <button onClick={handleConfirmShipping}>Confirm</button>
                <button onClick={handleCancelShipping}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Voucher Modal */}
        {showVoucherModal && (
          <div className="voucher-modal">
            <div className="voucher-modal-content">
              <h2>Select Tekko Voucher</h2>

              {/* Add Voucher Section */}
              <div className="add-voucher-section">
                <div className="voucher-input-container">
                  <input
                    type="text"
                    placeholder="Tekko voucher code"
                    className="voucher-input"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                  />
                  {voucherCode && (
                    <button className="cancel-button" onClick={handleRemoveVoucher}>
                      <img src={cancelIcon} alt="Cancel Icon" className="cancel-icon" />
                    </button>
                  )}
                </div>
                <button className="apply-button" onClick={handleApplyVoucher}>
                  APPLY
                </button>
              </div>

              {/* Error Message */}
              {voucherError && (
                <div className="voucher-error">
                  <img src={errorIcon} alt="Error Icon" className="error-icon" />
                  <span>{voucherError}</span>
                </div>
              )}

              {/* Voucher List */}
              <div className="voucher-list1">
                {availableVouchers.map((voucherItem) => {
                  const isDisabled = calculateMerchandiseTotal() < voucherItem.minPurchase;
                  return (
                    <div key={voucherItem.voucherID} className={`voucher-item1 ${isDisabled ? "disabled" : ""}`}>
                      <div className="voucher-details1">
                        <input
                          type="radio"
                          name="voucher"
                          value={voucherItem.code}
                          checked={voucher && voucher.code === voucherItem.code}
                          disabled={isDisabled}
                          onChange={() => setVoucher(voucherItem)}
                        />
                        <span className="voucher-title1">{voucherItem.code}</span>
                        <p className="voucher-description1">{voucherItem.description}</p>
                        <p className="voucher-expiry1">Expires on {new Date(voucherItem.endDate).toLocaleDateString()}</p>
                      </div>
                      {isDisabled && (
                        <div className="voucher-status">
                          <span className="voucher-warning">
                            Minimum spend of ₱{voucherItem.minPurchase} required
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Modal Actions */}
              <div className="voucher-modal-actions">
                <button onClick={handleConfirmVoucher}>OK</button>
                <button onClick={handleCancelVoucher}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Method */}
        <div className="checkout-section payment-method">
          <div className="payment-method-header">
            <h2 className="section-header">Payment Method</h2>
            <button onClick={() => setShowPaymentMethodModal(true)} className="change-button">Change</button>
          </div>
          <p>{paymentMethod}</p>
        </div>

        {showPaymentMethodModal && (
          <div className="payment-method-modal">
            <div className="payment-method-modal-content">
              <h2>Select Payment Method</h2>
              <div className="payment-method-options">
                <div
                  className={`payment-method-item ${selectedPaymentMethod === "MarkCartPay" ? "selected" : ""} disabled`}
                  onClick={() => !document.querySelector('.payment-method-item.disabled') && handleConfirmPaymentMethod("ShopeePay")}
                >
                  <p>TekkoPay</p>
                </div>

                <div
                  className={`payment-method-item ${selectedPaymentMethod === "Cash on Delivery" ? "selected" : ""}`}
                  onClick={() => handleConfirmPaymentMethod("Cash on Delivery")}
                >
                  <p>Cash on Delivery</p>
                </div>
                <div
                  className={`payment-method-item ${selectedPaymentMethod === "Payment Center / E-Wallet" ? "selected" : ""} disabled`}
                  onClick={() => !document.querySelector('.payment-method-item.disabled') && handleConfirmPaymentMethod("Payment Center / E-Wallet")}
                >
                  <p>Payment Center / E-Wallet</p>
                </div>
                <div
                  className={`payment-method-item ${selectedPaymentMethod === "Linked Bank Account" ? "selected" : ""} disabled`}
                  onClick={() => !document.querySelector('.payment-method-item.disabled') && handleConfirmPaymentMethod("Linked Bank Account")}
                >
                  <p>Linked Bank Account</p>
                </div>
                <div
                  className={`payment-method-item ${selectedPaymentMethod === "Credit / Debit Card" ? "selected" : ""} disabled`}
                  onClick={() => !document.querySelector('.payment-method-item.disabled') && handleConfirmPaymentMethod("Credit / Debit Card")}
                >
                  <p>Credit / Debit Card</p>
                </div>
                <div
                  className={`payment-method-item ${selectedPaymentMethod === "Online Banking" ? "selected" : ""} disabled`}
                  onClick={() => !document.querySelector('.payment-method-item.disabled') && handleConfirmPaymentMethod("Online Banking")}
                >
                  <p>Online Banking</p>
                </div>
                <div
                  className={`payment-method-item ${selectedPaymentMethod === "Google Pay" ? "selected" : ""} disabled`}
                  onClick={() => !document.querySelector('.payment-method-item.disabled') && handleConfirmPaymentMethod("Google Pay")}
                >
                  <p>Google Pay</p>
                </div>
              </div>
              <div className="payment-method-modal-actions">
                <button onClick={handleCancelPaymentMethod}>Cancel</button>
              </div>
            </div>
          </div>
        )}
        
        {/* Order Summary */}
        <div className="checkout-section order-summary">
          <div className="order-summary-item">
            <p>Merchandise Subtotal:</p>
            <span>₱{calculateMerchandiseTotal().toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="order-summary-item">
            <p>Shipping Subtotal:</p>
            <span>₱{shippingCost.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="order-summary-item">
            <p>Voucher Discount:</p>
            <span>-₱{voucherDiscount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="order-summary-item total-payment">
            <p>Total Payment:</p>
            <span className="price-total-payment">₱{totalPayment.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
        <div className="place-order-container1">
          <button onClick={handlePlaceOrder} className="place-order-button">
            Place Order
          </button>
        </div>
      </div>
      <Footer /> {/* Include Footer */}
    </div>
  );
};

export default Checkout;