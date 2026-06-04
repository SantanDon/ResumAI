export default function WaveText({ children }) {
  const text = typeof children === 'string' ? children : '';
  const letters = text.split('');

  return (
    <span className="wave-text">
      {letters.map((letter, index) => (
        <span
          key={index}
          style={{ 
            animationDelay: `${index * 0.05}s`,
            // Potentially disable for very long strings on low-end
            animationIterationCount: letters.length > 20 ? 1 : 'infinite'
          }}
        >
          {letter === ' ' ? '\u00A0' : letter}
        </span>
      ))}
    </span>
  );
}
