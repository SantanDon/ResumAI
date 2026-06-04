import React, { useRef } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, useScroll, useTransform } from 'framer-motion';

// Import images directly to ensure Vite bundles them
import art1 from '../assets/gallery/art1.jpg';
import art2 from '../assets/gallery/art2.jpg';
import art3 from '../assets/gallery/art3.jpg';

const images = [art1, art2, art3];

const Gallery = () => {
  // Horizontal scroll effect container
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  const x = useTransform(scrollYProgress, [0, 1], ["1%", "-95%"]);

  return (
    <section ref={targetRef} style={{ height: "300vh", position: "relative" }}>
      <div style={{ 
        position: "sticky", 
        top: 0, 
        height: "100vh", 
        display: "flex", 
        alignItems: "center", 
        overflow: "hidden" 
      }}>
        <motion.div style={{ x, display: "flex", gap: "4rem", paddingLeft: "5vw" }}>
          {images.map((img, index) => (
            <motion.div 
              key={index}
              style={{ 
                minWidth: "60vw", 
                height: "70vh", 
                position: "relative",
                overflow: "hidden" 
              }}
              whileHover={{ scale: 0.98 }}
              transition={{ duration: 0.4 }}
            >
              <motion.img 
                src={img} 
                alt={`Artwork ${index + 1}`} 
                style={{ 
                  width: "100%", 
                  height: "100%", 
                  objectFit: "cover",
                  filter: "saturation(1.1) contrast(1.1)" 
                }}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.6 }}
              />
              <div className="glass" style={{
                position: "absolute",
                bottom: "2rem",
                left: "2rem",
                padding: "1rem 2rem",
                borderRadius: "4px"
              }}>
                <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>EXHIBIT 0{index + 1}</span>
              </div>
            </motion.div>
          ))}
          {/* Aesthetic "End of Gallery" marker */}
          <div style={{ 
            minWidth: "20vw", 
            height: "70vh", 
            display: "flex", 
            alignItems: "center",
            justifyContent: "center"
          }}>
            <span style={{ 
              writingMode: "vertical-rl", 
              fontSize: "4rem", 
              opacity: 0.1, 
              letterSpacing: "0.5rem" 
            }}>
              FIN
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Gallery;
