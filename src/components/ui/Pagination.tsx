import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange
}) => {
  const pageNumbers = [];

  // Calculate which page numbers to show
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);

  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  const buttonBaseClasses = "relative inline-flex items-center border text-sm font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed";
  const buttonShapeClasses = "px-4 py-2";
  const iconButtonShapeClasses = "px-2 py-2";
  const defaultButtonClasses = "bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark text-text-secondary-light dark:text-text-secondary-dark hover:bg-muted-light dark:hover:bg-muted-dark";
  const activeButtonClasses = "z-10 bg-primary-light dark:bg-primary-dark border-primary-light dark:border-primary-dark text-white dark:text-gray-900"; // Active page button

  return (
    // Added padding and border-top
    <div className="flex items-center justify-between px-4 py-3 sm:px-6 border-t border-border-light dark:border-border-dark mt-4">
      {/* Mobile View */}
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`${buttonBaseClasses} ${buttonShapeClasses} ${defaultButtonClasses} rounded-md`}
        >
          Anterior
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`${buttonBaseClasses} ${buttonShapeClasses} ${defaultButtonClasses} rounded-md ml-3`}
        >
          Próximo
        </button>
      </div>

      {/* Desktop View */}
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            Mostrando página <span className="font-medium text-text-primary-light dark:text-text-primary-dark">{currentPage}</span> de{' '}
            <span className="font-medium text-text-primary-light dark:text-text-primary-dark">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            {/* Previous Button */}
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`${buttonBaseClasses} ${iconButtonShapeClasses} ${defaultButtonClasses} rounded-l-md`}
            >
              <span className="sr-only">Anterior</span>
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>

            {/* First Page & Ellipsis */}
            {startPage > 1 && (
              <>
                <button
                  onClick={() => onPageChange(1)}
                  className={`${buttonBaseClasses} ${buttonShapeClasses} ${defaultButtonClasses}`}
                >
                  1
                </button>
                {startPage > 2 && (
                  <span className={`${buttonBaseClasses} ${buttonShapeClasses} ${defaultButtonClasses} cursor-default`}>
                    ...
                  </span>
                )}
              </>
            )}

            {/* Page Numbers */}
            {pageNumbers.map(number => (
              <button
                key={number}
                onClick={() => onPageChange(number)}
                className={`${buttonBaseClasses} ${buttonShapeClasses} ${
                  currentPage === number ? activeButtonClasses : defaultButtonClasses
                }`}
              >
                {number}
              </button>
            ))}

            {/* Last Page & Ellipsis */}
            {endPage < totalPages && (
              <>
                {endPage < totalPages - 1 && (
                  <span className={`${buttonBaseClasses} ${buttonShapeClasses} ${defaultButtonClasses} cursor-default`}>
                    ...
                  </span>
                )}
                <button
                  onClick={() => onPageChange(totalPages)}
                  className={`${buttonBaseClasses} ${buttonShapeClasses} ${defaultButtonClasses}`}
                >
                  {totalPages}
                </button>
              </>
            )}

            {/* Next Button */}
            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`${buttonBaseClasses} ${iconButtonShapeClasses} ${defaultButtonClasses} rounded-r-md`}
            >
              <span className="sr-only">Próximo</span>
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
