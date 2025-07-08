import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../styles/adminStyles/ManageProducts.css"; // Import the CSS file

const AddCategory = () => {
    const [category, setCategory] = useState({
        name: "",
        description: "",
        parentCategoryID: "",
        image: null
    });

    const API_BASE_URL =
        (process.env.NODE_ENV === 'development'
            ? 'http://localhost:8800'
            : process.env.REACT_APP_API_BASE_URL
        ).replace(/\/$/, '');

    const [categories, setCategories] = useState([]);
    const [previewImage, setPreviewImage] = useState(null);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState(""); // Add success message state
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/categories`);
                setCategories(res.data);
            } catch (err) {
                console.log(err);
            }
        };
        fetchCategories();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCategory((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setCategory((prev) => ({ ...prev, image: file }));

        // Generate image preview
        const preview = URL.createObjectURL(file);
        setPreviewImage(preview);
    };

    const handleRemoveImage = () => {
        setCategory((prev) => ({ ...prev, image: null }));
        setPreviewImage(null);
    };

    const handleClick = async (e) => {
        e.preventDefault();
        if (!category.name) {
            setError("Category Name is required");
            return;
        }
        if (!category.description) {
            setError("Category Description is required");
            return;
        }
        if (!category.image) {
            setError("Category Image is required");
            return;
        }

        const formData = new FormData();
        formData.append("name", category.name);
        formData.append("description", category.description);
        formData.append("parentCategoryID", category.parentCategoryID || "");
        if (category.image) {
            formData.append("image", category.image);
        }

        try {
            await axios.post(`${API_BASE_URL}/categories`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });
            setSuccessMessage("Category added successfully!");
            setTimeout(() => {
                setSuccessMessage("");
                navigate("/admin/manage-categories");
            }, 3000); // Hide the message after 3 seconds
        } catch (err) {
            console.log(err);
            alert("Failed to add category.");
        }
    };

    const handleCancel = () => {
        navigate("/admin/manage-categories");
    };

    return (
        <div className="formAdd-container">
            <h1>Add New Category</h1>
            {error && <p className="error-message">{error}</p>}
            <form className="formAdd">
                <label htmlFor="name">Category Name</label>
                <input
                    type="text"
                    id="name"
                    placeholder="Category Name"
                    onChange={handleChange}
                    name="name"
                    value={category.name}
                />
                <label htmlFor="description">Category Description</label>
                <textarea
                    id="description"
                    placeholder="Category Description"
                    onChange={handleChange}
                    name="description"
                    value={category.description}
                />
                <label htmlFor="parentCategoryID">Category Type</label>
                <select
                    id="parentCategoryID"
                    onChange={handleChange}
                    name="parentCategoryID"
                    value={category.parentCategoryID}
                    className="dropdown"
                >
                    <option value="">Main Category</option>
                    {categories.filter(cat => !cat.parentCategoryID).map((cat) => (
                        <option key={cat.categoryID} value={cat.categoryID}>{cat.name}</option>
                    ))}
                </select>
                <label htmlFor="image">Image</label>
                <input
                    type="file"
                    id="image"
                    onChange={handleImageChange}
                    accept="image/*"
                />
                {previewImage && (
                    <div className="image-preview-add">
                        <div className="image-container">
                            <img src={previewImage} alt="Preview" />
                            <button type="button" className="removeImage-button" onClick={handleRemoveImage}>X</button>
                        </div>
                    </div>
                )}
                <div className="formActions">
                    <button onClick={handleClick}>Add Category</button>
                    <button className="catAddButton" type="button" onClick={handleCancel}>Cancel</button>
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

export default AddCategory;