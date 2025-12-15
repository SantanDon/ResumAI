import { useState, useEffect } from 'react';

interface AsciiTextProps {
  text?: string;
  fps?: number;
  className?: string;
}

export const AsciiText: React.FC<AsciiTextProps> = ({
  fps = 8,  // Slower fps to make it more readable
  className = ''
}) => {
  const [currentText, setCurrentText] = useState('');

  useEffect(() => {
    // ASCII art representations of RESUMAI
    const frames = [
      // Frame 1: Scrambled
      `
  #%&@  !*^#$ @!#%  ?  > <~  {}    +    === 
 |  ? \\| !@#$/ _-|| | | |  \\/  |  / \\  |_ _|
 | |_) |  _| \\_?_ \\| | | | |\\/| | / _ \\  | | 
 |  _ <| |___ ___) | |_| | |  | |/ ___ \\ | | 
 |_| \\_\\_____|____/ \\___/|_|  |_/_/   \\_\\___|
`,
      // Frame 2: Less Scrambled
      `
  ____  !*^#$ ____  _   _ __  __    _    ___ 
 |  _ \\| !@#$/ ___|| | | |  \\/  |  / \\  |_ _|
 | |_) |  _| \\___ \\| | | | |\\/| | / _ \\  | | 
 |  _ <| |___ ___) | |_| | |  | |/ ___ \\ | | 
 |_| \\_\\_____|____/ \\___/|_|  |_/_/   \\_\\___|
`,
      // Frame 3: Almost There
      `
  ____  _____ ____  _   _ __  __    _    ___ 
 |  _ \\| ____/ ___|| | | |  \\/  |  / \\  |_ _|
 | |_) |  _| \\___ \\| | | | |\\/| | / _ \\  | | 
 |  _ <| |___ ___) | |_| | |  | |/ ___ \\ | | 
 |_| \\_\\_____|____/ \\___/|_|  |_/_/   \\_\\___|
`,
      // Frame 4: Final
      `
  ____  _____ ____  _   _ __  __    _    ___ 
 |  _ \\| ____/ ___|| | | |  \\/  |  / \\  |_ _|
 | |_) |  _| \\___ \\| | | | |\\/| | / _ \\  | | 
 |  _ <| |___ ___) | |_| | |  | |/ ___ \\ | | 
 |_| \\_\\_____|____/ \\___/|_|  |_/_/   \\_\\___|
`
    ];

    // Set initial text
    // Set initial text
    setCurrentText(frames[0]);

    // Use a single interval that ticks and manages state
    let tick = 0;
    const totalCycleTicks = frames.length + (3 * fps); // Frames + 3 seconds of pause
    
    const timer = setInterval(() => {
      tick++;
      const cycleTick = tick % totalCycleTicks;
      
      if (cycleTick < frames.length) {
        setCurrentText(frames[cycleTick]);
      } else {
        // During the pause, show the final frame
        setCurrentText(frames[frames.length - 1]);
      }
    }, 1000 / fps);

    return () => clearInterval(timer);
  }, [fps]);

  return (
    <pre className={`text-white font-mono text-sm sm:text-base leading-4 sm:leading-5 ${className}`}>
      {currentText}
    </pre>
  );
};