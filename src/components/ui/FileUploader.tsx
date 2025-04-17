import React, { useRef } from 'react';
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

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
      <FileSpreadsheet className="h-12 w-12 mx-auto text-gray-400 mb-4" />
      <p className="text-gray-600 mb-4">
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
      <label
        htmlFor={id}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer transition-colors"
      >
        <Upload className="h-5 w-5 mr-2" />
        Selecionar Arquivo
      </label>
    </div>
  );
};

export default FileUploader;
