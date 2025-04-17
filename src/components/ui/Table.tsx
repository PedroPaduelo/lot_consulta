import React from 'react';

interface TableProps {
  headers: string[];
  children: React.ReactNode;
  className?: string;
}

const Table: React.FC<TableProps> = ({ headers, children, className = '' }) => {
  return (
    <div className={`overflow-x-auto border border-border-light dark:border-border-dark rounded-lg ${className}`}> {/* Added border and rounded */}
      <table className="min-w-full divide-y divide-border-light dark:divide-border-dark">
        <thead className="bg-muted-light dark:bg-muted-dark">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider"
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
