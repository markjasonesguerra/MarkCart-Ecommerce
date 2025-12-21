import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/adminStyles/AdminDashboard.css";
import {
  logo,
  profileIcon,
} from "../../assets"; 

const AdminDashboard = ({ user, setUser }) => {
  const API_BASE_URL =
      (process.env.NODE_ENV === 'development'
          ? 'http://localhost:8800'
          : process.env.REACT_APP_API_BASE_URL
      ).replace(/\/$/, '');

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const navigate = useNavigate();

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

  // Fetch low stock products
  useEffect(() => {
    const fetchLowStockProducts = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/products/low-stock`);
        setLowStockProducts(res.data);
      } catch (err) {
        console.error("Failed to fetch low stock products:", err);
      }
    };

    fetchLowStockProducts();
  }, []);

  return (
    <div className="adminDashboard">
      {/* Main Navbar */}
      <nav className="admin-main-navbar">
        <img src={logo} alt="Mark Cart Logo" className="logo" onClick={() => window.location.href = "/admin/products"} />
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
          <div className="admin-profile-menu">
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
              <span className="user-name" title={user.name}>{user.name}</span>
            </button>
            {showProfileMenu && (
              <ul className="admin-profile-dropdown">
                <li onClick={() => navigate("/profile?section=account&category=profile")}>My Account</li>
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
      </nav>
      <div className="admin-main-content">
        <div className="sidebarAdmin">
          <ul>
            <li>
              <NavLink to="/admin/products" className={({ isActive }) => (isActive ? "active-link" : "")}>Products</NavLink>
            </li>
            <li>
              <NavLink to="/admin/manage-categories" className={({ isActive }) => (isActive ? "active-link" : "")}>Categories</NavLink>
            </li>
            <li>
              <NavLink to="/admin/manage-orders" className={({ isActive }) => (isActive ? "active-link" : "")}>Orders</NavLink>
            </li>
            <li>
              <NavLink to="/admin/manage-users" className={({ isActive }) => (isActive ? "active-link" : "")}>Users</NavLink>
            </li>
            <li>
              <NavLink to="/admin/messages" className={({ isActive }) => (isActive ? "active-link" : "")}>Messages</NavLink>
            </li>
            <li>
              <NavLink to="/admin/manage-vouchers" className={({ isActive }) => (isActive ? "active-link" : "")}>Vouchers</NavLink>
            </li>
          </ul>
        </div>
        <div className="adminContent">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;