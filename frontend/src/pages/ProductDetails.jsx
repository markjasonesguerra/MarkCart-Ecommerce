import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/ProductsDetails.css"; // Ensure this CSS file is created and updated
import Footer from "../components/Footer";
import MainNav from "../components/MainNav";
import { starIconfill, starIconunfill, addcartIcon, noratings } from "../assets"; // Ensure these paths are correct

const ProductDetails = ({ user, setUser }) => {
    const API_BASE_URL =
        (process.env.NODE_ENV === 'development'
            ? 'http://localhost:8800'
            : process.env.REACT_APP_API_BASE_URL
        ).replace(/\/$/, '');
    const { productID } = useParams(); // Get productID from the URL
    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [filteredReviews, setFilteredReviews] = useState([]); // State for filtered reviews
    const [ratingCount, setRatingCount] = useState(0); // State for rating count
    const [error, setError] = useState(null);
    const [cartItemsCount, setCartItemsCount] = useState(0);
    const [categories, setCategories] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRating, setSelectedRating] = useState("All"); // State for selected rating filter
    
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch product details based on productID
        const fetchProduct = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/products/${productID}`);
                const item = res.data;

                // Directly use the images array
                const images = item.images || [];

                setProduct({ ...item, images });
            } catch (err) {
                console.error("Error fetching product details:", err);
                setError("Failed to load product details. Please try again later.");
            }
        };

        const fetchReviews = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/reviews/product/review/${productID}`);
                console.log("Fetched reviews:", response.data); // Log the fetched reviews
                setReviews(response.data);
                setFilteredReviews(response.data); // Initialize filtered reviews
            } catch (error) {
                if (error.response && error.response.status === 404) {
                    console.log("No reviews found for this product.");
                    setReviews([]); // Set an empty array to handle no reviews
                    setFilteredReviews([]); // Set an empty array to handle no reviews
                } else {
                    console.error("Error fetching reviews:", error);
                }
            }
        };

        const fetchRatingCount = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/reviews/product/count/${productID}`);
                console.log("Fetched rating count:", response.data); // Log the fetched rating count
                setRatingCount(response.data.ratingCount);
            } catch (error) {
                console.error("Error fetching rating count:", error);
            }
        };
    
        fetchProduct();
        fetchReviews();
        fetchRatingCount();
    }, [productID, user, API_BASE_URL]);

    // Fetch cart items count
    useEffect(() => {
        if (!user?.id) return;

        const fetchCartItemsCount = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/cart/${user.id}`);
                setCartItemsCount((prevCount) =>
                    prevCount === res.data.length ? prevCount : res.data.length
                );
            } catch (err) {
                console.error("Failed to load cart items count:", err);
            }
        };

        fetchCartItemsCount();
    }, [user?.id, API_BASE_URL]);

    const fetchCartItemsCount = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/cart/${user.id}`);
            setCartItemsCount((prevCount) =>
                prevCount === res.data.length ? prevCount : res.data.length
            );
        } catch (err) {
            console.error("Failed to load cart items count:", err);
        }
    };

    const handleAddToCart = async () => {
        if (!user) {
            alert("You need to log in to add items to the cart.");
            navigate("/login");
            return;
        }
        try {
            const res = await axios.get(`${API_BASE_URL}/cart/${user.id}`);
            const cartItems = res.data;
            const existingItem = cartItems.find(item => item.productID === productID);

            if (existingItem) {
                await axios.put(`${API_BASE_URL}/cart/${existingItem.cartItemID}`, {
                    quantity: existingItem.quantity + 1,
                });
            } else {
                await axios.post(`${API_BASE_URL}/cart`, {
                    userID: user.id,
                    productID,
                    quantity: 1,
                });
            }
            alert("Product added to cart!");
            fetchCartItemsCount(); // Update cart items count after adding to cart
        } catch (err) {
            console.error("Error adding to cart:", err);
            alert("Failed to add product to cart. Please try again.");
        }
    };

    const handleBuyNow = async () => {
        if (!user) {
            alert("You need to log in to purchase items.");
            navigate("/login");
            return;
        }
        try {
            const res = await axios.get(`${API_BASE_URL}/cart/${user.id}`);
            const cartItems = res.data;
            const existingItem = cartItems.find(item => item.productID === productID);

            if (existingItem) {
                await axios.put(`${API_BASE_URL}/cart/${existingItem.cartItemID}`, {
                    quantity: existingItem.quantity + 1,
                });
            } else {
                await axios.post(`${API_BASE_URL}/cart`, {
                    userID: user.id,
                    productID,
                    quantity: 1,
                });
            }
            navigate("/cart");
        } catch (err) {
            console.error("Error adding to cart:", err);
            alert("Failed to add product to cart. Please try again.");
        }
    };

    const handleDeleteReview = async (reviewID) => {
        try {
            await axios.delete(`${API_BASE_URL}/reviews/${reviewID}`, { data: { userID: user.id } });
            setReviews(reviews.filter(review => review.reviewID !== reviewID));
            setFilteredReviews(filteredReviews.filter(review => review.reviewID !== reviewID));
            alert("Review deleted successfully.");
        } catch (err) {
            console.error("Error deleting review:", err);
            alert("Failed to delete review. Please try again later.");
        }
    };

    const handleRatingFilter = (rating) => {
        setSelectedRating(rating);
        if (rating === "All") {
            setFilteredReviews(reviews);
        } else {
            const filtered = reviews.filter(review => review.productQuality === parseInt(rating));
            setFilteredReviews(filtered);
        }
    };

    if (error) return <p className="error-message">{error}</p>;
    if (!product) return <p>Loading product details...</p>;

    const imageUrl =
    product.images && product.images.length > 0 && product.images[0]
        ? `${API_BASE_URL}/${product.images[0].replace(/\\/g, "/")}`
        : `${API_BASE_URL}/uploads/default-placeholder.jpg`;
        console.log("Image URL:", imageUrl);

    const averageRating = product.averageRating ? product.averageRating.toFixed(1) : "0.0";

    const handleSearchAndFilter = () => {
        navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem("user");
        navigate("/login");
      };

    return (
        <div>
            <MainNav
                user={user}
                cartItemsCount={cartItemsCount}
                categories={categories}
                categoryID=""
                handleCategoryChange={() => {}}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                handleSearchAndFilter={handleSearchAndFilter}
                handleLogout={handleLogout}
            />

            <div className="details-header">
                <div className="product-image-container">
                    <img src={imageUrl} alt={product.title} className="details-image" />
                    {product.quantity === 0 && (
                        <div className="out-of-stock-overlay">Out of Stock</div>
                    )}
                </div>
                <div className="details-info">
                    <h1 className="details-title">{product.title}</h1>
                    <div className="details-rating">
                        <span className="average-rating">{averageRating}</span>
                        <div className="stars">
                            {[...Array(5)].map((_, index) => (
                                <img
                                    key={index}
                                    src={index < product.averageRating ? starIconfill : starIconunfill}
                                    alt={index < product.averageRating ? "filled star" : "unfilled star"}
                                    className="star"
                                />
                            ))}
                        </div>
                        <span className="rating1">| <span className="ratings-count"><strong>{ratingCount}</strong></span> <span className="rating-text">Ratings</span></span>
                        <span className="sold">| <span className="sold-count"><strong>{product.sold}</strong></span> <span className="sold-text">Sold</span></span>
                    </div>
                    <p className="details-price">₱{Number(product.price).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <div className="details-actions">
                    <button
                        onClick={handleAddToCart}
                        className="add-to-cart"
                        style={{
                            border: "1px solid #D94629",
                            backgroundColor: product.quantity === 0 ? "#FFF5F1" : "#FFF5F1",
                            color: product.quantity === 0 ? "#EE4D2D" : "#EE4D2D",
                            cursor: product.quantity === 0 ? "not-allowed" : "pointer"
                        }}
                        disabled={product.quantity === 0}
                    >
                        <img src={addcartIcon} alt="Add to Cart Icon" style={{ marginRight: "8px", height: "24px", width: "24px" }} />
                        Add to Cart
                    </button>
                    <button
                        onClick={handleBuyNow}
                        className="buy-now1"
                        style={{
                            cursor: product.quantity === 0 ? "not-allowed" : "pointer"
                        }}
                        disabled={product.quantity === 0}
                    >
                        Buy Now
                    </button>
                    </div>
                </div>
            </div>

            {/* Product Specifications */}
            <div className="details-specs">
                <h2>Product Details</h2>
                <ul>
                    <li>
                        <label>Category:</label>
                        <span className="category-name">{product.categoryName}</span>
                    </li>
                    <li>
                        <label>Stock:</label>
                        <span className="stock-quantity">{product.quantity}</span>
                    </li>
                </ul>
            </div>

            {/* Product Description */}
            <div className="details-description">
                <h2>Product Description</h2>
                <p className="product-description">{product.description}</p> {/* Add class for styling */}
            </div>

            {/* Product Ratings */}
            <div className="details-reviews">
                <h2>Product Ratings</h2>
                <div className="reviews-header">
                    <div className="ratings-summary">
                    <span className="average-rating">{product.averageRating.toFixed(1)} <span>out of 5</span></span>
                        <div className="stars">
                            {[...Array(5)].map((_, index) => (
                                <span
                                    key={index}
                                    className={index < product.averageRating ? "star filled" : "star"}
                                >
                                    ★
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="ratings-filter">
                        <button className={selectedRating === "All" ? "selected" : ""} onClick={() => handleRatingFilter("All")}>All</button>
                        <button className={selectedRating === "5" ? "selected" : ""} onClick={() => handleRatingFilter("5")}>5 Star</button>
                        <button className={selectedRating === "4" ? "selected" : ""} onClick={() => handleRatingFilter("4")}>4 Star</button>
                        <button className={selectedRating === "3" ? "selected" : ""} onClick={() => handleRatingFilter("3")}>3 Star</button>
                        <button className={selectedRating === "2" ? "selected" : ""} onClick={() => handleRatingFilter("2")}>2 Star</button>
                        <button className={selectedRating === "1" ? "selected" : ""} onClick={() => handleRatingFilter("1")}>1 Star</button>
                    </div>
                </div>
                {filteredReviews.length > 0 ? (
                    filteredReviews.map((review) => {
                        const averageReviewRating = ((review.productQuality + review.sellerService + review.deliveryService) / 3).toFixed(1);
                        return (
                            <div key={review.reviewID} className="review-item">
                                <div className="review-header">
                                    <p className="review-user"><strong>{review.userName}</strong></p>
                                    {user && user.id === review.userID && (
                                        <button className="review-delete-button" onClick={() => handleDeleteReview(review.reviewID)}>Delete</button>
                                    )}
                                </div>
                                <div className="review-stars">
                                    {[...Array(5)].map((_, index) => (
                                        <span
                                            key={index}
                                            className={index < averageReviewRating ? "star filled" : "star"}
                                        >
                                            ★
                                        </span>
                                    ))}
                                </div>
                                <p className="review-date">{new Date(review.createdAt).toLocaleDateString()}</p>
                                <div className="review-comments">
                                    <p className="review-performance">Performance: <span>{review.performance}</span></p>
                                    <p className="review-suitability">Suitability: <span>{review.suitability}</span></p>
                                </div>
                                <p className="review-comment">{review.comment}</p>
                            </div>
                        );
                    })
                ) : (
                    <div className="no-reviews">
                        <img src={noratings} alt="No Ratings" />
                        <p>No reviews yet. Be the first to leave a review!</p>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default ProductDetails;