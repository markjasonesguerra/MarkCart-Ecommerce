import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Sidebar from "./Sidebar";
import Footer from "../components/Footer";
import MainNav from "../components/MainNav";
import "../styles/ProfileDashboard.css";
import { successIcon, errorIcon } from "../assets";
import ProfileSection from "./ProfileSections/ProfileSection";
import BanksSection from "./ProfileSections/BanksSection";
import AddressesSection from "./ProfileSections/AddressesSection";
import ChangePasswordSection from "./ProfileSections/PasswordSection";
import NotificationsSection from "./ProfileSections/NotificationsSection";
import PrivacySection from "./ProfileSections/PrivacySection";
import OrdersSection from "./ProfileSections/OrdersSection";

const ProfileDashboard = ({ user, setUser }) => {
  const API_BASE_URL =
      (process.env.NODE_ENV === 'development'
          ? 'http://localhost:8800'
          : process.env.REACT_APP_API_BASE_URL
      ).replace(/\/$/, '');

  const location = useLocation();
  const navigate = useNavigate();

  // Extract the section and category from the query params
  const queryParams = new URLSearchParams(location.search);
  const initialSection = queryParams.get("section") || "account";
  const initialCategory = queryParams.get("category") || "profile";

  const [updatedUser, setUpdatedUser] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    profilePicture: null,
    gender: "",
    birthday: "",
  });
  const [birthday, setBirthday] = useState(""); // Separate state for birthday
  const [isEditingBirthday, setIsEditingBirthday] = useState(false); // State to control birthday edit mode
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [categories, setCategories] = useState([]);
  const [selectedSection, setSelectedSection] = useState(initialSection); // Default to account section
  const [orders, setOrders] = useState([]); // State to hold orders
  const [addresses, setAddresses] = useState([]); // State to hold addresses
  const [banks, setBanks] = useState([]); // State to hold banks and cards
  const [notifications, setNotifications] = useState({
    email: {
      account: true,
      orderUpdates: true,
      promotions: true,
      surveys: true,
    },
    sms: {
      account: true,
      promotions: true,
    },
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        //console.log("Fetching data for user:", user.id);

        // Fetch user data
        const userRes = await axios.get(`${API_BASE_URL}/profile/${user.id}`);
        //console.log("User data fetched:", userRes.data);
        setUpdatedUser(userRes.data);
        setBirthday(userRes.data.birthday ? userRes.data.birthday.split("T")[0] : "");
  
        // Fetch cart items count
        const cartRes = await axios.get(`${API_BASE_URL}/cart/${user.id}`);
        //console.log("Cart items count fetched:", cartRes.data.length);
        setCartItemsCount(cartRes.data.length);
  
        // Fetch categories
        const categoriesRes = await axios.get(`${API_BASE_URL}/categories`);
        //console.log("Categories fetched:", categoriesRes.data);
        setCategories(categoriesRes.data);
  
      // Fetch orders
      const ordersRes = await axios.get(
        `${API_BASE_URL}/orders/${user.id}?category=${selectedCategory}`
      );
      //console.log("Orders fetched for category:", selectedCategory, ordersRes.data);
      setOrders(ordersRes.data);

  
        // Fetch addresses
        const addressesRes = await axios.get(`${API_BASE_URL}/profile/addresses/${user.id}`);
        //console.log("Addresses fetched:", addressesRes.data);
        setAddresses(addressesRes.data);
  
        setError(null); // Reset errors on success
      } catch (err) {
        //console.error("Error fetching data:", err.response || err.message || err);
        setError("Failed to load data. Please try again.");
      }
    };
  
    fetchData();
  }, [user, selectedCategory]); // Add selectedCategory as a dependency

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdatedUser((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    if (name === "birthday") {
      setBirthday(value); // Update the birthday state
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setUpdatedUser((prevUser) => ({
      ...prevUser,
      profilePicture: file,
    }));
  };

  const handleSave = async () => {
    if (!updatedUser.name || !updatedUser.email || !updatedUser.phoneNumber || !updatedUser.gender || !birthday) {
      setError("All fields are required.");
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", updatedUser.name);
      formData.append("email", updatedUser.email);
      formData.append("phoneNumber", updatedUser.phoneNumber);
      formData.append("gender", updatedUser.gender);
      formData.append("birthday", birthday);

      if (updatedUser.profilePicture instanceof File) {
        formData.append("profilePicture", updatedUser.profilePicture);
      }

      const res = await axios.put(`${API_BASE_URL}/profile/${user.id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const updatedData = res.data;

      // Sync with MainNav immediately
      setUser((prevUser) => ({
        ...prevUser,
        ...updatedData,
      }));

      setSuccess("Profile updated successfully!");
      setError(null);

      // Hide the success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Failed to update profile. Please try again.", err);
      setError("Failed to update profile. Please try again.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDeleteProfile = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/users/${user.userID}`);
      // Perform any additional cleanup or redirection here
      localStorage.removeItem("user");
      setUser(null);
      alert("Account deleted successfully.");
      navigate("/login");
    } catch (err) {
      console.error("Failed to delete account:", err);
      alert("Failed to delete account. Please try again.");
    }
  };

  const handleSearchAndFilter = () => {
    navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleAddBank = () => {
    // Logic to add a new bank or card
  };

  const handleAddAddress = async (newAddress) => {
    setError(null);
    setLoading(true); // Start loading
  
    try {
      const res = await axios.post(`${API_BASE_URL}/profile/addresses/${user.id}`, newAddress);
  
      // Append the new address to the addresses state
      setAddresses((prevAddresses) => [...prevAddresses, res.data]);
  
      setSuccess("Address added successfully!");
      setTimeout(() => setSuccess(null), 3000); // Clear success message after 3 seconds
    } catch (err) {
      console.error("Failed to add address:", err.response?.data || err.message);
      setError("Failed to add address. Please try again.");
      setTimeout(() => setError(null), 3000); // Clear error message after 3 seconds
    } finally {
      setLoading(false); // Stop loading
    }
  };
  
  const handleEditAddress = async (addressID, updatedAddress) => {
    try {
        await axios.put(`${API_BASE_URL}/profile/addresses/${addressID}`, updatedAddress);
        setAddresses((prevAddresses) =>
            prevAddresses.map((address) =>
                address.addressID === addressID ? { ...address, ...updatedAddress } : address
            )
        );
        setSuccess("Address updated successfully!");
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
    } catch (err) {
        console.error("Failed to update address:", err);
        setError("Failed to update address. Please try again.");
    }
  };
  
  const handleDeleteAddress = async (addressID) => {
    try {
        await axios.delete(`${API_BASE_URL}/profile/addresses/${addressID}`);
        setAddresses((prevAddresses) => prevAddresses.filter((address) => address.addressID !== addressID));
        setSuccess("Address deleted successfully!");
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
    } catch (err) {
        console.error("Failed to delete address:", err);
        setError("Failed to delete address. Please try again.");
    }
  };

const handleSetPrimaryAddress = async (addressID) => {
  try {
      await axios.put(`${API_BASE_URL}/profile/addresses/set-primary/${addressID}`);
      setAddresses((prevAddresses) =>
          prevAddresses.map((address) =>
              address.addressID === addressID ? { ...address, isPrimary: true } : { ...address, isPrimary: false }
          )
      );
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      setSuccess("Address set as primary!");
  } catch (err) {
      console.error("Failed to set primary address:", err);
      setError("Failed to set primary address. Please try again.");
  }
};

const verifyOldPassword = async (oldPassword) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/verify-old-password/${user.id}`, {
      oldPassword,
    });
    console.log("Password verified successfully:", response.data);
  } catch (err) {
    console.error("Failed to verify old password:", err.response?.data || err.message);
    throw new Error(err.response?.data?.error || "Failed to verify old password.");
  }
};


const handleChangePassword = async (oldPassword, newPassword) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/change-password/${user.id}`, {
      oldPassword,
      newPassword,
    });
    console.log(response.data.message);
  } catch (err) {
    console.error("Failed to change password:", err.response?.data || err.message);
    throw new Error(err.response?.data.error || "Failed to change password.");
  }
};

  const handleNotificationChange = (type, category) => {
    setNotifications((prevState) => ({
      ...prevState,
      [type]: {
        ...prevState[type],
        [category]: !prevState[type][category],
      },
    }));
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    navigate(`/profile?section=${selectedSection}&category=${category}`);
  };

  const handleSectionChange = (section) => {
    setSelectedSection(section);
    if (section === "account") {
      handleCategoryChange("profile");
    } else if (section === "purchase") {
      handleCategoryChange("all");
    }
  };

  const renderContent = () => {

    if (selectedSection === "purchase") {
      return (
        <OrdersSection
          orders={orders}
          selectedCategory={selectedCategory}
          user={user}
        />
      );
    }


    if (selectedSection === "account") {
      switch (selectedCategory) {
        case "profile":
          return (
            <ProfileSection
              updatedUser={updatedUser}
              handleInputChange={handleInputChange}
              handleImageChange={handleImageChange}
              handleSave={handleSave}
              birthday={birthday}
              setBirthday={setBirthday}
              isEditingBirthday={isEditingBirthday}
              setIsEditingBirthday={setIsEditingBirthday}
            />
          );
        case "banks":
          return (
            <BanksSection
              banks={banks}
              handleAddBank={handleAddBank}
            />
          );
        case "addresses":
          return (
            <AddressesSection
              addresses={addresses}
              handleAddAddress={handleAddAddress}
              handleEditAddress={handleEditAddress}
              handleDeleteAddress={handleDeleteAddress}
              handleSetPrimaryAddress={handleSetPrimaryAddress}
            />
          );
        case "password":
          return (
            <ChangePasswordSection
              handleChangePassword={handleChangePassword}
              verifyOldPassword={verifyOldPassword} // Pass the verifyOldPassword function
            />
          );
        case "privacy":
          return (
            <PrivacySection
              handleDeleteProfile={handleDeleteProfile}
            />
          );
        case "notifications":
          return (
            <NotificationsSection
              notifications={notifications}
              handleNotificationChange={handleNotificationChange}
            />
          );
        default:
          return null;
      }
    }
    return null;
  };

  const getHeaderText = () => {
    if (selectedSection === "account") {
        switch (selectedCategory) {
            case "profile":
                return "Profile";
            case "banks":
                return "Banks & Cards";
            case "addresses":
                return "Addresses";
            case "password":
                return "Change Password";
            case "privacy":
                return "Privacy Settings";
            case "notifications":
                return "Notification Settings";
            default:
                return "My Account";
        }
    } else if (selectedSection === "purchase") {
        switch (selectedCategory) {
            case "all":
                return "All Purchases";
            case "toPay":
                return "To Pay";
            case "toShip":
                return "To Ship";
            case "toReceive":
                return "To Receive";
            case "completed":
                return "Completed";
            case "cancelled":
                return "Cancelled";
            default:
                return "My Purchase";
        }
    }
    return "";
};

  return (
    <div className="account-page">
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
      <div className="main-content">
        <Sidebar
          selectedSection={selectedSection}
          onSectionChange={handleSectionChange}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          user={user} // Pass the user prop to Sidebar
        />
        <div className="content">
          <h1>{getHeaderText()}</h1>
          {error && (
            <div className="error-message">
              <img src={errorIcon} alt="Error" className="error-icon" />
              {error} 
            </div>
          )}
          {success && (
            <div className="success-overlay">
              <div className="success-dialog">
                <img src={successIcon} alt="Success" className="success-icon" />
                {success}
              </div>
            </div>
          )}
          {renderContent()}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ProfileDashboard;