import React, { useState, useEffect } from "react";
import axios from "axios";

const ManageReviews = () => {
    const API_BASE_URL =
        (process.env.NODE_ENV === 'development'
            ? 'http://localhost:8800'
            : process.env.REACT_APP_API_BASE_URL
        ).replace(/\/$/, '');
    const [reviews, setReviews] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/admin/reviews`);
                setReviews(res.data);
            } catch (err) {
                console.error("Error fetching reviews:", err);
                setError("Failed to fetch reviews. Please try again later.");
            }
        };
        fetchReviews();
    }, []);

    const handleDeleteReview = async (reviewID) => {
        try {
            await axios.delete(`${API_BASE_URL}/reviews/${reviewID}`);
            setReviews(reviews.filter((review) => review.reviewID !== reviewID));
            alert("Review deleted successfully.");
        } catch (err) {
            console.error("Error deleting review:", err);
            alert("Failed to delete review. Please try again later.");
        }
    };

    if (error) return <p>{error}</p>;

    return (
        <div>
            <h1>Manage Reviews</h1>
            {reviews.length > 0 ? (
                <table>
                    <thead>
                        <tr>
                            <th>Review ID</th>
                            <th>Product</th>
                            <th>User</th>
                            <th>Comment</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reviews.map((review) => (
                            <tr key={review.reviewID}>
                                <td>{review.reviewID}</td>
                                <td>{review.product}</td>
                                <td>{review.user}</td>
                                <td>{review.comment}</td>
                                <td>
                                    <button onClick={() => handleDeleteReview(review.reviewID)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>No reviews found.</p>
            )}
        </div>
    );
};

export default ManageReviews;
