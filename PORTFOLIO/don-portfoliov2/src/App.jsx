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
                  {ABOUT_CONTENT.bio.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="bio" style={{ marginBottom: '1.2rem' }}>{paragraph}</p>
                  ))}
                  
                  <button className="cv-btn" onClick={handleDownload}>
                    Download CV
                  </button>
                </div>
              </div>

              {/* STATS STRIP */}
              <div className="stats-strip" style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '1rem', margin: '2.5rem 0 0 0', textAlign: 'center' }}>
                {STATS.map((stat, idx) => (
                  <div key={idx} className="stat-card" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.2rem' }}>
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
            <div className="about-container">
              <h2 className="section-title">Skills & Competencies</h2>
              <div className="skills-container" style={{ width: '100%', marginTop: '1rem' }}>
                <div className="skills-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1.5rem' }}>
                  {ABOUT_CONTENT.skills.map((category, i) => (
                    <div key={i} className="skill-category" style={{ padding: '1.5rem', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', textAlign: 'center' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.25rem' }}>{category.category}</h4>
                      <div className="skill-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                        {category.items.map((skill, j) => (
                          <span key={j} className="skill-tag" style={{ padding: '0.4rem 0.8rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '20px', fontSize: '0.8rem' }}>{skill.name}</span>
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
              <div className="education-grid" style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)' }}>
                {ABOUT_CONTENT.education.map((edu, i) => (
                  <div key={i} className="education-item" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '1.5rem', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                    <div>
                      <h4 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.25rem' }}>{edu.degree}</h4>
                      <p className="edu-meta" style={{ color: 'var(--accent)', fontWeight: '500', marginBottom: '0.75rem' }}>{edu.institution}</p>
                      <p className="edu-desc" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '1.5rem' }}>{edu.description}</p>
                    </div>
                    {edu.modules && (
                      <div className="edu-modules" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', justifyContent: 'center', marginTop: 'auto' }}>
                        {edu.modules.map((mod, j) => (
                          <span 
                            key={j} 
                            className="tech-tag" 
                            style={{ 
                              background: i === 0 ? 'rgba(209, 154, 154, 0.12)' : 'rgba(189, 231, 189, 0.12)', 
                              border: i === 0 ? '1px solid rgba(209, 154, 154, 0.25)' : '1px solid rgba(189, 231, 189, 0.25)',
                              borderRadius: '20px',
                              padding: '0.3rem 0.6rem',
                              fontSize: '0.75rem',
                              color: i === 0 ? '#d19a9a' : '#bde7bd'
                            }}
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
              <div className="projects-grid" style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)' }}>
                {PROJECTS.map((project, i) => (
                  <div key={i} className="project-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '1.5rem', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem', color: '#fff' }}>{project.title}</h3>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '1.25rem' }}>{project.description}</p>
                      <div className="project-tech" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.5rem' }}>
                        {project.tech.map((t, j) => (
                          <span key={j} className="tech-tag" style={{ background: 'rgba(209, 154, 154, 0.12)', border: '1px solid rgba(209, 154, 154, 0.25)', color: '#d19a9a', borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>{t}</span>
                        ))}
                      </div>
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
                {CONTACT_CONTENT.links.map((link, i) => (
                  <a 
                    key={i} 
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
        {SECTIONS.map((_, i) => (
          <button
            key={i}
            className={`nav-dot ${currentSection === i ? 'active' : ''}`}
            onClick={() => setCurrentSection(i)}
            aria-label={`Go to ${SECTIONS[i]}`}
          />
        ))}
      </nav>
    </div>
  )
}

export default App
