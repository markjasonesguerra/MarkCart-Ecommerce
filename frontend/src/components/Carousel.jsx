import React from "react";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css"; // Import carousel styles
import '../styles/Carousel.css';
const CustomCarousel = ({ images }) => {
    return (
        <Carousel showThumbs={false} autoPlay infiniteLoop>
            {images.map((image, index) => (
                <div key={index}>
                    <img src={image} alt={`Slide ${index + 1}`} />
                </div>
            ))}
        </Carousel>
    );
};

export default CustomCarousel;