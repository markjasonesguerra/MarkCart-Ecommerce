import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../styles/adminStyles/ManageProducts.css";

const AddProduct = () => {
  const API_BASE_URL =
    (process.env.NODE_ENV === "development"
      ? "http://localhost:8800"
      : process.env.REACT_APP_API_BASE_URL
    ).replace(/\/$/, "");

  const [product, setProduct] = useState({
    title: "",
    description: "",
    price: "",
    quantity: 0,
    categoryID: "",
    discount: 0.0,
    images: [],
  });
  const [categories, setCategories] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/categories`);
        setCategories(res.data);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };

    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({ ...prev, [name]: value || "" }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setProduct((prev) => ({ ...prev, images: files }));

    const previews = files.map((file) => URL.createObjectURL(file));
    setPreviewImages(previews);
  };

  const handleRemoveImage = (index) => {
    const newImages = product.images.filter((_, i) => i !== index);
    const newPreviews = previewImages.filter((_, i) => i !== index);
    setProduct((prev) => ({ ...prev, images: newImages }));
    setPreviewImages(newPreviews);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append("title", product.title);
      formData.append("description", product.description);
      formData.append("price", product.price);
      formData.append("quantity", product.quantity || 0);
      formData.append("categoryID", product.categoryID);
      formData.append("discount", product.discount || 0.0);
      product.images.forEach((image) => {
        formData.append("images", image);
      });

      await axios.post(`${API_BASE_URL}/products`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccessMessage("Product added successfully!");
      setTimeout(() => {
        setSuccessMessage("");
        navigate("/admin/products");
      }, 3000);
    } catch (err) {
      console.error("Error adding product:", err);
      alert("Failed to add product.");
    }
  };

  const handleCancelAdd = () => {
    navigate("/admin/products");
  };

  return (
    <div className="add-product-page">
      <div className="formAdd-header">
        <div>
          <p className="formAdd-kicker">Inventory / Create</p>
          <h1 className="formAdd-title">Add Product</h1>
          <p className="formAdd-subtitle">Launch a new product with details, pricing, and media in one go.</p>
        </div>
        <div className="formAdd-pill">
          <span className="pill-label">Status</span>
          <span className="pill-value">Draft</span>
        </div>
      </div>

      <form className="formAdd1 update-form" onSubmit={handleAddProduct}>
        <div className="formAdd-grid">
          <div className="form-card">
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="title">Title</label>
                <input
                  type="text"
                  id="title"
                  placeholder="Product name"
                  value={product.title || ""}
                  onChange={handleChange}
                  name="title"
                />
                <span className="field-hint">Keep it concise and searchable.</span>
              </div>
              <div className="form-field">
                <label htmlFor="categoryID">Category</label>
                <select
                  id="categoryID"
                  value={product.categoryID || ""}
                  onChange={handleChange}
                  name="categoryID"
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.categoryID} value={category.categoryID}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <span className="field-hint">Group items for easier browsing.</span>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                placeholder="What makes this product great?"
                value={product.description || ""}
                onChange={handleChange}
                name="description"
              />
              <span className="field-hint">Highlight benefits, specs, and use cases.</span>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="price">Price</label>
                <input
                  type="number"
                  id="price"
                  placeholder="0.00"
                  value={product.price || ""}
                  onChange={handleChange}
                  name="price"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="form-field">
                <label htmlFor="discount">Discount (%)</label>
                <input
                  type="number"
                  id="discount"
                  placeholder="0"
                  value={product.discount || 0.0}
                  onChange={handleChange}
                  name="discount"
                  min="0"
                  step="0.1"
                />
              </div>
              <div className="form-field">
                <label htmlFor="quantity">Quantity</label>
                <input
                  type="number"
                  id="quantity"
                  placeholder="0"
                  value={product.quantity || 0}
                  onChange={handleChange}
                  name="quantity"
                  min="0"
                />
              </div>
            </div>
          </div>

          <div className="media-card">
            <div className="media-card-header">
              <div>
                <h3>Product Media</h3>
                <p>Add crisp shots to help shoppers decide.</p>
              </div>
              <div className="badge">{previewImages.length} images</div>
            </div>

            <label htmlFor="images" className="dropzone">
              <div>
                <p className="dropzone-title">Drag & drop or click to upload</p>
                <p className="dropzone-hint">JPG, PNG up to 5MB each</p>
              </div>
              <input
                type="file"
                id="images"
                multiple
                onChange={handleImageChange}
                accept="image/*"
              />
            </label>

            <div className="image-preview-add">
              {previewImages.map((src, index) => (
                <div key={`preview-${index}`} className="image-container">
                  <img src={src} alt={`Preview ${index}`} />
                  <button type="button" className="removeImage-button" onClick={() => handleRemoveImage(index)}>X</button>
                  <span className="image-pill fresh">New</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="button-group sticky-actions">
          <button type="button" className="productCancel-button" onClick={handleCancelAdd}>Cancel</button>
          <button type="submit" className="primary-button">Create Product</button>
        </div>
      </form>

      {successMessage && (
        <div className="success-message elevated">
          {successMessage}
        </div>
      )}
    </div>
  );
};

export default AddProduct;