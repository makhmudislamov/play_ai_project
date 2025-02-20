
import { render, screen } from '@testing-library/react';
import PDFViewer from '@/components/PDF/PDFViewer';

describe('PDFViewer Component', () => {
    it('renders PDF container', () => {
        render(<PDFViewer />);
        const container = screen.getByTestId('pdf-viewer-container');
        expect(container).toBeInTheDocument();
    });

    it('shows no PDF message when no file is provided', () => {
        render(<PDFViewer />);
        expect(screen.getByText(/no pdf file selected/i)).toBeInTheDocument();
    });

    it('shows loading state when PDF file is provided', () => {
        const file = new File([''], 'test.pdf', { type: 'application/pdf' });
        render(<PDFViewer file={file} />);
        
        expect(screen.getByText(/loading pdf/i)).toBeInTheDocument();
    });

    // Add to src/__tests__/components/PDF/PDFViewer.test.tsx
    it('shows error state when file is invalid', () => {
        const invalidFile = new File([''], 'test.txt', { type: 'text/plain' });
        render(<PDFViewer file={invalidFile} />);
        
        expect(screen.getByText(/invalid pdf file/i)).toBeInTheDocument();
    });


    it('shows URL ready message when PDF URL is provided', () => {
        const file = new File([''], 'test.pdf', { type: 'application/pdf' });
        const url = 'blob:test-url';
        
        render(<PDFViewer file={file} url={url} />);
        expect(screen.getByText(/PDF URL ready for rendering/i)).toBeInTheDocument();
    });
});