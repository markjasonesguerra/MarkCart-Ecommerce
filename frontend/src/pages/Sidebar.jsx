import React, { useMemo } from "react";
import "../styles/Sidebar.css";

const Sidebar = ({ selectedCategory, onCategoryChange, selectedSection, onSectionChange, user }) => {
  // Define sections and their subcategories
  const sections = useMemo(() => {
    const baseSections = [
      {
        id: "account",
        label: "My Account",
        subcategories: [
          { id: "profile", label: "Profile" },
          { id: "banks", label: "Banks & Cards" },
          { id: "addresses", label: "Addresses" },
          { id: "password", label: "Change Password" },
          { id: "privacy", label: "Privacy Settings" },
          { id: "notifications", label: "Notification Settings" },
        ],
      },
    ];

    if (user.role !== "Admin") {
      baseSections.push({
        id: "purchase",
        label: "My Purchase",
        subcategories: [
          { id: "all", label: "All" },
          { id: "toPay", label: "To Pay" },
          { id: "toShip", label: "To Ship" },
          { id: "toReceive", label: "To Receive" },
          { id: "completed", label: "Completed" },
          { id: "cancelled", label: "Cancelled" },
        ],
      });
    }

    return baseSections;
  }, [user.role]);

  const handleSectionChange = (sectionId) => {
    onSectionChange(sectionId);
    if (sectionId === "account") {
      onCategoryChange("profile");
    } else if (sectionId === "purchase") {
      onCategoryChange("all");
    }
  };

  return (
    <div className="sidebar">
      {sections.map((section) => (
        <div key={section.id} className="sidebar-section">
          {/* Section Header */}
          <div
            className={`section-header ${selectedSection === section.id ? "active" : ""}`}
            onClick={() => handleSectionChange(section.id)} // Select the section
          >
            {section.label}
          </div>

          {/* Show subcategories only if the section is selected */}
          {selectedSection === section.id && (
            <ul className="category-list">
              {section.subcategories.map((subcategory) => (
                <li
                  key={subcategory.id}
                  className={selectedCategory === subcategory.id ? "active" : ""}
                  onClick={() => onCategoryChange(subcategory.id)} // Select the subcategory
                >
                  {subcategory.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
};

export default Sidebar;