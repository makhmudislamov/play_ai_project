import { render, screen, fireEvent } from '@testing-library/react';
import AudioControls from '@/components/PDF/AudioControls';

describe('AudioControls Component', () => {
    it('renders play button initially', () => {
        render(<AudioControls onPlay={() => {}} onPause={() => {}} />);
        expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
    });

    it('toggles between play and pause', () => {
        render(<AudioControls onPlay={() => {}} onPause={() => {}} />);
        
        const button = screen.getByRole('button', { name: /play/i });
        fireEvent.click(button);
        
        expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });

    it('shows loading state when generating audio', () => {
        render(<AudioControls onPlay={() => {}} onPause={() => {}} isLoading={true} />);
        expect(screen.getByText(/generating audio/i)).toBeInTheDocument();
    });
});