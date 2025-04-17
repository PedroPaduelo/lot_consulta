import React from 'react';
import Table from './ui/Table';
import StatusBadge from './ui/StatusBadge';
import Pagination from './ui/Pagination';

export interface CPFRecord {
  id: number; // Using index as temporary ID for display
  nome: string;
  cpf: string;
  telefone: string;
  isValid: boolean;
}

interface CPFTableProps {
  data: CPFRecord[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const CPFTable: React.FC<CPFTableProps> = ({
  data,
  currentPage,
  totalPages,
  onPageChange
}) => {
  return (
    // Themed container
    <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-md p-6 border border-border-light dark:border-border-dark">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark">Resultados da Validação</h2>
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
          CPFs foram limpos (pontuação removida) e zeros à esquerda foram adicionados quando necessário antes da validação.
        </p>
      </div>

      {/* Table component is already themed */}
      <Table headers={['CPF', 'NOME', 'TELEFONE', 'STATUS']}>
        {data.map((row) => (
          // Apply themed hover and specific background for invalid rows
          <tr key={row.id} className={`transition-colors duration-150 ${
              row.isValid
                ? 'hover:bg-muted-light dark:hover:bg-muted-dark'
                : 'bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50' // Specific invalid style
            }`}
          >
            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary-light dark:text-text-secondary-dark">
              {row.cpf}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
              {row.nome}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary-light dark:text-text-secondary-dark">
              {row.telefone}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              {/* StatusBadge is themed */}
              <StatusBadge isValid={row.isValid} />
            </td>
          </tr>
        ))}
      </Table>

      {/* Pagination component is already themed */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};

export default CPFTable;
