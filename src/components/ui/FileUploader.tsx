import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  id?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  accept = '.xlsx,.xls',
  id = 'file-upload'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Style indication for drag over can be added here if needed
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    // Themed dropzone area
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
        isDragging
          ? 'border-primary-light dark:border-primary-dark bg-blue-50 dark:bg-blue-900/30' // Highlight on drag
          : 'border-border-light dark:border-border-dark hover:border-gray-400 dark:hover:border-gray-500'
      }`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <FileSpreadsheet className="h-12 w-12 mx-auto text-text-secondary-light dark:text-text-secondary-dark mb-4" />
      <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">
        Arraste e solte seu arquivo Excel aqui ou clique para selecionar
      </p>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept={accept}
        id={id}
      />
      {/* Themed button */}
      <label
        htmlFor={id}
        className="inline-flex items-center px-4 py-2 bg-primary-light dark:bg-primary-dark text-white rounded-md hover:bg-primary-hover-light dark:hover:bg-primary-hover-dark cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-primary-light dark:focus-within:ring-primary-dark focus-within:ring-offset-2 dark:focus-within:ring-offset-background-dark"
      >
        <Upload className="h-5 w-5 mr-2" />
        Selecionar Arquivo
      </label>
      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-2">Aceita .xlsx e .xls</p>
    </div>
  );
};

export default FileUploader;
