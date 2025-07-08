import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "../../styles/adminStyles/ManageProducts.css"; // Import the CSS file

const Update = () => {
  const API_BASE_URL =
      (process.env.NODE_ENV === 'development'
          ? 'http://localhost:8800'
          : process.env.REACT_APP_API_BASE_URL
      ).replace(/\/$/, '');
  const { id } = useParams(); // Get productID from URL
  const [product, setProduct] = useState({
    title: "",
    description: "",
    price: "",
    quantity: 0,
    categoryID: "",
    discount: 0.0,
    images: [], // Array to hold multiple images
  });
  const [categories, setCategories] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [successMessage, setSuccessMessage] = useState(""); // Add success message state
  const navigate = useNavigate();

  // Fetch existing product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/products/${id}`);
        const productData = res.data;
        setProduct({ ...productData, images: [] }); // Initialize without image file
        setExistingImages(productData.images || []); // Set existing images
        console.log("Existing Images:", productData.images); // Log existing images
      } catch (err) {
        console.error("Error fetching product:", err);
      }
    };

    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/categories`);
        setCategories(res.data);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };

    fetchProduct();
    fetchCategories();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({ ...prev, [name]: value || "" })); // Ensure value is always defined
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setProduct((prev) => ({ ...prev, images: files }));

    // Generate image previews
    const previews = files.map(file => URL.createObjectURL(file));
    setPreviewImages(previews);
  };

  const handleRemoveImage = (index, isExisting = false) => {
    if (isExisting) {
      const newExistingImages = existingImages.filter((_, i) => i !== index);
      setExistingImages(newExistingImages);
    } else {
      const newImages = product.images.filter((_, i) => i !== index);
      const newPreviews = previewImages.filter((_, i) => i !== index);
      setProduct((prev) => ({ ...prev, images: newImages }));
      setPreviewImages(newPreviews);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append("title", product.title);
      formData.append("description", product.description);
      formData.append("price", product.price);
      formData.append("quantity", product.quantity || 0); // Default to 0 if not provided
      formData.append("categoryID", product.categoryID);
      formData.append("discount", product.discount || 0.0); // Default to 0.0 if not provided
      product.images.forEach((image) => {
        formData.append("images", image);
      });

      // Include existing images that were not removed
      formData.append("existingImages", JSON.stringify(existingImages));

      await axios.put(`${API_BASE_URL}/products/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccessMessage("Product updated successfully!");
      setTimeout(() => {
        setSuccessMessage("");
        navigate("/admin/products");
      }, 3000); // Hide the message after 3 seconds
    } catch (err) {
      console.error("Error updating product:", err);
      alert("Failed to update product.");
    }
  };

  const handleCancelEdit = () => {
    navigate("/admin/products");
  };

  return (
    <div className="formAdd-container">
      <h1>Update Product</h1>
      <form className="formAdd1" onSubmit={handleUpdate}>
        <label htmlFor="title">Title</label>
        <input
          type="text"
          id="title"
          placeholder="Title"
          value={product.title || ""}
          onChange={handleChange}
          name="title"
        />
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          placeholder="Description"
          value={product.description || ""}
          onChange={handleChange}
          name="description"
        />
        <label htmlFor="price">Price</label>
        <input
          type="number"
          id="price"
          placeholder="Price"
          value={product.price || ""}
          onChange={handleChange}
          name="price"
        />
        <label htmlFor="quantity">Quantity</label>
        <input
          type="number"
          id="quantity"
          placeholder="Quantity"
          value={product.quantity || 0}
          onChange={handleChange}
          name="quantity"
        />
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
        <label htmlFor="discount">Discount</label>
        <input
          type="number"
          id="discount"
          placeholder="Discount"
          value={product.discount || 0.0}
          onChange={handleChange}
          name="discount"
        />
        <label htmlFor="images">Images</label>
        <input
          type="file"
          id="images"
          multiple
          onChange={handleImageChange}
          accept="image/*"
        />
        <div className="image-preview-add">
          {existingImages.map((src, index) => (
            <div key={index} className="image-container">
              <img src={`${API_BASE_URL}/${src}`} alt={`Existing ${index}`} />
              <button type="button" className="removeImage-button" onClick={() => handleRemoveImage(index, true)}>X</button>
            </div>
          ))}
          {previewImages.map((src, index) => (
            <div key={index} className="image-container">
              <img src={src} alt={`Preview ${index}`} />
              <button type="button" className="removeImage-button" onClick={() => handleRemoveImage(index)}>X</button>
            </div>
          ))}
        </div>
        <div className="button-group">
          <button type="submit">Update Product</button>
          <button type="button" className="productCancel-button" onClick={handleCancelEdit}>Cancel</button>
        </div>
      </form>
      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}
    </div>
  );
};

export default Update;