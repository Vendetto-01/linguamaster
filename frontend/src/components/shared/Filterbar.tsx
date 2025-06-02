// frontend/src/components/shared/FilterBar.tsx
import React from 'react';
import Button from './Button';

interface FilterField {
  type: 'text' | 'select' | 'checkbox';
  key: string;
  label: string;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  value: string | boolean;
  onChange: (value: string | boolean) => void;
  width?: string;
}

interface FilterBarProps {
  fields: FilterField[];
  onSearch: () => void;
  onClear?: () => void;
  extraActions?: React.ReactNode;
  className?: string;
}

const FilterBar: React.FC<FilterBarProps> = ({
  fields,
  onSearch,
  onClear,
  extraActions,
  className = ''
}) => {
  const renderField = (field: FilterField) => {
    const commonStyles: React.CSSProperties = {
      width: field.width || '100%',
      padding: '8px 12px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '14px'
    };

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={field.value as string}
            onChange={(e) => field.onChange(e.target.value)}
            placeholder={field.placeholder}
            style={commonStyles}
          />
        );

      case 'select':
        return (
          <select
            value={field.value as string}
            onChange={(e) => field.onChange(e.target.value)}
            style={commonStyles}
          >
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id={field.key}
              checked={field.value as boolean}
              onChange={(e) => field.onChange(e.target.checked)}
              style={{ transform: 'scale(1.2)' }}
            />
            <label htmlFor={field.key} style={{ fontSize: '14px', fontWeight: 'bold' }}>
              {field.label}
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={className}
      style={{
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}
    >
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          onSearch();
        }}
        style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'end' }}
      >
        {/* Filter Fields */}
        {fields.map(field => (
          <div key={field.key} style={{ flex: field.type === 'text' ? '1' : undefined, minWidth: field.width || '120px' }}>
            {field.type !== 'checkbox' && (
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
                {field.label}:
              </label>
            )}
            {renderField(field)}
          </div>
        ))}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'end' }}>
          <Button type="submit" variant="primary" size="medium">
            🔍 Ara
          </Button>
          
          {onClear && (
            <Button onClick={onClear} variant="secondary" size="medium">
              🗑️ Temizle
            </Button>
          )}
        </div>
      </form>

      {/* Extra Actions */}
      {extraActions && (
        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #dee2e6' }}>
          {extraActions}
        </div>
      )}
    </div>
  );
};

export default FilterBar;