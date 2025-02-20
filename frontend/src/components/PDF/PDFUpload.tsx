import React, { useRef, useState, useEffect } from 'react';

interface PDFUploadProps {
  onUpload: (file: File) => void;
}

type StatusType = 'idle' | 'loading' | 'success' | 'error';
interface StatusMessage {
  text: string;
  type: StatusType;
}


const PDFUpload: React.FC<PDFUploadProps> = ({ onUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<StatusType>('idle');
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [messageTimeout, setMessageTimeout] = useState<NodeJS.Timeout | null>(null);


  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
        if (messageTimeout) {
            clearTimeout(messageTimeout);
        }
    };
  }, [messageTimeout]);

  // Previous handlers remain the same...
  const preventDefaults = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrag = (e: React.DragEvent, isDraggingState: boolean) => {
    preventDefaults(e);
    setIsDragging(isDraggingState);
  };

  const handleDrop = async (e: React.DragEvent) => {
    preventDefaults(e);
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files[0];
    
    if (pdfFile) {
      await handleFile(pdfFile);
    }
  };

  // Updated file handling with better error handling and feedback
  const handleFile = async (file: File) => {

    // Clear any existing timeout
    if (messageTimeout) {
        clearTimeout(messageTimeout);
    }

    // Reset status
    setStatus('idle');
    setStatusMessage(null);


    // Validate file type
    if (!file.type.includes('pdf')) {
      setStatus('error');
      setStatusMessage({
          text: 'Only PDF files are allowed',
          type: 'error'
      });
      const timeout = setTimeout(() => {
          setStatus('idle');
          setStatusMessage(null);
      }, 5000);
      setMessageTimeout(timeout);
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setStatus('error');
      setStatusMessage({
        text: 'File size must be less than 10MB',
        type: 'error'
      });
      return;
    }

    // Process file
    setStatus('loading');
    setStatusMessage({
      text: 'Processing PDF...',
      type: 'loading'
    });

    try {
      // await new Promise(resolve => setTimeout(resolve, 100));
      await onUpload(file);
      setStatus('success');
      setStatusMessage({
          text: 'PDF uploaded successfully',
          type: 'success'
      });
      const timeout = setTimeout(() => {
          setStatus('idle');
          setStatusMessage(null);
      }, 5000);
      setMessageTimeout(timeout);
    } catch (error) {
        setStatus('error');
        setStatusMessage({
            text: 'Error uploading PDF',
            type: 'error'
        });
        const timeout = setTimeout(() => {
            setStatus('idle');
            setStatusMessage(null);
        }, 5000);
        setMessageTimeout(timeout);
    }

  };


  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFile(file);
    }
  };

  // Status message styling
  const getStatusStyles = (type: StatusType): string => {
    switch (type) {
      case 'error':
        return 'text-red-500 bg-red-50 border-red-100';
      case 'success':
        return 'text-green-500 bg-green-50 border-green-100';
      case 'loading':
        return 'text-blue-500 bg-blue-50 border-blue-100';
      default:
        return '';
    }
  };

  return (
    <div 
      data-testid="pdf-dropzone"
      className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center
        ${isDragging ? 'drag-active border-blue-400 bg-blue-50' : ''}`}
      onDragEnter={(e) => handleDrag(e, true)}
      onDragOver={(e) => handleDrag(e, true)}
      onDragLeave={(e) => handleDrag(e, false)}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        data-testid="pdf-input"
        className="hidden"
        accept=".pdf"
        onChange={handleInputChange}
      />
      <p className="text-gray-600">
        Drag and drop your PDF here
      </p>
      <p className="text-gray-500 mt-2">
        or
      </p>
      <button
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={() => fileInputRef.current?.click()}
        disabled={status === 'loading'}
      >
        Choose file
      </button>

      {/* Status Messages */}
      {statusMessage && (
        <div
          data-testid={`${status}-message`}
          className={`mt-4 p-3 rounded border ${getStatusStyles(status)}`}
        >
          {status === 'loading' && (
            <div data-testid="loading-indicator" className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {statusMessage.text}
            </div>
          )}
          {status !== 'loading' && statusMessage.text}
        </div>
      )}
    </div>
  );
};

export default PDFUpload;