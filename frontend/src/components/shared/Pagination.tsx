// frontend/src/components/shared/Pagination.tsx
import React from 'react';
import Button from './Button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showInfo?: boolean;
  maxVisiblePages?: number;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showInfo = true,
  maxVisiblePages = 5
}) => {
  if (totalPages <= 1) return null;

  const getVisiblePages = (): number[] => {
    const halfVisible = Math.floor(maxVisiblePages / 2);
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);

    // Adjust if we're near the beginning or end
    if (endPage - startPage + 1 < maxVisiblePages) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      } else {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      gap: '5px',
      margin: '20px 0'
    }}>
      {/* Previous Button */}
      <Button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        variant="secondary"
        size="small"
      >
        ← Önceki
      </Button>

      {/* First page if not visible */}
      {visiblePages[0] > 1 && (
        <>
          <Button
            onClick={() => onPageChange(1)}
            variant={1 === currentPage ? 'primary' : 'secondary'}
            size="small"
          >
            1
          </Button>
          {visiblePages[0] > 2 && (
            <span style={{ padding: '8px 4px', color: '#6c757d' }}>...</span>
          )}
        </>
      )}

      {/* Visible page numbers */}
      {visiblePages.map(pageNum => (
        <Button
          key={pageNum}
          onClick={() => onPageChange(pageNum)}
          variant={currentPage === pageNum ? 'primary' : 'secondary'}
          size="small"
        >
          {pageNum}
        </Button>
      ))}

      {/* Last page if not visible */}
      {visiblePages[visiblePages.length - 1] < totalPages && (
        <>
          {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
            <span style={{ padding: '8px 4px', color: '#6c757d' }}>...</span>
          )}
          <Button
            onClick={() => onPageChange(totalPages)}
            variant={totalPages === currentPage ? 'primary' : 'secondary'}
            size="small"
          >
            {totalPages}
          </Button>
        </>
      )}

      {/* Next Button */}
      <Button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        variant="secondary"
        size="small"
      >
        Sonraki →
      </Button>

      {/* Page Info */}
      {showInfo && (
        <span style={{ marginLeft: '15px', fontSize: '14px', color: '#666' }}>
          {currentPage} / {totalPages} sayfa
        </span>
      )}
    </div>
  );
};

export default Pagination;