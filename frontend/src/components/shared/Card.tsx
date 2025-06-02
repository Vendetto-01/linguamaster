// frontend/src/components/shared/Card.tsx
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  isSelected?: boolean;
  isClickable?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

const Card: React.FC<CardProps> = ({
  children,
  isSelected = false,
  isClickable = false,
  onClick,
  className = '',
  style = {},
  variant = 'default'
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    const variants = {
      default: { 
        backgroundColor: isSelected ? '#e8f5e8' : '#ffffff',
        borderColor: isSelected ? '#28a745' : '#e0e0e0'
      },
      success: { backgroundColor: '#d4edda', borderColor: '#c3e6cb' },
      warning: { backgroundColor: '#fff3cd', borderColor: '#ffeaa7' },
      danger: { backgroundColor: '#f8d7da', borderColor: '#f5c6cb' },
      info: { backgroundColor: '#e7f3ff', borderColor: '#bee5eb' }
    };
    return variants[variant];
  };

  const baseStyles: React.CSSProperties = {
    border: isSelected ? '2px solid' : '1px solid',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '15px',
    boxShadow: isSelected ? '0 4px 8px rgba(40, 167, 69, 0.2)' : '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease',
    cursor: isClickable ? 'pointer' : 'default',
    transform: isSelected ? 'translateY(-2px)' : 'none',
    ...getVariantStyles(),
    ...style
  };

  return (
    <div
      style={baseStyles}
      className={className}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (isClickable && !isSelected) {
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        if (isClickable && !isSelected) {
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
          e.currentTarget.style.transform = 'none';
        }
      }}
    >
      {children}
    </div>
  );
};

export default Card;