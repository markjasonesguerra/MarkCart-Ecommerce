import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Cart.css";
import {
    logo,
    profileIcon,
    shoppingCartIcon,
    emptycart,
} from "../assets"; 
import Footer from "../components/Footer.jsx";

const Cart = ({ user, setUser }) => {
    const API_BASE_URL =
        (process.env.NODE_ENV === 'development'
            ? 'http://localhost:8800'
            : process.env.REACT_APP_API_BASE_URL
        ).replace(/\/$/, '');
    const [cartItems, setCartItems] = useState([]);
    const [discountCode, setDiscountCode] = useState("");
    const [discount, setDiscount] = useState(0);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [categoryID, setCategoryID] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();

    // Fetch user data and cart items
    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }

        const fetchUserData = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/users/${user.id}`);
                setUser((prevUser) => ({
                    ...prevUser,
                    ...res.data,
                }));
            } catch (err) {
                console.error("Failed to fetch user data:", err);
            }
        };
        const fetchCartItems = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/cart/${user.id}`);
                const items = res.data.map((item) => {
                    let images = [];
                    if (item.images) {
                        if (typeof item.images === "string") {
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
                    return { ...item, images };
                });
                setCartItems(items);
            } catch (err) {
                console.error("Error fetching cart items:", err);
            }
        };

        fetchUserData();
        fetchCartItems();
    }, [user, setUser, navigate]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/categories`);
                setCategories(res.data);
            } catch (err) {
                console.error("Failed to load categories:", err);
            }
        };
        fetchCategories();
    }, []);

    const handleSearchAndFilter = async () => {
        try {
            navigate(`/products?search=${encodeURIComponent(searchQuery)}&category=${categoryID}`);
        } catch (err) {
            console.error("Error searching products:", err);
        }
    };

    const handleUpdateQuantity = async (cartItemID, newQuantity) => {
        if (newQuantity < 1) return;
        try {
            await axios.put(`${API_BASE_URL}/cart/${cartItemID}`, {
                quantity: newQuantity,
            });
            setCartItems((prevItems) =>
                prevItems.map((item) =>
                    item.cartItemID === cartItemID
                        ? { ...item, quantity: newQuantity }
                        : item
                )
            );
        } catch (err) {
            console.error("Failed to update quantity:", err);
        }
    };

    const handleRemoveItem = async (cartItemID) => {
        try {
            await axios.delete(`${API_BASE_URL}/cart/${cartItemID}`);
            setCartItems((prevItems) => prevItems.filter((item) => item.cartItemID !== cartItemID));
        } catch (err) {
            console.error("Failed to remove item:", err);
        }
    };

    const handleClearCart = async () => {
        try {
            await axios.delete(`${API_BASE_URL}/cart/clear/${user.id}`);
            setCartItems([]);
        } catch (err) {
            console.error("Failed to clear cart:", err);
        }
    };

    const handleSelectAll = () => {
        if (selectedItems.length === cartItems.length) {
            setSelectedItems([]); // Deselect all
        } else {
            setSelectedItems(cartItems.map((item) => item.cartItemID)); // Select all
        }
    };

    const handleApplyDiscount = () => {
        if (discountCode === "DISCOUNT10") {
            setDiscount(10); // Set the discount to 10%
        } else {
            alert("Invalid discount code.");
            setDiscount(0); // Reset discount if invalid code
        }
    };

    const handleCheckboxChange = (itemId) => {
        if (selectedItems.includes(itemId)) {
            setSelectedItems(selectedItems.filter((id) => id !== itemId));
        } else {
            setSelectedItems([...selectedItems, itemId]);
        }
    };

    const calculateTotal = () => {
        const total = cartItems
            .filter((item) => selectedItems.includes(item.cartItemID))
            .reduce((total, item) => total + item.price * item.quantity, 0);

        return total.toFixed(2);
    };

    const calculateDiscountedTotal = () => {
        const total = calculateTotal();
        const discountedTotal = total * (1 - discount / 100); // Apply discount percentage
        return discountedTotal.toFixed(2);
    };

    const handleCheckout = () => {
        const checkoutItems = cartItems
            .filter((item) => selectedItems.includes(item.cartItemID))
            .map((item) => ({
                ...item,
                price: Number(item.price), // Ensure price is a number
            }));
        if (checkoutItems.length === 0) {
            alert("Please select at least one item to proceed to checkout.");
            return;
        }
    
        navigate("/checkout", { state: { selectedItems: checkoutItems } });
    };      

    const handleDeleteSelected = async () => {
        try {
            // Send delete request for all selected items
            const deletePromises = selectedItems.map((itemId) =>
                axios.delete(`${API_BASE_URL}/cart/${itemId}`)
            );
            await Promise.all(deletePromises);
    
            // Update the cartItems and selectedItems in the state
            setCartItems((prevItems) =>
                prevItems.filter((item) => !selectedItems.includes(item.cartItemID))
            );
            setSelectedItems([]); // Clear selected items after deletion
        } catch (err) {
            console.error("Failed to delete selected items:", err);
        }
    };    

    return (
        <div>
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
                    {user && user.role !== "Admin" && (
                        <button onClick={() => navigate("/cart")} className="cart-button">
                            <img src={shoppingCartIcon} alt="Cart" className="cart-icon" />
                            {cartItems.length > 0 && <span className="cart-count">{cartItems.length}</span>}
                        </button>
                    )}
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
                                    {user.role !== "Admin" && (
                                        <li onClick={() => navigate("/profile?section=purchase&category=all")}>
                                            My Orders
                                        </li>
                                    )}
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
            {/* Cart Content */}
            <div className="cart-container">
                <h2>Your Cart</h2>
                {cartItems.length === 0 ? (
                <div className="empty-cart-container">
                    <img src={emptycart} alt="Empty Cart" className="empty-cart-image" />
                    <p>Your shopping cart is empty</p>
                    <button onClick={() => navigate("/")} className="go-shopping-button">
                        Go Shopping Now
                    </button>
                </div>
                ) : (
                    <div className="cart-items">
                        <div className="cart-header">
                            <input
                                type="checkbox"
                                checked={selectedItems.length === cartItems.length} // Check if all items are selected
                                onChange={handleSelectAll} // Toggle select all
                            />
                            <span className="product-header ">Product</span>
                            <span className="unit-price-header">Unit Price</span>
                            <span className="quantity-header">Quantity</span>
                            <span className="total-price-header">Total Price</span>
                            <span className="actions-header">Actions</span>
                        </div>
                        {cartItems.map((item) => {
                            // Parse the images field if it's stored as a stringified array
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
                                <div className="cart-item" key={item.cartItemID}>
                                    <input
                                        type="checkbox"
                                        checked={selectedItems.includes(item.cartItemID)}
                                        onChange={() => handleCheckboxChange(item.cartItemID)}
                                    />
                                    {/* Display product image */}
                                    <img
                                        src={imageUrl} // Use the parsed image URL or fallback to the default image
                                        alt={item.title}
                                        className="product-image"
                                    />
                                    <h3 className="producttitle">{item.title}</h3>
                                    <p className="unit-price">₱{Number(item.price).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                        <div className="quantity-control">
                                            <button className="minus" onClick={() => handleUpdateQuantity(item.cartItemID, item.quantity - 1)}>-</button>
                                            <span className="itemquant">{item.quantity}</span>
                                            <button className="plus" onClick={() => handleUpdateQuantity(item.cartItemID, item.quantity + 1)}>+</button>
                                        </div>
                                    <p className="totalprice1">₱{(item.price * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                    <button onClick={() => handleRemoveItem(item.cartItemID)} className="remove">Remove</button>
                                </div>
                            );
                        })}
                        <button onClick={handleClearCart} className="clear-cart">
                            Clear Cart
                        </button>
                    </div>
                )}
                <div className="sticky-cart-summary">
                <div className="cart-summary-left">
                    <input
                        type="checkbox"
                        checked={selectedItems.length === cartItems.length}
                        onChange={handleSelectAll}
                    />
                    <label>Select All ({cartItems.length})</label>
                    <button className="cart-delete-button" onClick={handleDeleteSelected}>
                        Delete
                    </button>
                </div>
                <div className="cart-summary-right">
                    <div className="price-section">
                        <p>
                            Total ({selectedItems.length} item
                            {selectedItems.length > 1 ? "s" : ""}):{" "}
                            <span className={`total-price ${discount > 0 ? "strikethrough" : ""}`}>
                                ₱{Number(calculateTotal()).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </p>
                        {discount > 0 && (
                            <p>
                                Discounted Price:{" "}
                                <span className="discounted-price">₱{Number(calculateDiscountedTotal()).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </p>
                        )}
                        {discount > 0 && (
                            <p>
                                Saved:{" "}
                                <span className="savings">₱{(Number(calculateTotal()) - Number(calculateDiscountedTotal())).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </p>
                        )}
                    </div>
                    <div className="discount-section">
                        <input
                            type="text"
                            placeholder="Enter discount code"
                            value={discountCode}
                            onChange={(e) => setDiscountCode(e.target.value)}
                        />
                        <button onClick={handleApplyDiscount} className="apply-discount-button">
                            Apply
                        </button>
                    </div>
                    <button
                        onClick={handleCheckout}
                        className="checkout-button"
                        disabled={selectedItems.length === 0}
                    >
                        Check Out
                    </button>
                </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Cart;