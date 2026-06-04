import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Stack Component - Simple card stack without framer-motion
 * Uses CSS transforms and transitions for smooth animations
 */
export default function Stack({ 
  children,
  cardDimensions = { width: 300, height: 400 },
  cardOffset = 12,
  scaleFactor = 0.06,
  isMobile = false
}) {
  const [cards, setCards] = useState(() => {
    const childArray = Array.isArray(children) ? children : [children];
    return childArray.map((child, index) => ({
      id: index,
      content: child
    }));
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showHint, setShowHint] = useState(true);
  const containerRef = useRef(null);
  const hintTimeoutRef = useRef(null);

  // Auto-hint animation
  useEffect(() => {
    if (cards.length > 1 && showHint) {
      hintTimeoutRef.current = setTimeout(() => {
        setShowHint(false);
      }, 4000); // Show hint for 4 seconds
    }
    
    return () => {
      if (hintTimeoutRef.current) {
        clearTimeout(hintTimeoutRef.current);
      }
    };
  }, [cards.length, showHint]);

  const sendToBack = useCallback((id) => {
    setCards((prev) => {
      const newCards = [...prev];
      const index = newCards.findIndex((card) => card.id === id);
      const [card] = newCards.splice(index, 1);
      newCards.unshift(card);
      return newCards;
    });
    setDragOffset({ x: 0, y: 0 });
  }, []);

  const handleStart = useCallback((clientX, clientY) => {
    setIsDragging(true);
    setShowHint(false); // Hide hint when user starts interacting
    setDragStart({ x: clientX, y: clientY });
  }, []);

  const handleMove = useCallback((clientX, clientY) => {
    if (!isDragging) return;
    setDragOffset(() => {
      const deltaX = clientX - dragStart.x;
      const deltaY = clientY - dragStart.y;
      return { x: deltaX, y: deltaY };
    });
  }, [isDragging, dragStart.x, dragStart.y]);

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // Use a functional update for dragOffset to avoid dependency on it
    setDragOffset((currentOffset) => {
      const threshold = 100;
      if (Math.abs(currentOffset.x) > threshold) {
        // Send top card to back
        const topCard = cards[cards.length - 1];
        if (topCard) {
          sendToBack(topCard.id);
        }
      }
      return { x: 0, y: 0 };
    });
  }, [isDragging, cards, sendToBack]);

  // Mouse event helper
  const handleMouseDown = (e) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  };

  // Touch event helper
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };

  // Add global event listeners
  useEffect(() => {
    const handleMouseUpLocal = () => handleEnd();
    const handleMouseMoveLocal = (e) => handleMove(e.clientX, e.clientY);
    const handleTouchMoveLocal = (e) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - dragStart.x;
      const deltaY = touch.clientY - dragStart.y;
      
      if (Math.abs(deltaX) > Math.abs(deltaY) + 10) {
        if (e.cancelable) e.preventDefault();
        handleMove(touch.clientX, touch.clientY);
      }
    };
    const handleTouchEndLocal = () => handleEnd();

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMoveLocal);
      document.addEventListener('mouseup', handleMouseUpLocal);
      document.addEventListener('touchmove', handleTouchMoveLocal, { passive: false });
      document.addEventListener('touchend', handleTouchEndLocal);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMoveLocal);
      document.removeEventListener('mouseup', handleMouseUpLocal);
      document.removeEventListener('touchmove', handleTouchMoveLocal);
      document.removeEventListener('touchend', handleTouchEndLocal);
    };
  }, [isDragging, dragStart.x, dragStart.y, handleMove, handleEnd]);

  const handleCardClick = (cardId, isTop) => {
    if (isTop && !isDragging) {
      sendToBack(cardId);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: cardDimensions.width,
        height: cardDimensions.height + 60,
        margin: '0 auto',
        userSelect: 'none'
      }}
    >
      {cards.map((card, index) => {
        const isTop = index === cards.length - 1;
        const stackIndex = cards.length - 1 - index;
        const scale = 1 - stackIndex * scaleFactor;
        
        // Refine offsets for mobile
        const effectiveOffset = isMobile ? cardOffset * 0.8 : cardOffset;
        const yOffset = stackIndex * -(effectiveOffset * 1.5); 
        const xOffset = stackIndex * (effectiveOffset * 1.5); 
        const rotation = isTop ? 0 : (stackIndex % 2 === 0 ? 4 : 2); 
        
        // Apply drag offset only to top card
        const transformX = (isTop && isDragging ? dragOffset.x : 0) + xOffset;
        const transformY = (isTop && isDragging ? dragOffset.y * 0.1 : 0) + yOffset;
        const dragRotation = isTop && isDragging ? dragOffset.x * 0.1 : 0;

        return (
          <div
            key={card.id}
            style={{
              position: 'absolute',
              width: cardDimensions.width,
              height: cardDimensions.height,
              borderRadius: '20px',
                // Espresso/Charcoal Material Background
                background: '#1a1715', 
                border: '1px solid var(--mat-border)',
                boxShadow: isTop 
                  ? '0 30px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.03)' 
                  : '0 20px 40px rgba(0, 0, 0, 0.5)',
              cursor: isTop ? (isDragging ? 'grabbing' : 'grab') : 'default',
              overflow: 'visible', // Crucial to prevent button/glow cutoff
              zIndex: index,
              transform: `
                translateX(${transformX}px) 
                translateY(${yOffset + transformY}px) 
                scale(${scale}) 
                rotate(${rotation + dragRotation}deg)
              `,
              transition: isDragging ? 'none' : 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              transformOrigin: 'center center',
              // Reactive border animation with hint
              animation: isTop && showHint && !isDragging 
                ? 'borderPulse 3s ease-in-out infinite, stackHint 3s ease-in-out infinite'
                : isTop 
                  ? 'borderPulse 3s ease-in-out infinite' 
                  : 'none'
            }}
            onMouseDown={isTop ? handleMouseDown : undefined}
            onTouchStart={isTop ? handleTouchStart : undefined}
            onClick={() => handleCardClick(card.id, isTop)}
          >
            <div style={{ 
              padding: '2rem', 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              pointerEvents: isTop ? 'auto' : 'none',
              position: 'relative'
            }}>
              {/* Subtle gradient overlay for depth */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '60px',
                background: 'linear-gradient(180deg, rgba(224, 122, 95, 0.1) 0%, transparent 100%)',
                borderRadius: '20px 20px 0 0',
                pointerEvents: 'none'
              }} />
              
              {card.content}
            </div>
            
            {/* Removed drag indicator as requested */}
          </div>
        );
      })}
      
      {/* Navigation Buttons for better mobile accessibility */}
      {cards.length > 1 && (
        <>
          <button 
            className="stack-nav-btn prev" 
            onClick={() => sendToBack(cards[cards.length - 1].id)}
            aria-label="Next project"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <button 
            className="stack-nav-btn next" 
            onClick={() => sendToBack(cards[cards.length - 1].id)}
            aria-label="Next project"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </>
      )}

      {/* Enhanced Instructions */}
      {cards.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: '-50px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <div style={{
            fontSize: '0.75rem',
            color: 'rgba(224, 122, 95, 0.8)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            fontWeight: '600',
            textAlign: 'center'
          }}>
            Featured Projects
          </div>
          <div style={{
            fontSize: '0.65rem',
            color: 'rgba(255, 255, 255, 0.6)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            whiteSpace: 'nowrap',
            textAlign: 'center'
          }}>
            Drag or use arrows to browse
          </div>
          <div style={{
            width: '60px',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, rgba(224, 122, 95, 0.5), transparent)',
            borderRadius: '1px',
            marginTop: '4px'
          }} />
        </div>
      )}
    </div>
  );
}
