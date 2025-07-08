import React, { useRef, useEffect, useState, } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  logo,
  shoppingCartIcon,
  profileIcon,
  searchIcon,
} from "../assets";
import "../styles/Products.css";

const MainNav = ({ user, cartItemsCount, categories = [], setUser }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false); // Ensure this is defined
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const selectRef = useRef(null);
  const [localUser, setLocalUser] = useState(user || JSON.parse(localStorage.getItem("user")));

  // Adjust Dropdown Width
  useEffect(() => {
    if (selectRef.current) {
      const selectedOption = selectRef.current.options[selectRef.current.selectedIndex];
      const tempDiv = document.createElement("div");
      tempDiv.style.position = "absolute";
      tempDiv.style.visibility = "hidden";
      tempDiv.style.height = "auto";
      tempDiv.style.width = "auto";
      tempDiv.style.whiteSpace = "nowrap";
      tempDiv.style.fontSize = "15px";
      tempDiv.innerHTML = selectedOption.text;
      document.body.appendChild(tempDiv);
      const width = tempDiv.clientWidth + 60;
      selectRef.current.style.width = `${width}px`;
      document.body.removeChild(tempDiv);
    }
  }, []);

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("user");
    if (typeof setUser === "function") {
      setUser(null);
    }
    navigate("/login");
  };

  useEffect(() => {
    setLocalUser(user); // Update local state whenever the parent user prop changes
  }, [user]);

  // Sync with localStorage when the localUser updates
  useEffect(() => {
    if (localUser) {
      localStorage.setItem("user", JSON.stringify(localUser));
    }
  }, [localUser]);

  return (
    <>
      {/* Top Navbar */}
      <div className="top-navbar1">
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

      {/* Main Navbar */}
      <nav className="main-navbar">
        <img src={logo} alt="Mark Cart Logo" className="logo" onClick={() => navigate("/")} />
        {user && user.role !== "Admin" && ( // Conditionally render search bar for non-admin users
          <div className="search-container">
            <select ref={selectRef}>
              <option value="">All</option>
              {categories
                .filter((cat) => !cat.parentCategoryID)
                .map((category) => (
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
            <button className="search-button" onClick={() => navigate(`/products?search=${encodeURIComponent(searchQuery)}`)}>
              <img src={searchIcon} alt="Search" className="search-icon" />
            </button>
          </div>
        )}
        <div className="navbar-actions">
          {user && user.role !== "Admin" && (
            <button onClick={() => navigate("/cart")} className="cart-buttonp">
              <img src={shoppingCartIcon} alt="Cart" className="cart-icon" />
              {cartItemsCount > 0 && <span className="cart-countp">{cartItemsCount}</span>}
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
                <span className="user-name1" title={user.name}>
                  {user.name}
                </span>
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
                  <li onClick={handleLogout}>Logout</li>
                </ul>
              )}
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default MainNav;