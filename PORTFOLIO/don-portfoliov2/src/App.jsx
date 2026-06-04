import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './App.css'
import BackgroundShader from './components/BackgroundShader'
import FuzzyText from './components/FuzzyText'
import { ABOUT_CONTENT, PROJECTS, CONTACT_CONTENT, STATS } from './constants/content'

const SECTIONS = ['Hero', 'About', 'Skills', 'Education', 'Work', 'Contact'];

const App = () => {
  const [currentSection, setCurrentSection] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    let lastScroll = 0
    const handleWheel = (e) => {
      const now = Date.now()
      if (now - lastScroll < 800) return
      lastScroll = now

      if (e.deltaY > 30) {
        setCurrentSection(prev => Math.min(prev + 1, SECTIONS.length - 1))
      } else if (e.deltaY < -30) {
        setCurrentSection(prev => Math.max(prev - 1, 0))
      }
    }

    window.addEventListener('wheel', handleWheel)
    return () => window.removeEventListener('wheel', handleWheel)
  }, [])

  useEffect(() => {
    let touchStartY = 0
    let touchStartTime = 0

    const handleTouchStart = (e) => {
      touchStartY = e.changedTouches[0].screenY
      touchStartTime = Date.now()
    }

    const handleTouchEnd = (e) => {
      const touchEndY = e.changedTouches[0].screenY
      const diff = touchStartY - touchEndY
      const timeDiff = Date.now() - touchStartTime

      // Only trigger page change on quick swipes (< 300ms) with significant movement
      if (timeDiff < 300 && Math.abs(diff) > 80) {
        if (diff > 0) {
          setCurrentSection(prev => Math.min(prev + 1, SECTIONS.length - 1))
        } else {
          setCurrentSection(prev => Math.max(prev - 1, 0))
        }
      }
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

  const handleDownload = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(ABOUT_CONTENT.cvUrl);
      if (!response.ok) throw new Error('Failed to fetch PDF');
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('pdf')) throw new Error('Not a PDF file');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cv.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed: ' + error.message);
    }
  };

  return (
    <div className="app-container">
      <BackgroundShader />

      <AnimatePresence mode="wait">
        {/* HERO SECTION */}
        {currentSection === 0 && (
          <motion.section
            key="hero"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="section hero-section"
          >
            <div className="hero-content">
              <FuzzyText 
                baseIntensity={0.2} 
                hoverIntensity={0.5} 
                enableHover={true}
                fontSize={isMobile ? '2.2rem' : '4rem'}
                fontWeight={800}
                color="#fff"
              >
                HI, I'M DON SANTOS
              </FuzzyText>
              <p className="hero-subtitle">Full Stack Developer & AI Engineer</p>
              <p className="hero-tagline">Don't try. Do.</p>
            </div>
            
            <div className="scroll-indicator">
              <span>Scroll</span>
              <div className="scroll-line"></div>
            </div>
          </motion.section>
        )}

        {/* ABOUT SECTION */}
        {currentSection === 1 && (
          <motion.section
            key="about"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="section about-section"
          >
            <div className="about-container">
              <h2 className="section-title">About Me</h2>
              
              <div className="about-grid">
                <div className="about-image-container">
                  <img 
                    src="/profile.jpg" 
                    alt="Don Santos" 
                    className="about-image"
                  />
                </div>
                
                <div className="about-text">
                  {ABOUT_CONTENT.bio.split('\n\n').map((paragraph) => (
                    <p key={paragraph.slice(0, 32)} className="bio" style={{ marginBottom: '1.2rem' }}>{paragraph}</p>
                  ))}
                  
                  <button className="cv-btn" onClick={handleDownload}>
                    Download CV
                  </button>
                </div>
              </div>

              {/* STATS STRIP */}
              <div className="stats-strip" style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '1rem', margin: '2.5rem 0 0 0', textAlign: 'center' }}>
                {STATS.map((stat) => (
                  <div key={stat.label} className="stat-card" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.2rem' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent)' }}>{stat.value}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.25rem', letterSpacing: '1px' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {/* SKILLS SECTION */}
        {currentSection === 2 && (
          <motion.section
            key="skills"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="section skills-section"
          >
            <div className="skills-page-container">
              <h2 className="section-title">Skills & Competencies</h2>
              <div className="skills-container">
                <div className="skills-grid">
                  {ABOUT_CONTENT.skills.map((category) => (
                    <div key={category.category} className="skill-category">
                      <h4>{category.category}</h4>
                      <div className="skill-tags">
                        {category.items.map((skill) => (
                          <span key={skill.name} className="skill-tag">
                            {skill.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* EDUCATION SECTION */}
        {currentSection === 3 && (
          <motion.section
            key="education"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="section education-section"
          >
            <div className="education-page-container">
              <h2 className="section-title">Education</h2>
              <div className="education-grid">
                {ABOUT_CONTENT.education.map((edu) => (
                  <div key={edu.institution} className="education-item">
                    <div>
                      <h4>{edu.degree}</h4>
                      <p className="edu-meta">{edu.institution}</p>
                      <p className="edu-desc">{edu.description}</p>
                    </div>
                    {edu.modules && (
                      <div className="edu-modules">
                        {edu.modules.map((mod) => (
                          <span 
                            key={mod} 
                            className={edu.institution.includes('Johannesburg') ? "edu-module-tag-uj" : "edu-module-tag-se"}
                          >
                            {mod}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {/* PROJECTS SECTION */}
        {currentSection === 4 && (
          <motion.section
            key="work"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="section projects-section"
          >
            <div className="projects-container">
              <h2 className="section-title">Projects</h2>
              <div className="projects-grid">
                {PROJECTS.map((project) => (
                  <div key={project.id} className="project-card">
                    <h3>{project.title}</h3>
                    <p>{project.description}</p>
                    <div className="project-tech">
                      {project.tech.map((t) => (
                        <span key={t} className="tech-tag">{t}</span>
                      ))}
                    </div>
                    <a 
                      href={project.liveLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="project-btn"
                    >
                      View Project
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {/* CONTACT SECTION */}
        {currentSection === 5 && (
          <motion.section
            key="contact"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="section contact-section"
          >
            <div className="contact-container">
              <h2 className="section-title">{CONTACT_CONTENT.title}</h2>
              <p className="contact-subtitle">{CONTACT_CONTENT.subtitle}</p>
              
              <div className="contact-info">
                <a href={`mailto:${CONTACT_CONTENT.email}`} className="contact-link">
                  {CONTACT_CONTENT.email}
                </a>
                <a href={`tel:${CONTACT_CONTENT.phone}`} className="contact-link">
                  {CONTACT_CONTENT.phone}
                </a>
              </div>

              <div className="social-links">
                {CONTACT_CONTENT.links.map((link) => (
                  <a 
                    key={link.label} 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="social-btn"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Navigation Dots */}
      <nav className="nav-dots">
        {SECTIONS.map((section, i) => (
          <button
            key={section}
            className={`nav-dot ${currentSection === i ? 'active' : ''}`}
            onClick={() => setCurrentSection(i)}
            aria-label={`Go to ${section}`}
          />
        ))}
      </nav>
    </div>
  )
}

export default App
