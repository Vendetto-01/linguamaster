// frontend/src/shared/modals/modalStyles.ts
import React from 'react';

export const modalStyles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  
  modal: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '8px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflowY: 'auto',
    position: 'relative'
  },
  
  formGroup: {
    marginBottom: '15px',
  },
  
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box' as 'border-box',
    transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
    fontFamily: 'inherit'
  },
  
  buttonGroup: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '25px',
    paddingTop: '15px',
    borderTop: '1px solid #dee2e6'
  },
  
  button: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    minWidth: '100px',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px'
  },
  
  saveButton: {
    backgroundColor: '#28a745',
    color: 'white',
  },
  
  deleteButton: {
    backgroundColor: '#dc3545',
    color: 'white',
  },
  
  cancelButton: {
    backgroundColor: '#6c757d',
    color: 'white',
  },
  
  warningButton: {
    backgroundColor: '#ffc107',
    color: '#212529',
  },
  
  primaryButton: {
    backgroundColor: '#007bff',
    color: 'white',
  }
};

// Hover effects için CSS-in-JS utility
export const addHoverEffect = (baseStyle: React.CSSProperties, hoverColor: string) => ({
  ...baseStyle,
  ':hover': {
    backgroundColor: hoverColor,
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
  }
});

// Focus styles için input utility
export const inputFocusStyles: React.CSSProperties = {
  ':focus': {
    borderColor: '#80bdff',
    outline: 0,
    boxShadow: '0 0 0 0.2rem rgba(0, 123, 255, 0.25)'
  }
};