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
    // Check if the leave target is outside the dropzone
    if (e.relatedTarget && !(e.currentTarget as Node).contains(e.relatedTarget as Node)) {
        setIsDragging(false);
    } else if (!e.relatedTarget) { // Handle leaving the browser window
        setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true); // Ensure dragging state stays true while over
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && (!accept || accept.split(',').some(type => file.name.endsWith(type.trim())))) { // Basic accept check on drop
      onFileSelect(file);
    } else if (file) {
        // Optionally show an error if the dropped file type is wrong
        console.warn("Dropped file type not accepted:", file.type);
    }
  };

  return (
    // Themed dropzone area
    <div
      className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ease-in-out ${ // Increased rounding
        isDragging
          ? 'border-primary-light dark:border-primary-dark bg-primary-light/10 dark:bg-primary-dark/20 scale-105 shadow-lg' // Enhanced highlight on drag
          : 'border-border-light dark:border-border-dark hover:border-primary-light/50 dark:hover:border-primary-dark/50 hover:bg-muted-light/50 dark:hover:bg-muted-dark/30' // Subtle hover
      }`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <FileSpreadsheet className={`h-12 w-12 mx-auto mb-4 transition-colors duration-300 ${isDragging ? 'text-primary-light dark:text-primary-dark' : 'text-text-secondary-light dark:text-text-secondary-dark'}`} />
      <p className={`mb-4 transition-colors duration-300 ${isDragging ? 'text-primary-light dark:text-primary-dark font-medium' : 'text-text-secondary-light dark:text-text-secondary-dark'}`}>
        {isDragging ? 'Solte o arquivo aqui!' : 'Arraste e solte seu arquivo Excel aqui ou clique para selecionar'}
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
        className="inline-flex items-center px-5 py-2.5 bg-primary-light dark:bg-primary-dark text-white rounded-lg text-sm font-medium hover:bg-primary-hover-light dark:hover:bg-primary-hover-dark cursor-pointer transition-all duration-200 ease-in-out focus-within:ring-2 focus-within:ring-primary-light dark:focus-within:ring-primary-dark focus-within:ring-offset-2 dark:focus-within:ring-offset-background-dark shadow-sm hover:shadow-md" // Adjusted padding, added shadow
      >
        <Upload className="h-5 w-5 mr-2" />
        Selecionar Arquivo
      </label>
      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-3">Aceita .xlsx e .xls</p>
    </div>
  );
};

export default FileUploader;
