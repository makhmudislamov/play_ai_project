import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PDFUpload from '@/components/PDF/PDFUpload';
import { act } from '@testing-library/react';


describe('PDFUpload Component', () => {
  // Improved mock file creation
  const createMockFile = (name: string, type: string, size: number): File => {
    const blob = new Blob(
      [new ArrayBuffer(size)], 
      { type }
    );
    
    const file = new File([blob], name, {
      type,
      lastModified: new Date().getTime()
    });

    Object.defineProperty(file, 'size', {
      get() {
        return size;
      }
    });

    return file;
  };

  // Helper functions for creating specific file types
  const createPDFFile = (name = 'test.pdf', size = 1024) => {
    return createMockFile(name, 'application/pdf', size);
  };

  const createNonPDFFile = () => {
    return createMockFile('test.jpg', 'image/jpeg', 1024);
  };

  // Helper function to get file input
  const getFileInput = () => screen.getByTestId('pdf-input');

  // Rendering tests
  describe('Rendering', () => {
    it('renders upload area with instructions', () => {
      render(<PDFUpload onUpload={() => {}} />);
      
      expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
      expect(screen.getByText(/choose file/i)).toBeInTheDocument();
    });

    it('shows drag-and-drop zone', () => {
      render(<PDFUpload onUpload={() => {}} />);
      
      const dropzone = screen.getByTestId('pdf-dropzone');
      expect(dropzone).toBeInTheDocument();
    });
  });

  // File handling tests
  describe('File Handling', () => {
    it('accepts PDF files', async () => {
      const onUploadMock = jest.fn();
      render(<PDFUpload onUpload={onUploadMock} />);

      const input = getFileInput();
      const pdfFile = createPDFFile();
      await userEvent.upload(input, pdfFile);

      expect(screen.getByText(/processing pdf/i)).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText(/pdf uploaded successfully/i)).toBeInTheDocument();
      });

      expect(onUploadMock).toHaveBeenCalledWith(pdfFile);
    });

    

    it('rejects non-PDF files', async () => {
        const onUploadMock = jest.fn();
        
        // Add console log to see when component renders
        // console.log('=== Starting Test ===');
        
        render(<PDFUpload onUpload={onUploadMock} />);
        
        const input = getFileInput();
        const jpegFile = createNonPDFFile();
        
        // Log the input element and file details
        // console.log('Input element:', input);
        // console.log('JPEG file:', {
        //     name: jpegFile.name,
        //     type: jpegFile.type,
        //     size: jpegFile.size,
        //     accepted: input.accept
        // });
    
        // Try triggering the change event directly
        const changeEvent = new Event('change', { bubbles: true });
        Object.defineProperty(changeEvent, 'target', {
            value: { files: [jpegFile] }
        });
    
        await act(async () => {
            input.dispatchEvent(changeEvent);
            await new Promise(resolve => setTimeout(resolve, 100));
        });
        
        // console.log('=== After File Upload ===');
        // console.log('Component State:', {
        //     status: screen.queryByTestId('error-message'),
        //     allTestIds: Array.from(document.querySelectorAll('[data-testid]'))
        //         .map(el => el.getAttribute('data-testid'))
        // });
        
        screen.debug();
    });

    it('handles files larger than size limit', async () => {
      const onUploadMock = jest.fn();
      render(<PDFUpload onUpload={onUploadMock} />);

      const input = getFileInput();
      const largeFile = createPDFFile('large.pdf', 11 * 1024 * 1024); // 11MB
      await userEvent.upload(input, largeFile);

      await waitFor(() => {
        expect(screen.getByText(/file size must be less than 10mb/i)).toBeInTheDocument();
      });
      
      expect(onUploadMock).not.toHaveBeenCalled();
    });
  });

  // Upload states tests
  describe('Upload States', () => {
    it('shows loading state during upload', async () => {
      const onUploadMock = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      render(<PDFUpload onUpload={onUploadMock} />);

      const input = getFileInput();
      await userEvent.upload(input, createPDFFile());

      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });

    it('displays success message after successful upload', async () => {
      const onUploadMock = jest.fn().mockResolvedValue({ success: true });
      render(<PDFUpload onUpload={onUploadMock} />);

      const input = getFileInput();
      await userEvent.upload(input, createPDFFile());
      
      await waitFor(() => {
        expect(screen.getByText(/pdf uploaded successfully/i)).toBeInTheDocument();
      });
    });

    it('shows error state when upload fails', async () => {
      const onUploadMock = jest.fn().mockRejectedValue(new Error('Upload failed'));
      render(<PDFUpload onUpload={onUploadMock} />);

      const input = getFileInput();
      await userEvent.upload(input, createPDFFile());
      
      await waitFor(() => {
        expect(screen.getByText(/error uploading pdf/i)).toBeInTheDocument();
      });
    });
  });

  // User interaction tests
  describe('User Interaction', () => {
    it('handles drag and drop functionality', async () => {
      const onUploadMock = jest.fn();
      render(<PDFUpload onUpload={onUploadMock} />);

      const dropzone = screen.getByTestId('pdf-dropzone');

      fireEvent.dragEnter(dropzone);
      expect(dropzone).toHaveClass('drag-active');

      fireEvent.dragLeave(dropzone);
      expect(dropzone).not.toHaveClass('drag-active');
    });

    it('allows file selection via button click', async () => {
      render(<PDFUpload onUpload={() => {}} />);
      
      const button = screen.getByText(/choose file/i);
      const input = getFileInput();
      
      const clickEvent = jest.fn();
      input.onclick = clickEvent;
      
      fireEvent.click(button);
      expect(clickEvent).toHaveBeenCalled();
    });
  });
});