import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "../../styles/adminStyles/ManageProducts.css";
import { add, outOfStock, warning } from "../../assets"; // Ensure the icon is correctly imported

const ManageProducts = () => {
    const API_BASE_URL =
        (process.env.NODE_ENV === 'development'
            ? 'http://localhost:8800'
            : process.env.REACT_APP_API_BASE_URL
        ).replace(/\/$/, '');

    const [products, setProducts] = useState([]);
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteProduct, setDeleteProduct] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/products`);
                setProducts(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchProducts();
    }, []);

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

    const handleDelete = (product) => {
        setDeleteProduct(product);
        setIsModalOpen(true);
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`${API_BASE_URL}/products/${deleteProduct.productID}`);
            setProducts(products.filter((product) => product.productID !== deleteProduct.productID));
            setIsModalOpen(false);
            setSuccessMessage("Product deleted successfully!");
            setTimeout(() => {
                setSuccessMessage("");
            }, 3000); // Hide the message after 3 seconds
        } catch (err) {
            console.error(err);
        }
    };

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    const filteredProducts = products.filter(
        (product) =>
            product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.productID.toString().includes(searchQuery)
    );

    const handleHighlightLowStock = (productID) => {
        const element = document.getElementById(`product-${productID}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            element.classList.add('highlight');
            setTimeout(() => {
                element.classList.remove('highlight');
            }, 2000);
        }
    };

    const outOfStockCount = products.filter(product => product.quantity === 0).length;
    const lowStockCount = lowStockProducts.length;
    const liveStockCount = products.filter(product => product.quantity > 0).length;

    return (
        <div className="manage-products">
            <div className="header-inventory">
                <h2>Inventory Dashboard</h2>
                <div className="inventory-container">
                    <div className="inventory-actions">
                        <div className="inventory-item">
                            <span className="inventory-number">{outOfStockCount}</span>
                            <span>Out of Stock</span>
                        </div>
                        <div className="inventory-item">
                            <span className="inventory-number">{lowStockCount}</span>
                            <span>Low Stock</span>
                        </div>
                        <div className="inventory-item">
                            <span className="inventory-number">{liveStockCount}</span>
                            <span>Live Stock</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="header">
                <h2>Manage Products</h2>
                <div className="header-actions">
                    <input
                        type="text"
                        placeholder="Search by name or ID"
                        value={searchQuery}
                        onChange={handleSearch}
                        className="search-bar"
                    />
                    <Link to="/admin/add" className="add-product-button">
                        <img src={add} alt="Add" className="button-icon" />
                        Add Product
                    </Link>
                </div>
            </div>
            {lowStockProducts.length > 0 && (
                <div className="low-stock-alert">
                    <h2>
                        <img src={warning} alt="Warning" className="warning-icon" />
                        Low Stock Alert
                    </h2>
                    <ul className="low-stock-list">
                        {lowStockProducts.map((product) => (
                            <li key={product.productID} onClick={() => handleHighlightLowStock(product.productID)}>
                                <div className="low-stock-item">
                                    <span className="product-name">{product.title}</span>
                                    <span className="product-quantity">{product.quantity} left</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <div className="product-list">
                <div className="product-list-header">
                    <span className="product-column">Product(s)</span>
                    <span className="sales-column">Sales</span>
                    <span className="price-column">Price</span>
                    <span className="stock-column">Stock</span>
                    <span className="action-column">Action</span>
                </div>
                {filteredProducts.map((product) => (
                    <div key={product.productID} id={`product-${product.productID}`} className="product-item">
                        <div className="product-info">
                            {product.images && product.images.length > 0 ? (
                                <img src={`${API_BASE_URL}/${product.images[0]}`} alt={product.title} className="product-image" />
                            ) : (
                                <div className="no-image">No Image</div>
                            )}
                            <div>
                                <h3>
                                    {product.title}
                                    {product.quantity === 0 && (
                                        <img src={outOfStock} alt="Out of Stock" className="out-of-stock-icon" />
                                    )}
                                </h3>
                                <p>ID: {product.productID}</p>
                            </div>
                        </div>
                        <span className="product-sales-column">{product.sold}</span>
                        <span className="product-price-column">₱{product.price}</span>
                        <span className="product-stock-column">{product.quantity}</span>
                        <div className="product-actions action-column">
                            <Link to={`/admin/update/${product.productID}`} className="edit-button">Edit</Link>
                            <button onClick={() => handleDelete(product)} className="delete-button">Delete</button>
                        </div>
                    </div>
                ))}
            </div>
            {isModalOpen && deleteProduct && (
                <div className="prod-modal-overlay">
                    <div className="prod-modal-content">
                        <h2>Delete Product</h2>
                        <p>Are you sure you want to delete the following product? If the product has a promotion, it will be removed from the promotion. Warning: You cannot undo this action!</p>
                        <div className="prod-modal-product-info">
                            {deleteProduct.images && deleteProduct.images.length > 0 ? (
                                <img src={`${API_BASE_URL}/${deleteProduct.images[0]}`} alt={deleteProduct.title} className="prod-modal-product-image" />
                            ) : (
                                <div className="no-image">No Image</div>
                            )}
                            <p>{deleteProduct.title}</p>
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

export default ManageProducts;