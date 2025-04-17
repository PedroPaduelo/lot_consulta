import React, { useState } from 'react';
import { Search, AlertCircle, CheckCircle, User, Phone, Calendar, MapPin, Briefcase } from 'lucide-react';
import { validateCPF } from '../utils/validators';
import Alert from '../components/ui/Alert'; // Import Alert
import Spinner from '../components/ui/Spinner'; // Import Spinner

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
    setResult(null); // Clear previous results

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

  const getSituacaoBadge = (situacao: CPFConsultaResult['situacao']) => {
    let themeClasses = "";
    let icon = null;
    let text = "";

    switch (situacao) {
      case 'regular':
        themeClasses = "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
        icon = <CheckCircle className="h-4 w-4 mr-1" />;
        text = "Regular";
        break;
      case 'irregular':
        themeClasses = "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
        icon = <AlertCircle className="h-4 w-4 mr-1" />;
        text = "Irregular";
        break;
      case 'pendente':
        themeClasses = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
        icon = <AlertCircle className="h-4 w-4 mr-1" />;
        text = "Pendente";
        break;
    }
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${themeClasses}`}>
        {icon}
        {text}
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Themed consultation form card */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-md p-6 mb-6 border border-border-light dark:border-border-dark">
        <h1 className="text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">Consulta de CPF</h1>
        <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">
          Consulte informações detalhadas de um CPF no banco de dados (simulado).
        </p>

        <form onSubmit={handleConsulta}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-grow">
              <label htmlFor="cpf" className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1">
                CPF
              </label>
              {/* Themed input */}
              <input
                type="text"
                id="cpf"
                value={cpf}
                onChange={handleCPFChange}
                placeholder="000.000.000-00"
                className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark"
                maxLength={14}
              />
            </div>
            <div className="sm:self-end">
              {/* Themed button */}
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2 bg-primary-light dark:bg-primary-dark text-white rounded-md hover:bg-primary-hover-light dark:hover:bg-primary-hover-dark focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark focus:ring-offset-2 dark:focus:ring-offset-background-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                disabled={isLoading || cpf.replace(/\D/g, '').length !== 11}
              >
                {isLoading ? (
                  <Spinner size="sm" color="white" className="mr-2" />
                ) : (
                  <Search className="h-5 w-5 mr-2" />
                )}
                Consultar
              </button>
            </div>
          </div>
        </form>

        {/* Use themed Alert component */}
        {error && !isLoading && <Alert type="error" message={error} />}
      </div>

      {/* Loading State */}
      {isLoading && (
         <div className="text-center py-8">
            <Spinner size="lg" />
            <p className="mt-3 text-text-secondary-light dark:text-text-secondary-dark">Consultando...</p>
          </div>
      )}

      {/* Themed result card */}
      {result && !isLoading && (
        <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-md p-6 border border-border-light dark:border-border-dark">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
            <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark">Resultado da Consulta</h2>
            {getSituacaoBadge(result.situacao)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5"> {/* Adjusted gap */}
            {/* Info Item */}
            <div className="flex items-start">
              <User className="h-5 w-5 text-text-secondary-light dark:text-text-secondary-dark mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Nome Completo</p>
                <p className="font-medium text-text-primary-light dark:text-text-primary-dark">{result.nome}</p>
              </div>
            </div>
            {/* Info Item */}
            <div className="flex items-start">
              <MapPin className="h-5 w-5 text-text-secondary-light dark:text-text-secondary-dark mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Endereço</p>
                <p className="font-medium text-text-primary-light dark:text-text-primary-dark">{result.endereco}</p>
              </div>
            </div>
             {/* Info Item */}
            <div className="flex items-start">
              <Calendar className="h-5 w-5 text-text-secondary-light dark:text-text-secondary-dark mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Data de Nascimento</p>
                <p className="font-medium text-text-primary-light dark:text-text-primary-dark">{result.dataNascimento}</p>
              </div>
            </div>
            {/* Info Item */}
            <div className="flex items-start">
              <Briefcase className="h-5 w-5 text-text-secondary-light dark:text-text-secondary-dark mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Profissão</p>
                <p className="font-medium text-text-primary-light dark:text-text-primary-dark">{result.profissao}</p>
              </div>
            </div>
            {/* Info Item */}
            <div className="flex items-start">
              <Phone className="h-5 w-5 text-text-secondary-light dark:text-text-secondary-dark mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Telefone</p>
                <p className="font-medium text-text-primary-light dark:text-text-primary-dark">{result.telefone}</p>
              </div>
            </div>
             {/* Info Item */}
             <div className="flex items-start">
                <div className="h-5 w-5 flex items-center justify-center text-text-secondary-light dark:text-text-secondary-dark mr-3 mt-0.5 flex-shrink-0">
                  <span className="text-xs font-bold">CPF</span>
                </div>
                <div>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Número do CPF</p>
                  <p className="font-medium text-text-primary-light dark:text-text-primary-dark">{result.cpf}</p>
                </div>
              </div>
          </div>

          {/* Themed History Section */}
          <div className="mt-6 pt-6 border-t border-border-light dark:border-border-dark">
            <h3 className="text-lg font-medium text-text-primary-light dark:text-text-primary-dark mb-3">Histórico de Consultas (Simulado)</h3>
            <div className="bg-muted-light dark:bg-muted-dark rounded-md p-4 border border-border-light dark:border-border-dark">
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-secondary-light dark:text-text-secondary-dark">Última consulta:</span>
                <span className="font-medium text-text-primary-light dark:text-text-primary-dark">{new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between items-center text-sm mt-2">
                <span className="text-text-secondary-light dark:text-text-secondary-dark">Consultas nos últimos 30 dias:</span>
                <span className="font-medium text-text-primary-light dark:text-text-primary-dark">3</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultaPage;
