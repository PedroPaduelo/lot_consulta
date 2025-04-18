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
        themeClasses = "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border border-green-300 dark:border-green-700"; // Adjusted dark bg, added border
        icon = <CheckCircle className="h-4 w-4 mr-1.5" />; // Increased margin
        text = "Regular";
        break;
      case 'irregular':
        themeClasses = "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border border-red-300 dark:border-red-700"; // Adjusted dark bg, added border
        icon = <AlertCircle className="h-4 w-4 mr-1.5" />; // Increased margin
        text = "Irregular";
        break;
      case 'pendente':
        themeClasses = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700"; // Adjusted dark bg, added border
        icon = <AlertCircle className="h-4 w-4 mr-1.5" />; // Increased margin
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
    <div className="space-y-8"> {/* Increased spacing */}
      {/* Themed consultation form card */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-card dark:shadow-card-dark p-6 border border-border-light dark:border-border-dark"> {/* Increased rounding, shadow */}
        <h1 className="text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">Consulta de CPF</h1> {/* Reduced margin */}
        <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6 text-sm"> {/* Smaller text */}
          Consulte informações detalhadas de um CPF no banco de dados (simulado).
        </p>

        <form onSubmit={handleConsulta}>
          <div className="flex flex-col sm:flex-row gap-4 items-end"> {/* Align items end */}
            <div className="flex-grow">
              <label htmlFor="cpf" className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1.5"> {/* Increased margin */}
                CPF
              </label>
              {/* Themed input */}
              <input
                type="text"
                id="cpf"
                value={cpf}
                onChange={handleCPFChange}
                placeholder="000.000.000-00"
                className="form-input w-full px-4 py-2 border-border-light dark:border-border-dark rounded-lg focus:border-primary-light focus:ring-primary-light dark:focus:border-primary-dark dark:focus:ring-primary-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark transition duration-150 ease-in-out" // Use form-input, rounded-lg
                maxLength={14}
              />
            </div>
            <div className="sm:self-end flex-shrink-0 w-full sm:w-auto"> {/* Ensure button doesn't shrink too much */}
              {/* Themed button */}
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 bg-primary-light dark:bg-primary-dark text-white rounded-lg font-semibold hover:bg-primary-hover-light dark:hover:bg-primary-hover-dark focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark focus:ring-offset-2 dark:focus:ring-offset-background-dark disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 ease-in-out shadow-sm hover:shadow-md" // Adjusted padding, rounded-lg, shadow
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
         <div className="text-center py-12"> {/* Increased padding */}
            <Spinner size="lg" />
            <p className="mt-4 text-text-secondary-light dark:text-text-secondary-dark">Consultando...</p> {/* Increased margin */}
          </div>
      )}

      {/* Themed result card */}
      {result && !isLoading && (
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-card dark:shadow-card-dark p-6 border border-border-light dark:border-border-dark"> {/* Increased rounding, shadow */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
            <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark">Resultado da Consulta</h2>
            {getSituacaoBadge(result.situacao)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5"> {/* Adjusted gap */}
            {/* Info Item */}
            <div className="flex items-start space-x-3"> {/* Added space */}
              <User className="h-5 w-5 text-text-secondary-light dark:text-text-secondary-dark mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Nome Completo</p>
                <p className="font-medium text-text-primary-light dark:text-text-primary-dark">{result.nome}</p>
              </div>
            </div>
            {/* Info Item */}
            <div className="flex items-start space-x-3"> {/* Added space */}
              <MapPin className="h-5 w-5 text-text-secondary-light dark:text-text-secondary-dark mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Endereço</p>
                <p className="font-medium text-text-primary-light dark:text-text-primary-dark">{result.endereco}</p>
              </div>
            </div>
             {/* Info Item */}
            <div className="flex items-start space-x-3"> {/* Added space */}
              <Calendar className="h-5 w-5 text-text-secondary-light dark:text-text-secondary-dark mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Data de Nascimento</p>
                <p className="font-medium text-text-primary-light dark:text-text-primary-dark">{result.dataNascimento}</p>
              </div>
            </div>
            {/* Info Item */}
            <div className="flex items-start space-x-3"> {/* Added space */}
              <Briefcase className="h-5 w-5 text-text-secondary-light dark:text-text-secondary-dark mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Profissão</p>
                <p className="font-medium text-text-primary-light dark:text-text-primary-dark">{result.profissao}</p>
              </div>
            </div>
            {/* Info Item */}
            <div className="flex items-start space-x-3"> {/* Added space */}
              <Phone className="h-5 w-5 text-text-secondary-light dark:text-text-secondary-dark mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Telefone</p>
                <p className="font-medium text-text-primary-light dark:text-text-primary-dark">{result.telefone}</p>
              </div>
            </div>
             {/* Info Item */}
             <div className="flex items-start space-x-3"> {/* Added space */}
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
          <div className="mt-8 pt-6 border-t border-border-light dark:border-border-dark"> {/* Increased margin */}
            <h3 className="text-lg font-medium text-text-primary-light dark:text-text-primary-dark mb-4">Histórico de Consultas (Simulado)</h3> {/* Increased margin */}
            <div className="bg-muted-light dark:bg-muted-dark rounded-lg p-4 border border-border-light dark:border-border-dark space-y-2"> {/* Rounded-lg, space-y */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-secondary-light dark:text-text-secondary-dark">Última consulta:</span>
                <span className="font-medium text-text-primary-light dark:text-text-primary-dark">{new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
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
