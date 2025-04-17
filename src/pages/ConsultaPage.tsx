import React, { useState } from 'react';
import { Search, AlertCircle, CheckCircle, User, Phone, Calendar, MapPin, Briefcase } from 'lucide-react';
import { validateCPF } from '../utils/validators';

interface CPFConsultaResult {
  cpf: string;
  nome: string;
  dataNascimento: string;
  telefone: string;
  endereco: string;
  profissao: string;
  situacao: 'regular' | 'irregular' | 'pendente';
}

const ConsultaPage: React.FC = () => {
  const [cpf, setCpf] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CPFConsultaResult | null>(null);

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers and format as CPF
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length <= 11) {
      // Format as CPF: 123.456.789-00
      if (value.length > 9) {
        value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
      } else if (value.length > 6) {
        value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
      } else if (value.length > 3) {
        value = value.replace(/(\d{3})(\d{1,3})/, '$1.$2');
      }
      setCpf(value);
    }
  };

  const handleConsulta = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate CPF format
    const cleanCPF = cpf.replace(/\D/g, '');
    if (cleanCPF.length !== 11) {
      setError('CPF deve conter 11 dígitos');
      setResult(null);
      return;
    }

    // Validate CPF algorithm
    if (!validateCPF(cpf)) {
      setError('CPF inválido');
      setResult(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Simulate API call
    setTimeout(() => {
      // Mock data for demonstration
      if (cleanCPF === '52998224725') {
        setResult({
          cpf: '529.982.247-25',
          nome: 'João da Silva',
          dataNascimento: '15/05/1985',
          telefone: '(11) 98765-4321',
          endereco: 'Av. Paulista, 1000, São Paulo - SP',
          profissao: 'Engenheiro de Software',
          situacao: 'regular'
        });
      } else {
        setResult({
          cpf: cpf,
          nome: 'Maria Oliveira Santos',
          dataNascimento: '22/10/1990',
          telefone: '(21) 99876-5432',
          endereco: 'Rua das Flores, 123, Rio de Janeiro - RJ',
          profissao: 'Advogada',
          situacao: Math.random() > 0.5 ? 'regular' : 'irregular'
        });
      }
      
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Consulta de CPF</h1>
        <p className="text-gray-600 mb-6">
          Consulte informações detalhadas de um CPF no banco de dados.
        </p>

        <form onSubmit={handleConsulta}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-grow">
              <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 mb-1">
                CPF
              </label>
              <input
                type="text"
                id="cpf"
                value={cpf}
                onChange={handleCPFChange}
                placeholder="000.000.000-00"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={14}
              />
            </div>
            <div className="sm:self-end">
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                disabled={isLoading || cpf.replace(/\D/g, '').length !== 11}
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : (
                  <Search className="h-5 w-5 mr-2" />
                )}
                Consultar
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {result && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Resultado da Consulta</h2>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              result.situacao === 'regular' 
                ? 'bg-green-100 text-green-800' 
                : result.situacao === 'irregular'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
            }`}>
              {result.situacao === 'regular' ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Regular
                </>
              ) : result.situacao === 'irregular' ? (
                <>
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Irregular
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Pendente
                </>
              )}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start">
                <User className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Nome Completo</p>
                  <p className="font-medium">{result.nome}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Data de Nascimento</p>
                  <p className="font-medium">{result.dataNascimento}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Phone className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Telefone</p>
                  <p className="font-medium">{result.telefone}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Endereço</p>
                  <p className="font-medium">{result.endereco}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Briefcase className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Profissão</p>
                  <p className="font-medium">{result.profissao}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="h-5 w-5 flex items-center justify-center text-gray-500 mr-3 mt-0.5">
                  <span className="text-xs font-bold">CPF</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Número do CPF</p>
                  <p className="font-medium">{result.cpf}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Histórico de Consultas</h3>
            <div className="bg-gray-50 rounded-md p-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Última consulta:</span>
                <span className="font-medium">{new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between items-center text-sm mt-2">
                <span className="text-gray-500">Consultas nos últimos 30 dias:</span>
                <span className="font-medium">3</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultaPage;
