import React from 'react';

interface TableProps {
  headers: string[];
  children: React.ReactNode;
  className?: string;
}

const Table: React.FC<TableProps> = ({ headers, children, className = '' }) => {
  return (
    // Added shadow-sm for subtle depth
    <div className={`overflow-x-auto border border-border-light dark:border-border-dark rounded-lg shadow-sm ${className}`}>
      <table className="min-w-full divide-y divide-border-light dark:divide-border-dark">
        {/* Slightly darker header, bolder text */}
        <thead className="bg-muted-light/60 dark:bg-muted-dark/60">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                scope="col"
                className="px-6 py-3.5 text-left text-xs font-semibold text-text-primary-light dark:text-text-primary-dark uppercase tracking-wider" // Increased py, font-semibold, adjusted text color
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        {/* Apply surface color to tbody */}
        <tbody className="bg-surface-light dark:bg-surface-dark divide-y divide-border-light dark:divide-border-dark">
          {children}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
