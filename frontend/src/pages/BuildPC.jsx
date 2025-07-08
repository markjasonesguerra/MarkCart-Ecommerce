import React, { useState } from "react";
import MainNav from "../components/MainNav";
import "../styles/BuildPC.css";

const BuildPC = (props) => {
  // state for mobile <img> src
  const [mobileSrc, setMobileSrc] = useState("/markbuild-mobile.png");

  // handler to swap to pic2
  const handleMobileClick = () => {
    setMobileSrc("/pic2.png");
  };

  return (
    <div>
      <MainNav {...props} />
      <div className="buildpc-container">
        <img
          src="/markbuild.png"
          alt="TekkBuild Screenshot (desktop)"
          className="desktop-img"
        />

        {/* mobile img uses state and onClick */}
        <img
          src={mobileSrc}
          alt="TekkBuild Screenshot (mobile)"
          className="mobile-img"
          onClick={handleMobileClick}
        />
      </div>
    </div>
  );
};

export default BuildPC;
