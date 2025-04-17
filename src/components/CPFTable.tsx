import React from 'react';
import Table from './ui/Table';
import StatusBadge from './ui/StatusBadge';
import Pagination from './ui/Pagination';

export interface CPFRecord {
  id: number;
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-800">Resultados da Validação</h2>
        <p className="text-sm text-gray-500 mt-1">
          CPFs foram limpos (pontuação removida) e zeros à esquerda foram adicionados quando necessário.
        </p>
      </div>

      <Table headers={['CPF', 'NOME', 'TELEFONE', 'STATUS']}>
        {data.map((row) => (
          <tr key={row.id} className={row.isValid ? '' : 'bg-red-50'}>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {row.cpf}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {row.nome}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {row.telefone}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <StatusBadge isValid={row.isValid} />
            </td>
          </tr>
        ))}
      </Table>

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
