// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion'
import SkillTag from './SkillTag'

const ProjectCard = ({ title, description, tech, liveLink, sourceLink }) => {
  return (
    <motion.div 
      className="glass project-card"
      whileHover={{ y: -5, boxShadow: "0 10px 30px -10px rgba(0, 240, 255, 0.15)" }}
      transition={{ type: "spring", stiffness: 300 }}
      style={{
        padding: "2rem",
        borderRadius: "16px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        border: "1px solid rgba(255,255,255,0.05)"
      }}
    >
      <div>
        <h3 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#fff" }}>{title}</h3>
        <p style={{ color: "#a0a0a0", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>{description}</p>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {tech && tech.map((tag, index) => (
            <SkillTag key={index} skill={tag} />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: "auto" }}>
        {liveLink && (
          <a 
            href={liveLink} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              padding: "0.5rem 1rem",
              background: "rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "#fff",
              textDecoration: "none",
              fontSize: "0.9rem",
              border: "1px solid rgba(255,255,255,0.1)"
            }}
          >
            View Live
          </a>
        )}
        {sourceLink && sourceLink !== '#' && (
          <a 
            href={sourceLink} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              padding: "0.5rem 1rem",
              background: "transparent",
              borderRadius: "8px",
              color: "#a0a0a0",
              textDecoration: "none",
              fontSize: "0.9rem",
              border: "1px solid rgba(255,255,255,0.1)"
            }}
          >
            Source
          </a>
        )}
      </div>
    </motion.div>
  )
}

export default ProjectCard
