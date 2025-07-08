// filepath: /c:/marketplace/frontend/src/pages/ProfileSections/ProfileSection.jsx
import React from "react";

const ProfileSection = ({ updatedUser, handleInputChange, handleImageChange, handleSave, birthday, isEditingBirthday, setIsEditingBirthday }) => {
  const getProfilePictureSrc = () => {
    if (updatedUser.profilePicture instanceof File) {
      // Handle new uploads
      return URL.createObjectURL(updatedUser.profilePicture);
    } else if (
      updatedUser.profilePicture &&
      typeof updatedUser.profilePicture === "object" &&
      updatedUser.profilePicture.data
    ) {
      // Handle fetched profile picture
      return `data:${updatedUser.profilePicture.contentType};base64,${updatedUser.profilePicture.data}`;
    } else {
      // Fallback to default avatar
      return "/default-avatar.png";
    }
  };
  

  return (
    <div className="user-info">
      <div className="profile-picture-container">
        <label htmlFor="profilePicture">
          <img
            src={getProfilePictureSrc()}
            alt="Profile"
            className="profile-picture"
          />
          <input
            type="file"
            id="profilePicture"
            name="profilePicture"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: "none" }}
          />
        </label>
      </div>
      <div className="input-group">
        <label>Name</label>
        <input
          type="text"
          name="name"
          value={updatedUser.name}
          onChange={handleInputChange}
        />
      </div>
      <div className="input-group">
        <label>Email</label>
        <input
          type="email"
          name="email"
          value={updatedUser.email}
          onChange={handleInputChange}
          disabled
        />
      </div>
      <div className="input-group">
        <label>Phone Number</label>
        <input
          type="text"
          name="phoneNumber"
          value={updatedUser.phoneNumber}
          onChange={handleInputChange}
        />
      </div>
      <div className="input-group">
        <label>Gender</label>
        <div className="gender-options">
          <label>
            <input
              type="radio"
              name="gender"
              value="male"
              checked={updatedUser.gender === "male"}
              onChange={handleInputChange}
            />
            Male
          </label>
          <label>
            <input
              type="radio"
              name="gender"
              value="female"
              checked={updatedUser.gender === "female"}
              onChange={handleInputChange}
            />
            Female
          </label>
          <label>
            <input
              type="radio"
              name="gender"
              value="other"
              checked={updatedUser.gender === "other"}
              onChange={handleInputChange}
            />
            Other
          </label>
        </div>
      </div>
      <div className="input-group">
        <label>Birthday</label>
        {isEditingBirthday ? (
          <input
            type="date"
            name="birthday"
            value={birthday} // Use the birthday state
            onChange={handleInputChange}
          />
        ) : (
          <div>
            <span>{birthday}</span>
            <button
              type="button"
              className="change-button"
              onClick={() => setIsEditingBirthday(true)}
            >
              Change
            </button>
          </div>
        )}
      </div>

      <button className="save-button" onClick={handleSave}>
        Save Changes
      </button>
    </div>
  );
};

export default ProfileSection;