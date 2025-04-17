/**
 * Validates a Brazilian CPF number
 * @param cpf CPF number (can be formatted or just digits)
 * @returns boolean indicating if the CPF is valid
 */
export function validateCPF(cpf: string): boolean {
  // Remove non-numeric characters
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Check if it has 11 digits
  if (cleanCPF.length !== 11) {
    return false;
  }
  
  // Check if all digits are the same (invalid CPF)
  if (/^(\d)\1+$/.test(cleanCPF)) {
    return false;
  }
  
  // Validate first verification digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  
  if (parseInt(cleanCPF.charAt(9)) !== digit1) {
    return false;
  }
  
  // Validate second verification digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  
  return parseInt(cleanCPF.charAt(10)) === digit2;
}

/**
 * Formats a CPF number with dots and dash
 * @param cpf CPF number (only digits)
 * @returns Formatted CPF (e.g., 123.456.789-00)
 */
export function formatCPF(cpf: string): string {
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length !== 11) return cpf;
  
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Cleans a CPF by removing non-numeric characters and adding leading zeros if needed
 * @param cpf CPF number (can be formatted or just digits)
 * @returns Cleaned CPF with 11 digits (with leading zeros if needed)
 */
export function cleanAndPadCPF(cpf: string): string {
  // Remove non-numeric characters
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Add leading zeros if needed to make it 11 digits
  return cleanCPF.padStart(11, '0');
}
