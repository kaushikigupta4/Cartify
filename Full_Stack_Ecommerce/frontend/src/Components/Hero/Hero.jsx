import React from "react";
import "./Hero.css";
import hero_image from "../Assets/hero_image.png";
import arrow_icon from "../Assets/arrow.png";

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-content">
        <div className="hero-text">
          <h4 className="tagline">Redefine Your Everyday Style</h4>
          <h1 className="headline">
            From brunch fits to <br /> party nights —
            <span className="highlight"> find looks that speak you.</span>
          </h1>
          <button className="cta-btn">
            Explore Collection
            <img src={arrow_icon} alt="arrow" />
          </button>
        </div>

        <div className="hero-image">
          <img src={hero_image} alt="Fashion Model" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
