import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "../../styles/adminStyles/ManageCategories.css";
import { add } from "../../assets";

const ManageCategories = () => {
    const API_BASE_URL =
        (process.env.NODE_ENV === 'development'
            ? 'http://localhost:8800'
            : process.env.REACT_APP_API_BASE_URL
        ).replace(/\/$/, '');

    const [categories, setCategories] = useState([]);
    const [editingCategory, setEditingCategory] = useState(null);
    const [updatedCategory, setUpdatedCategory] = useState({
        name: "",
        description: "",
        parentCategoryID: "",
        image: null
    });
    const [previewImage, setPreviewImage] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteCategory, setDeleteCategory] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");
    const editSectionRef = useRef(null);

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

    const handleEditClick = (category) => {
        setEditingCategory(category);
        setUpdatedCategory({
            name: category.name,
            description: category.description,
            parentCategoryID: category.parentCategoryID || "",
            image: null
        });
        setPreviewImage(category.image ? `${API_BASE_URL}/${category.image}` : null);
    };

    useEffect(() => {
        if (editingCategory && editSectionRef.current) {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    }, [editingCategory]);

    const handleUpdateChange = (e) => {
        const { name, value } = e.target;
        setUpdatedCategory((prev) => ({ ...prev, [name]: value }));
    };

    const handleUpdateImageChange = (e) => {
        const file = e.target.files[0];
        setUpdatedCategory((prev) => ({ ...prev, image: file }));
        setPreviewImage(URL.createObjectURL(file));
    };

    const handleRemoveImage = () => {
        setUpdatedCategory((prev) => ({ ...prev, image: null }));
        setPreviewImage(null);
    };

    const handleUpdateClick = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("name", updatedCategory.name);
        formData.append("description", updatedCategory.description);
        formData.append("parentCategoryID", updatedCategory.parentCategoryID);
        if (updatedCategory.image !== null) {
            formData.append("image", updatedCategory.image);
        } else if (editingCategory.image) {
            formData.append("existingImage", editingCategory.image); // Ensure this field is correctly handled on the server
        }
    
        try {
            await axios.put(`${API_BASE_URL}/categories/${editingCategory.categoryID}`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });
            setSuccessMessage("Category updated successfully!");
            setTimeout(() => {
                setSuccessMessage("");
                window.location.reload(); // Refresh the page
            }, 3000); // Hide the message after 3 seconds
        } catch (err) {
            console.log(err);
            alert("Failed to update category.");
        }
    };

    const handleDeleteClick = (category) => {
        setDeleteCategory(category);
        setIsModalOpen(true);
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`${API_BASE_URL}/categories/${deleteCategory.categoryID}`);
            setCategories(categories.filter((category) => category.categoryID !== deleteCategory.categoryID));
            setIsModalOpen(false);
            setSuccessMessage("Category deleted successfully!");
            setTimeout(() => {
                setSuccessMessage("");
            }, 3000); // Hide the message after 3 seconds
        } catch (err) {
            console.log(err);
            alert("Failed to delete category.");
        }
    };

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleCancelEdit = () => {
        setEditingCategory(null);
        setUpdatedCategory({
            name: "",
            description: "",
            parentCategoryID: "",
            image: null
        });
        setPreviewImage(null);
    };

    const filteredCategories = categories.filter(
        (category) =>
            category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            category.categoryID.toString().includes(searchQuery)
    );

    // Sort categories: main categories first, then subcategories
    const sortedCategories = filteredCategories.sort((a, b) => {
        if (!a.parentCategoryID && b.parentCategoryID) return -1;
        if (a.parentCategoryID && !b.parentCategoryID) return 1;
        return 0;
    });

    return (
        <div className="manage-categories">
            <div className="header">
                <h2>Manage Categories</h2>
                <div className="header-actions">
                    <input
                        type="text"
                        placeholder="Search by name or ID"
                        value={searchQuery}
                        onChange={handleSearch}
                        className="search-bar"
                    />
                    <Link to="/admin/add-category" className="add-category-button">
                        <img src={add} alt="Add" className="button-icon" />
                        Add Category
                    </Link>
                </div>
            </div>
            {editingCategory && (
                <div className="edit-category-form" ref={editSectionRef}>
                    <div className="cat-form-header">
                        <div>
                            <p className="cat-kicker">Catalog / Edit</p>
                            <h2 className="cat-title">Edit Category</h2>
                            <p className="cat-subtitle">Update name, hierarchy, and imagery in one place.</p>
                        </div>
                        <div className="cat-pill">
                            <span className="cat-pill-label">Category ID</span>
                            <span className="cat-pill-value">{editingCategory.categoryID}</span>
                        </div>
                    </div>

                    <form className="cat-form" onSubmit={handleUpdateClick}>
                        <div className="cat-grid">
                            <div className="cat-card">
                                <div className="cat-field">
                                    <label htmlFor="cat-name">Name</label>
                                    <input
                                        id="cat-name"
                                        type="text"
                                        placeholder="e.g., Laptops & Computers"
                                        value={updatedCategory.name}
                                        onChange={handleUpdateChange}
                                        name="name"
                                    />
                                    <span className="cat-hint">Keep it clear and searchable.</span>
                                </div>

                                <div className="cat-field">
                                    <label htmlFor="cat-description">Description</label>
                                    <textarea
                                        id="cat-description"
                                        placeholder="Short summary to guide shoppers"
                                        value={updatedCategory.description}
                                        onChange={handleUpdateChange}
                                        name="description"
                                    />
                                </div>

                                <div className="cat-field">
                                    <label htmlFor="cat-parent">Parent Category</label>
                                    <select
                                        id="cat-parent"
                                        value={updatedCategory.parentCategoryID}
                                        onChange={handleUpdateChange}
                                        name="parentCategoryID"
                                    >
                                        <option value="">Main Category</option>
                                        {categories.filter(cat => !cat.parentCategoryID && cat.categoryID !== editingCategory.categoryID).map((cat) => (
                                            <option key={cat.categoryID} value={cat.categoryID}>{cat.name}</option>
                                        ))}
                                    </select>
                                    <span className="cat-hint">Nest under an existing category if needed.</span>
                                </div>
                            </div>

                            <div className="cat-card media">
                                <div className="cat-media-header">
                                    <div>
                                        <h3>Category Image</h3>
                                        <p>Use a clean, square image.</p>
                                    </div>
                                    <div className="cat-badge">{previewImage ? '1 image' : 'No image'}</div>
                                </div>

                                {previewImage && (
                                    <div className="cat-current-image">
                                        <img src={previewImage} alt={editingCategory.name} className="categoryImage-preview" />
                                        <button type="button" className="remove-image-button" onClick={handleRemoveImage}>
                                            X
                                        </button>
                                    </div>
                                )}

                                <label htmlFor="cat-image" className="cat-dropzone">
                                    <div>
                                        <p className="dropzone-title">Drag & drop or click to upload</p>
                                        <p className="dropzone-hint">PNG or JPG, square works best</p>
                                    </div>
                                    <input
                                        id="cat-image"
                                        type="file"
                                        onChange={handleUpdateImageChange}
                                        name="image"
                                        accept="image/*"
                                    />
                                </label>
                            </div>
                        </div>
                        <div className="cat-actions">
                            <button type="button" className="cat-edit-button" onClick={handleCancelEdit}>Cancel</button>
                            <button type="submit" className="cat-primary">Update Category</button>
                        </div>
                    </form>
                </div>
            )}
            <div className="categoryList">
                <div className="category-list-header">
                    <span className="category-column">Category</span>
                    <span className="category-id-column1">ID</span>
                    <span className="products-column1">Product(s)</span>
                    <span className="action-column">Action</span>
                </div>
                {sortedCategories.map((category) => (
                    <div key={category.categoryID} className="category-item">
                        <div className="category-info">
                            {category.image ? (
                                <img src={`${API_BASE_URL}/${category.image}`} alt={category.name} className="category-image" />
                            ) : (
                                <div className="no-image">No Image</div>
                            )}
                            <div>
                                <h3>{category.name} {category.parentCategoryID ? "" : <span className="main-category-label">(Main)</span>}</h3>
                                <p>{category.description}</p>
                            </div>
                        </div>
                        <span className="category-id-column">{category.categoryID}</span>
                        <span className="products-column">{category.productCount}</span>
                        <div className="category-actions action-column">
                            <button onClick={() => handleEditClick(category)} className="edit-button">Edit</button>
                            <button onClick={() => handleDeleteClick(category)} className="delete-button">Delete</button>
                        </div>
                    </div>
                ))}
            </div>
            {isModalOpen && deleteCategory && (
                <div className="prod-modal-overlay">
                    <div className="prod-modal-content">
                        <h2>Delete Category</h2>
                        <p>Are you sure you want to delete the following category? Warning: You cannot undo this action!</p>
                        <div className="prod-modal-product-info">
                            {deleteCategory.image ? (
                                <img src={`${API_BASE_URL}/${deleteCategory.image}`} alt={deleteCategory.name} className="prod-modal-product-image" />
                            ) : (
                                <div className="no-image">No Image</div>
                            )}
                            <p>{deleteCategory.name}</p>
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

export default ManageCategories;