import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../../styles/adminStyles/ManageUsers.css";

const ManageUsers = () => {
  const API_BASE_URL =
      (process.env.NODE_ENV === 'development'
          ? 'http://localhost:8800'
          : process.env.REACT_APP_API_BASE_URL
      ).replace(/\/$/, '');
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalAdmins, setTotalAdmins] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    role: "",
    gender: "",
    birthday: ""
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const editSectionRef = useRef(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/users`);
        setUsers(res.data);
        calculateTotals(res.data);
      } catch (err) {
        console.error("Error fetching users:", err);
        alert("Failed to fetch users. Please try again later.");
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (editingUser && editSectionRef.current) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [editingUser]);

  const calculateTotals = (users) => {
    const totalUsers = users.length;
    const totalAdmins = users.filter(user => user.role === "Admin").length; // Match the exact role value
    const totalCustomers = users.filter(user => user.role === "Customer").length; // Match the exact role value

    setTotalUsers(totalUsers);
    setTotalAdmins(totalAdmins);
    setTotalCustomers(totalCustomers);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleDeleteClick = (user) => {
    setDeleteUser(user);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/users/${deleteUser.userID}`);
      const updatedUsers = users.filter(user => user.userID !== deleteUser.userID);
      setUsers(updatedUsers);
      calculateTotals(updatedUsers);
      setIsModalOpen(false);
      setSuccessMessage("User deleted successfully!");
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000); // Hide the message after 3 seconds
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Failed to delete user. Please try again later.");
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user.userID);
    setEditFormData({
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      gender: user.gender,
      birthday: user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : ""
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleEditSave = async () => {
    try {
        await axios.put(`${API_BASE_URL}/users/${editingUser}`, editFormData);
        const updatedUsers = users.map(user =>
            user.userID === editingUser ? { ...user, ...editFormData } : user
        );
        setUsers(updatedUsers);
        setEditingUser(null);
        setSuccessMessage("User updated successfully!");
        setTimeout(() => {
            setSuccessMessage("");
        }, 3000); // Hide the message after 3 seconds
    } catch (err) {
        console.error("Error updating user:", err);
        alert("Failed to update user. Please try again later.");
    }
};

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="users-container">
      <div className="header-dashboard">
        <h2>Users Dashboard</h2>
        <div className="dashboard-container">
          <div className="dashboard-actions">
            <div className="dashboard-item">
              <span className="dashboard-number">{totalUsers}</span>
              <span>Users</span>
            </div>
            <div className="dashboard-item">
              <span className="dashboard-number">{totalAdmins}</span>
              <span>Admins</span>
            </div>
            <div className="dashboard-item">
              <span className="dashboard-number">{totalCustomers}</span>
              <span>Customers</span>
            </div>
          </div>
        </div>
      </div>
      {editingUser && (
        <div className="edit-form" ref={editSectionRef}>
          <h3>Edit User</h3>
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={editFormData.name}
            onChange={handleEditChange}
            placeholder="Enter Name"
          />
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={editFormData.email}
            onChange={handleEditChange}
            placeholder="Enter Email"
          />
          <label htmlFor="phoneNumber">Phone Number</label>
          <input
            type="text"
            id="phoneNumber"
            name="phoneNumber"
            value={editFormData.phoneNumber}
            onChange={handleEditChange}
            placeholder="Enter Phone Number"
          />
          <label htmlFor="role">Role</label>
          <select
            id="role"
            name="role"
            value={editFormData.role}
            onChange={handleEditChange}
          >
            <option value="Admin">Admin</option>
            <option value="Customer">Customer</option>
          </select>
          <label htmlFor="gender">Gender</label>
          <input
            type="text"
            id="gender"
            name="gender"
            value={editFormData.gender}
            onChange={handleEditChange}
            placeholder="Enter Gender"
          />
          <label htmlFor="birthday">Birthday</label>
          <input
            type="date"
            id="birthday"
            name="birthday"
            value={editFormData.birthday}
            onChange={handleEditChange}
            placeholder="Enter Birthday"
          />
          <div className="button-group">
            <button onClick={handleEditSave} className="user-save-button">Save</button>
            <button onClick={() => setEditingUser(null)} className="user-cancel-button">Cancel</button>
          </div>
        </div>
      )}

      <div className="users-header">
        <h2>Manage Users</h2>
        <div className="users-header-actions">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={handleSearch}
            className="users-search-bar"
          />
        </div>
      </div>
      <div className="users-list">
        <div className="users-list-header">
          <div className="users-name-column">Name</div>
          <div>Email</div>
          <div>Role</div>
          <div>Actions</div>
        </div>
        {filteredUsers.map(user => (
          <div key={user.userID} className="users-item">
            <div className="users-info">
              {user.profilePicture && user.profilePicture.data ? (
                <img
                  src={`data:${user.profilePicture.contentType};base64,${user.profilePicture.data}`}
                  alt="Profile"
                  className="user-image"
                />
              ) : (
                <div className="no-image">No Image</div>
              )}
              <div>
                <p className="users-name">{user.name}</p>
                <p className="users-id">ID: {user.userID}</p> {/* Add user ID below the name */}
              </div>
            </div>
            <p className="users-email">{user.email}</p>
            <p className="users-role">{user.role}</p>
            <div className="users-action">
              <button className="edit-button" onClick={() => handleEdit(user)}>Edit</button>
              <button className="delete-button" onClick={() => handleDeleteClick(user)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      {isModalOpen && deleteUser && (
        <div className="prod-modal-overlay">
          <div className="prod-modal-content">
            <h2>Delete User</h2>
            <p>Are you sure you want to delete the following user? Warning: You cannot undo this action!</p>
            <div className="prod-modal-product-info">
              {deleteUser.profilePicture && deleteUser.profilePicture.data ? (
                <img
                  src={`data:${deleteUser.profilePicture.contentType};base64,${deleteUser.profilePicture.data}`}
                  alt="Profile"
                  className="prod-modal-product-image"
                />
              ) : (
                <div className="no-image">No Image</div>
              )}
              <p>{deleteUser.name}</p>
            </div>
            <div className="prod-modal-actions">
              <button className="prod-cancel-button3" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="prod-confirm-button3" onClick={confirmDelete}>Delete</button>
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

export default ManageUsers;