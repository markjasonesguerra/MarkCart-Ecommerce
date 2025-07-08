import React, { useState, useEffect, useRef, useCallback} from "react";
import axios from "axios";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import {
    logo,
    shoppingCartIcon,
    profileIcon,
    searchIcon,
    filter,
    arrowdown,
    back,
    forward,
    starfill,
    starunfilled,
    nosearch,
    image1,
    image2,
    image3,
    
} from "../assets"; 
import "../styles/Products.css";
import SuccessModal from "../components/SuccessModal"; // Import the SuccessModal component
import CustomCarousel from "../components/Carousel"; // Import the CustomCarousel component
import Footer from "../components/Footer.jsx";

const Products = ({ user, setUser }) => {
    const API_BASE_URL =
        (process.env.NODE_ENV === 'development'
            ? 'http://localhost:8800'
            : process.env.REACT_APP_API_BASE_URL
        ).replace(/\/$/, '');
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [selectedCategoryID, setSelectedCategoryID] = useState(null); // Track the selected category
    const [selectedSubcategoryID, setSelectedSubcategoryID] = useState(null); // Track selected subcategory
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryID, setCategoryID] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [productsPerPage] = useState(30); // 5 rows * 6 columns
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [cartItemsCount, setCartItemsCount] = useState(0); // State to hold cart items count
    const [sortOption, setSortOption] = useState("popularity");
    const [topSubcategories, setTopSubcategories] = useState([]); // State for top subcategories
    const [products, setProducts] = useState([]);
    const [showPriceDropdown, setShowPriceDropdown] = useState(false); // State for price dropdown visibility
    const [priceSortOption, setPriceSortOption] = useState(""); // State for selected price sorting option
    const [showSearchFilterDropdown, setShowSearchFilterDropdown] = useState(false);
    const containerRef = useRef(null);
    const navigate = useNavigate();
    const selectRef = useRef(null);
    const [searchParams] = useSearchParams();
    const selectedCartItemID = searchParams.get("selected");
    const [selectedItems, setSelectedItems] = useState([]);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // State variables for filters
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [minRating, setMinRating] = useState("");

    const [isLeftDisabled, setIsLeftDisabled] = useState(true);
    const [isRightDisabled, setIsRightDisabled] = useState(false);

    useEffect(() => {
        if (selectedCartItemID) {
            setSelectedItems([selectedCartItemID]);
        }
    }, [selectedCartItemID]);

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
    
    useEffect(() => { window.scrollTo({ top: 0, behavior: "auto" }); 
    }, [currentPage]);

    // Load user data from localStorage
    useEffect(() => {
        const savedUser = JSON.parse(localStorage.getItem("user"));
        if (savedUser) {
            setUser(savedUser);
        }
    }, [setUser]);

    // Fetch user data from the backend
    useEffect(() => {
        if (!user?.id) return;
    
        const fetchUserData = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/users/${user.id}`);
                const updatedUser = res.data;
    
                setUser((prevUser) => ({
                    ...prevUser,
                    ...updatedUser,
                }));
            } catch (err) {
                console.error("Failed to load user data:", err);
            }
        };
    
        fetchUserData();
    }, [user?.id, setUser]);
    
    useEffect(() => {
    }, [filteredProducts]);

    // Handle search and filter button click
    const handleSearchAndFilter = useCallback(async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/products/filter`, {
                params: {
                    categoryID: selectedSubcategoryID || selectedCategoryID || null, // Include selected category or subcategory
                    searchQuery,
                    minPrice: minPrice || null,
                    maxPrice: maxPrice || null,
                    minRating: minRating || null,
                    sortOption, // Include sorting option
                },
            });
            //console.log("API Response:", res.data);
            setFilteredProducts(res.data);
            setCurrentPage(1);
        } catch (err) {
            console.error("Error filtering products:", err);
        }
    }, [selectedCategoryID, selectedSubcategoryID, searchQuery, minPrice, maxPrice, minRating, sortOption]);
    
    // Fetch all products and apply initial filters
    useEffect(() => {
        console.log("Effect triggered for user?.id:", user?.id);
        const fetchAllProducts = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/products`);
                const productsWithParsedImages = res.data.map(product => {
                    let images = [];
                    if (product.images) {
                        try {
                            // Attempt to parse images only if it's a valid JSON string
                            if (typeof product.images === "string") {
                                images = JSON.parse(product.images.replace(/\\/g, "/"));
                            } else if (Array.isArray(product.images)) {
                                images = product.images; // Use as-is if it's already an array
                            }
                        } catch (err) {
                            console.error("Error parsing images for product:", product, err);
                        }
                    }
                    return { ...product, images };
                });
                setFilteredProducts(productsWithParsedImages); // Set all products as initial filtered products
                setProducts(productsWithParsedImages); // Keep a separate copy of all products
            } catch (err) {
                console.error("Failed to fetch products:", err);
            }
        };
        fetchAllProducts();
    }, [user?.id]); 
    

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
    }, [user?.id]);
    

    // Adjust dropdown width based on selected option
    useEffect(() => {
        if (selectRef.current) {
            const selectedOption = selectRef.current.options[selectRef.current.selectedIndex];
            const tempDiv = document.createElement("div");
            tempDiv.style.position = "absolute";
            tempDiv.style.visibility = "hidden";
            tempDiv.style.height = "auto";
            tempDiv.style.width = "auto";
            tempDiv.style.whiteSpace = "nowrap";
            tempDiv.style.fontSize = "15px"; // Match the font size of the select element
            tempDiv.innerHTML = selectedOption.text;
            document.body.appendChild(tempDiv);
            const width = tempDiv.clientWidth + 60; 
            selectRef.current.style.width = `${width}px`;
            document.body.removeChild(tempDiv);
        }
    }, [categoryID]);

    useEffect(() => {
       // handleSearchAndFilter(); i comment this to apply filter only when the button is clicked
    }, []); // Safe to run as it's memoized

    useEffect(() => {
        if (selectedSubcategoryID !== null) {
            handleSearchAndFilter();
        }
    }, [selectedSubcategoryID, handleSearchAndFilter]);

    const Pagination = ({ totalPages, currentPage, setCurrentPage }) => {
        const getPagination = () => {
            const pages = [];
            const maxPagesToShow = 5;
    
            if (totalPages <= maxPagesToShow) {
                for (let i = 1; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                if (currentPage <= 3) {
                    pages.push(1, 2, 3, 4, '...', totalPages);
                } else if (currentPage >= totalPages - 2) {
                    pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                } else {
                    pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
                }
            }
    
            return pages;
        };
    
        const paginationItems = getPagination();
    
        return (
            <div className="pagination">
                <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                >
                    &lt;
                </button>
                {paginationItems.map((page, index) =>
                    page === "..." ? (
                        <span key={index} className="ellipsis">...</span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={currentPage === page ? "active" : ""}
                            disabled={currentPage === page}
                        >
                            {page}
                        </button>
                    )
                )}
                <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                >
                    &gt;
                </button>
            </div>
        );
    };
    
    // Logout handler
    const handleLogout = () => {
        localStorage.removeItem("user");
        if (typeof setUser === 'function') {
            setUser(null);
        }
        navigate("/login");
    };

    // Add product to cart
    const handleAddToCart = async (productID) => {
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
    
            // Fetch the updated cart items count
            const updatedCartRes = await axios.get(`${API_BASE_URL}/cart/${user.id}`);
            setCartItemsCount(updatedCartRes.data.length); // Update cart items count
            setShowSuccessModal(true); // Show success modal
        } catch (err) {
            console.error("Error adding to cart:", err);
            alert("Failed to add product to cart. Please try again.");
        }
    };



    // Handle category change
    const handleCategoryChange = (e) => {
        const selectedCategory = e.target.value;
        setCategoryID(selectedCategory); // Update category state
        setSelectedCategoryID(selectedCategory); // Update selected category
        setSelectedSubcategoryID(null); // Reset subcategory selection
    };

    const handleSubcategoryClick = (subcategoryID) => {
        setSelectedSubcategoryID(subcategoryID);
    };

    const handleSortChange = (sortValue) => {
        setSortOption(sortValue);
        handleSearchAndFilter();
    };

    const scrollLeft = () => {
        if (containerRef.current) {
            containerRef.current.scrollBy({ left: -200, behavior: "smooth" });
        }
    };

    const scrollRight = () => {
        if (containerRef.current) {
            containerRef.current.scrollBy({ left: 200, behavior: "smooth" });
        }
    };


    useEffect(() => {
        const handleScroll = () => {
            if (containerRef.current) {
                const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
                setIsLeftDisabled(scrollLeft === 0);
                setIsRightDisabled(scrollLeft + clientWidth >= scrollWidth);
            }
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener("scroll", handleScroll);
            handleScroll(); // Initial check
        }

        return () => {
            if (container) {
                container.removeEventListener("scroll", handleScroll);
            }
        };
    }, [subcategories]);

    useEffect(() => {
        let sortedProducts = [...filteredProducts]; // Make a copy to sort
        switch (sortOption) {
            case "popular":
                sortedProducts.sort((a, b) => b.sold - a.sold); // Sort by popularity (sold)
                break;
            case "latest":
                sortedProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by latest
                break;
            case "topSales":
                sortedProducts.sort((a, b) => b.sold - a.sold); // Sort by top sales
                break;
            case "priceLowToHigh":
                sortedProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price)); // Price low to high
                break;
            case "priceHighToLow":
                sortedProducts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price)); // Price high to low
                break;
            default:
                break;
        }
        // Prevent setting state if the array is unchanged
        setFilteredProducts((prevProducts) => {
            if (JSON.stringify(prevProducts) === JSON.stringify(sortedProducts)) {
                return prevProducts; // No update needed
            }
            return sortedProducts;
        });
    }, [sortOption, filteredProducts]);

    // Fetch subcategories when selectedCategoryID changes
    useEffect(() => {
        const fetchSubcategories = async () => {
            if (selectedCategoryID) {
                try {
                    const res = await axios.get(`${API_BASE_URL}/categories/${selectedCategoryID}/subcategories`);
                    setSubcategories(res.data);
                } catch (err) {
                    console.error("Failed to load subcategories:", err);
                }
            }
        };
        fetchSubcategories();
    }, [selectedCategoryID]);
    
    useEffect(() => {
        const fetchPopularSubcategories = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/categories/popular`);
                setTopSubcategories(res.data) // Get top 10 popular subcategories
            } catch (err) {
                console.error("Failed to load popular subcategories:", err);
            }
        };
        fetchPopularSubcategories();
    }, [selectedCategoryID]);

    const handleEditProduct = (productID) => {
        navigate(`/admin/update/${productID}`);
    };
    
    const handleDeleteProduct = async (productID) => {
        try {
            await axios.delete(`${API_BASE_URL}/products/${productID}`);
            setProducts(products.filter(product => product.productID !== productID));
            alert("Product deleted successfully.");
        } catch (err) {
            console.error("Error deleting product:", err);
            alert("Failed to delete product. Please try again.");
        }
    };


    // Paginate products
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const paginatedProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

    return (
        <div>
            
            {/* Top Navbar */}
            <div className="top-navbar1">
                <div className="top-left">
                    <a href="/download">Download</a> |{" "}
                    <a href="https://www.facebook.com/profile.php?id=61576260396808" target="_blank" rel="noopener noreferrer">Follow us on Instagram</a>|{" "} 
                    <Link to="/build" target="_blank" rel="noopener noreferrer">Build A PC</Link>
                </div>
                <div className="top-right">
                    <a href="/notifications">Notifications</a> |{" "}
                    <a href="/help">Help </a> |{" "}
                    <a href="/language">English</a>
                </div>
            </div>

            {/* Main Navbar */}
            <nav className="main-navbar">
                <img src={logo} alt="Mark Cart Logo" className="logo" onClick={() => window.location.href = "/"} />
                <div className="search-container">
                    <select
                        ref={selectRef}
                        value={categoryID}
                        onChange={handleCategoryChange}
                    >
                        <option value="">All</option>
                        {categories.filter((cat) => !cat.parentCategoryID).map((category) => (
                            <option key={category.categoryID} value={category.categoryID}>
                                {category.name}
                            </option>
                        ))}
                    </select>

                    <input
                        type="text"
                        placeholder="Search for products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button className="search-button" onClick={handleSearchAndFilter}>
                        <img src={searchIcon} alt="Search" className="search-icon" />
                    </button>
                </div>
                <div className="navbar-actions">
                    {user?.role !== "Admin" && (
                        <button onClick={() => navigate("/cart")} className="cart-buttonp">
                            <img src={shoppingCartIcon} alt="Cart" className="cart-icon" />
                            {cartItemsCount > 0 && (
                                <span className="cart-countp">{cartItemsCount}</span>
                            )}
                        </button>
                    )}
                    {!user ? (
                        <>
                            <button onClick={() => navigate("/signup")} className="Signbutton">
                                SignUp
                            </button>
                            <button onClick={() => navigate("/login")} className="loginbutton">
                                LogIn
                            </button>
                        </>
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
                                <span className="user-name1" title={user.name}>{user.name}</span>
                            </button>
                            {showProfileMenu && (
                                <ul className="profile-dropdown">
                                    <li onClick={() => navigate("/profile?section=account&category=profile")}>My Account</li>
                                    {user?.role !== "Admin" && (
                                        <li onClick={() => navigate("/profile?section=purchase&category=all")}>My Orders</li>
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

            {/* Admin Navigation */}
            {user?.role === "Admin" && (
                <div className="admin-navigation">
                    <Link to="/admin/products" className="admin-nav-button">Dashboard</Link>
                    <Link to="/admin/add" className="admin-nav-button">Add Product</Link>
                    <Link to="/admin/add-category" className="admin-nav-button">Add Category</Link>
                    <Link to="/admin/add-voucher" className="admin-nav-button">Add Voucher</Link>
                    <Link to="/admin/manage-categories" className="admin-nav-button">Manage Categories</Link>
                    <Link to="/admin/manage-orders" className="admin-nav-button">Manage Orders</Link>
                </div>
            )}
            
            {/* Filters */}
            {selectedCategoryID && (
                <div className="filters">

            {/* Subcategories */}
            <div className="popular-categories">
                <div className="categories-wrapper">
                    <button className="scroll-button left" onClick={scrollLeft} disabled={isLeftDisabled}>
                        <img src={back} alt="Scroll Left" />
                    </button>
                    <div className="categories-container1" ref={containerRef}>
                        {/* Main Category Button */}
                        <div className="category-card1">
                            <button
                                key={selectedCategoryID}
                                className={selectedSubcategoryID === null ? "selected" : ""}
                                onClick={() => {
                                    setSelectedSubcategoryID(null);
                                    handleSearchAndFilter();
                                }}
                            >
                                <div className="category-info2">
                                    <span className="category-name2">
                                        All {categories.find(category => category.categoryID === selectedCategoryID)?.name}
                                    </span>
                                </div>
                            </button>
                        </div>

                        {/* Subcategory Buttons */}
                        {subcategories.map((subcategory) => (
                            <div className="category-card1" key={subcategory.categoryID}>
                                <button
                                    className={selectedSubcategoryID === subcategory.categoryID ? "selected" : ""}
                                    onClick={() => {
                                        setSelectedSubcategoryID(subcategory.categoryID);
                                        handleSearchAndFilter();
                                    }} // Call handler
                                >
                                    <div className="category-image1">
                                        <img
                                            src={`${API_BASE_URL}/${subcategory.image}`}
                                            alt={subcategory.name}
                                        />
                                    </div>
                                    <div className="category-info">
                                        <span className="category-name2">{subcategory.name}</span>
                                    </div>
                                </button>
                            </div>
                        ))}
                    </div>
                    <button className="scroll-button right" onClick={scrollRight} disabled={isRightDisabled}>
                        <img src={forward} alt="Scroll Right" />
                    </button>
                </div>
            </div>
                    <div className="filter-options">
                        <span>Sort by</span>
                        <button
                            className={sortOption === "popular" ? "active-sort" : ""}
                            onClick={() => handleSortChange("popular")}
                        >
                            Popular
                        </button>
                        <button
                            className={sortOption === "latest" ? "active-sort" : ""}
                            onClick={() => handleSortChange("latest")}
                        >
                            Latest
                        </button>
                        <button
                            className={sortOption === "topSales" ? "active-sort" : ""}
                            onClick={() => handleSortChange("topSales")}
                        >
                            Top Sales
                        </button>

                        <div className="price-filter">
                            <button className="button-with-icon" onClick={() => setShowPriceDropdown(!showPriceDropdown)}>
                                {priceSortOption === "lowToHigh" ? "Price: Low to High" : 
                                priceSortOption === "highToLow" ? "Price: High to Low" : "Price"}
                                <img src={arrowdown} alt="" />
                            </button>
                            {showPriceDropdown && (
                                <div className="price-dropdown">
                                    <button onClick={() => {
                                        setPriceSortOption("lowToHigh");
                                        handleSortChange("priceLowToHigh");
                                        setShowPriceDropdown(false);
                                    }}>
                                        Price: Low to High
                                    </button>
                                    <button onClick={() => {
                                        setPriceSortOption("highToLow");
                                        handleSortChange("priceHighToLow");
                                        setShowPriceDropdown(false);
                                    }}>
                                        Price: High to Low
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="filter-dropdown">
                            <button className="button-with-icon" onClick={() => setShowSearchFilterDropdown(!showSearchFilterDropdown)}>
                                Search Filter <img src={filter} alt="" />
                            </button>
                            {showSearchFilterDropdown && (
                                <div className="filter-dropdown-content show">
                                    {/* Price Range */}
                                    <div className="filter-item">
                                        <label>Price Range</label>
                                        <input
                                            type="number"
                                            placeholder="Min Price"
                                            value={minPrice}
                                            onChange={(e) => setMinPrice(e.target.value)}
                                        />
                                        <input
                                            type="number"
                                            placeholder="Max Price"
                                            value={maxPrice}
                                            onChange={(e) => setMaxPrice(e.target.value)}
                                        />
                                    </div>

                                    {/* Rating Filter */}
                                    <div className="filter-item">
                                        <label>Rating</label>
                                        <select onChange={(e) => setMinRating(e.target.value)}>
                                            <option value="">Select Rating</option>
                                            {[...Array(5).keys()].map((i) => (
                                                <option key={i} value={i + 1}>
                                                    {i + 1} Star
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <button className="filter-button" onClick={handleSearchAndFilter}>
                                        Apply Filters
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            <SuccessModal show={showSuccessModal} onClose={() => setShowSuccessModal(false)} />

        {/* Top Subcategories */}
        {!selectedCategoryID && user?.role !== "Admin" && (
            <div className="popular-categories">
                <CustomCarousel images={[image1, image2, image3]} />
                <div className="popular-header">
                    <h4 className="section-title">Popular Categories</h4>
                </div>
                <div className="categories-wrapper">
                    <button className="scroll-button left" onClick={scrollLeft}>
                        <img src={back} alt="Scroll Left" />
                    </button>
                    <div className="categories-container1" ref={containerRef}>
                        {topSubcategories.map((subcategory) => (
                            <div className="category-card1" key={subcategory.categoryID}>
                                <button
                                    onClick={() => handleSubcategoryClick(subcategory.categoryID)}
                                    className="category-btn"
                                >
                                    <div className="category-image1">
                                        <img
                                            src={`${API_BASE_URL}/${subcategory.image}`}
                                            alt={subcategory.name}
                                        />
                                    </div>
                                    <div className="category-info2">
                                        <span className="category-name2">{subcategory.name}</span>
                                        <span className="category-usage2">
                                            Usage Count: {subcategory.usageCount}
                                        </span>
                                    </div>
                                </button>
                            </div>
                        ))}
                    </div>
                    <button className="scroll-button right" onClick={scrollRight}>
                        <img src={forward} alt="Scroll Right" />
                    </button>
                </div>
            </div>
            )}

            {/* Product Grid */}
            <div className="product-grid-container">
            {!selectedCategoryID && user?.role !== "Admin" && (
                    <div className="dicover-header">
                        <h4>DAILY DISCOVER</h4>
                    </div>
                )}
                <div className="product-grid">
                    {paginatedProducts.length === 0 ? (
                        <div className="empty-message-container">
                            <img src={nosearch} alt="No Search Results" className="nosearch-gif" />
                            <p className="empty-message">No products found. Try adjusting your search or filters.</p>
                        </div>
                    ) : (
                        paginatedProducts.map((product) => (
                            <div className="card" key={product.productID}>
                                <Link to={`/product/${product.productID}`} className="product-link">
                                    <div className="product-image-container">
                                        <img
                                            className="product-image"
                                            src={product.images && product.images.length > 0
                                                ? `${API_BASE_URL}/${product.images[0]}`
                                                : "/placeholder.png"} // Placeholder for missing images
                                            alt={product.title}
                                        />
                                        {product.quantity === 0 && (
                                            <div className="out-of-stock-overlay">Out of Stock</div>
                                        )}
                                    </div>
                                    <h3>{product.title}</h3>
                                    <p>{product.description}</p>
                                    <div className="price">₱{Number(product.price).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    <div className="sold">{product.sold} sold</div>
                                    <div className="rating">
                                        <span>{product.rating || 5.0}</span>
                                        {[...Array(5)].map((_, index) => (
                                            <img
                                                key={`${product.productID}-star-${index}`}
                                                src={index < product.rating ? starfill : starunfilled}
                                                alt={index < product.rating ? "filled star" : "unfilled star"}
                                                className="star"
                                            />
                                        ))}
                                    </div>
                                </Link>
                                {product.quantity === 0 ? (
                                    <button disabled className="out-of-stock-button">
                                        Out of Stock
                                    </button>
                                ) : (
                                    user?.role !== "Admin" && (
                                        <button
                                            onClick={() => handleAddToCart(product.productID)}
                                            disabled={!user}
                                        >
                                            Add to Cart
                                        </button>
                                    )
                                )}
                                {user?.role === "Admin" && (
                                    <div className="admin-buttons">
                                        <button onClick={() => handleEditProduct(product.productID)} className="edit-button">Edit</button>
                                        <button onClick={() => handleDeleteProduct(product.productID)} className="delete-button">Delete</button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Pagination */}
            <div className="pagination-container">
                <Pagination
                    totalPages={Math.ceil(filteredProducts.length / productsPerPage)}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                />
            </div>
            <Footer />
        </div>
    );
};

export default Products;