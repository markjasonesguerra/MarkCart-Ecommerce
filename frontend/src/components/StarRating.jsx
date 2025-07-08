import React, { useState } from "react";
import "../styles/StarRating.css"; // Create this CSS file for styling
import { starfill, starunfilled } from "../assets"; // Ensure these paths are correct

const StarRating = ({ rating = 0, onRatingChange }) => {
  const [currentRating, setCurrentRating] = useState(rating);

  const handleClick = (newRating) => {
    console.log("Star clicked:", newRating);
    setCurrentRating(newRating);
    onRatingChange(newRating);
  };

  const getRatingLabel = (rating) => {
    switch (rating) {
      case 1:
        return "Terrible";
      case 2:
        return "Poor";
      case 3:
        return "Fair";
      case 4:
        return "Good";
      case 5:
        return "Amazing";
      default:
        return "";
    }
  };

  return (
    <div className="star-rating-container">
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <img
            key={star}
            src={star <= currentRating ? starfill : starunfilled}
            alt="star"
            className="star"
            onClick={() => handleClick(star)}
          />
        ))}
      </div>
      <div className="rating-label">{getRatingLabel(currentRating)}</div>
    </div>
  );
};

export default StarRating;