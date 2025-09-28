
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200/50 ${className}`}>
      {children}
    </div>
  );
};
