import { useState, useMemo } from 'react';

interface PaginationResult<T> {
  currentPage: number;
  totalPages: number;
  paginatedData: T[];
  setPage: (page: number) => void;
}

export function usePagination<T>(data: T[], itemsPerPage: number): PaginationResult<T> {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = useMemo(() => Math.ceil(data.length / itemsPerPage), [data.length, itemsPerPage]);
  
  // Ensure current page is valid when data changes
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  }
  
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  }, [data, currentPage, itemsPerPage]);
  
  const setPage = (page: number) => {
    if (page < 1) {
      setCurrentPage(1);
    } else if (page > totalPages) {
      setCurrentPage(totalPages);
    } else {
      setCurrentPage(page);
    }
  };
  
  return {
    currentPage,
    totalPages,
    paginatedData,
    setPage
  };
}
