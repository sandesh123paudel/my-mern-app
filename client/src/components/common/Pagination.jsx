// This is a simplified example of what your Pagination component should do.
// You will need to implement this logic within your actual file.

import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  // Don't render the component if there is only one page
  if (totalPages <= 1) {
    return null;
  }

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <nav className="flex items-center justify-center space-x-2 p-4 border-t border-gray-200">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 rounded-md text-gray-500 bg-gray-100 disabled:opacity-50"
      >
        Previous
      </button>

      {/* Page Numbers */}
      {pageNumbers.map(number => (
        <button
          key={number}
          onClick={() => onPageChange(number)}
          className={`px-3 py-1 rounded-md ${
            currentPage === number
              ? 'bg-amber-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {number}
        </button>
      ))}

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 rounded-md text-gray-500 bg-gray-100 disabled:opacity-50"
      >
        Next
      </button>
    </nav>
  );
};

export default Pagination;