import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { useState } from "react";

import BuildPC from "./pages/BuildPC";

import Products from "./pages/Products";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RequestPasswordReset from "./pages/RequestPasswordReset";
import ResetPassword from "./pages/ResetPassword";
import ProductDetails from "./pages/ProductDetails";
import ProfileDashboard from "./pages/ProfileDashboard";
import Checkout from "./pages/Checkout";
import ManageReviews from "./pages/AdminSections/ManageReviews";

// Import AdminSections
import AdminDashboard from "./pages/AdminSections/AdminDashboard";
import ManageProducts from "./pages/AdminSections/ManageProducts";
import AddCategory from "./pages/AdminSections/AddCategory";
import Add from "./pages/AdminSections/Add";
import Update from "./pages/AdminSections/Update";
import ManageCategories from "./pages/AdminSections/ManageCategories";
import ManageOrders from "./pages/AdminSections/ManageOrders";
import ManageUsers from "./pages/AdminSections/ManageUsers"; // Import ManageUsers component
import ManageVouchers from "./pages/AdminSections/ManageVouchers"; // Import ManageVouchers component
import AddVoucher from "./pages/AdminSections/AddVoucher"; // Import AddVoucher component
import AdminMessages from "./pages/AdminSections/AdminMessages";
import ChatWidget from "./components/ChatWidget";

import "./style.css";

function App() {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );

  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [categories, setCategories] = useState([]);

  const isAdmin = user && user.role === "Admin";

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Products user={user} setUser={setUser} />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/signup" element={<Register setUser={setUser} />} />
          <Route path="/cart" element={<Cart user={user} setUser={setUser} />} />
          <Route path="/request-password-reset" element={<RequestPasswordReset />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/product/:productID" element={<ProductDetails user={user} />} />
          <Route path="/checkout" element={<Checkout user={user} />} />
          <Route path="/products" element={<Products user={user} setUser={setUser} />} />
          {/* Pass the new props here */}
          <Route path="/build" element={ // buildf under construction, not finished yet
            <BuildPC
              user={user}
              cartItemsCount={cartItemsCount}
              categories={categories}
              setUser={setUser}
            />
          } />          {/* User Account Routes */}
          <Route path="/profile" element={<ProfileDashboard user={user} setUser={setUser} />} />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={isAdmin ? <AdminDashboard user={user} setUser={setUser} /> : <Navigate to="/login" />}
          >
            <Route
              path="products"
              element={isAdmin ? <ManageProducts /> : <Navigate to="/login" />}
            />
            <Route
              path="add"
              element={isAdmin ? <Add /> : <Navigate to="/login" />}
            />
            <Route
              path="update/:id"
              element={isAdmin ? <Update /> : <Navigate to="/login" />}
            />
            <Route
              path="add-category"
              element={isAdmin ? <AddCategory /> : <Navigate to="/login" />}
            />
            <Route
              path="manage-categories"
              element={isAdmin ? <ManageCategories /> : <Navigate to="/login" />}
            />
            <Route
              path="manage-orders"
              element={isAdmin ? <ManageOrders /> : <Navigate to="/login" />}
            />
            <Route
              path="manage-users"
              element={isAdmin ? <ManageUsers /> : <Navigate to="/login" />}
            />
            <Route
              path="messages"
              element={isAdmin ? <AdminMessages user={user} /> : <Navigate to="/login" />}
            />
            <Route
              path="manage-vouchers"
              element={isAdmin ? <ManageVouchers /> : <Navigate to="/login" />}
            />
            <Route
              path="add-voucher"
              element={isAdmin ? <AddVoucher /> : <Navigate to="/login" />}
            />
          </Route>
        </Routes>
        <ChatWidget user={user} />
      </BrowserRouter>
    </div>
  );
}

export default App;