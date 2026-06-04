export default function SectionIndicator({ currentSection, totalSections }) {
  return (
    <div className="section-indicator">
      {Array.from({ length: totalSections }).map((_, index) => (
        <div
          key={index}
          className={`indicator-dot ${index === currentSection ? 'active' : ''}`}
          aria-label={`Section ${index + 1}`}
        />
      ))}
    </div>
  );
}
