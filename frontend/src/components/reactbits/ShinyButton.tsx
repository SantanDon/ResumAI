import React from 'react';
import styled from 'styled-components';

interface ShinyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

const StyledButton = styled.button`
  --primary: hsl(200 100% 50%);
  --complimentary: hsl(0 100% 50%);
  border: 0;
  background: rgba(255, 255, 255, 0.05);
  width: fit-content;
  min-width: 180px;
  height: 58px;
  border-radius: 100px;
  color: hsl(0 0% 100%);
  cursor: pointer;
  font-weight: 500;
  position: relative;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: all 0.3s ease;
  font-family: "Geist Sans", "SF Pro Text", "SF Pro Icons", "AOS Icons", "Helvetica Neue", Helvetica, Arial, sans-serif, system-ui;
  padding: 0 2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
    border-color: rgba(255, 255, 255, 0.2);
    box-shadow: 0 10px 20px -10px rgba(0,0,0,0.5);
  }

  &:active {
    transform: scale(0.98);
  }

  /* Shimmer effect */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.1),
      transparent
    );
    transition: 0.5s;
  }

  &:hover::before {
    left: 100%;
  }
`;

export const ShinyButton: React.FC<ShinyButtonProps> = ({ children, className = '', ...props }) => {
  return (
    <StyledButton className={className} {...props}>
      {children}
    </StyledButton>
  );
};
