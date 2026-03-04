import { render, screen } from '@testing-library/react';
import NotFound from '../not-found';

describe('NotFound', () => {
  it('renders 404 heading', () => {
    render(<NotFound />);
    const heading = screen.getByText('404');
    expect(heading).toBeInTheDocument();
  });

  it('renders "Page Not Found" message', () => {
    render(<NotFound />);
    const message = screen.getByText('Page Not Found');
    expect(message).toBeInTheDocument();
  });

  it('renders "Back to Home" link', () => {
    render(<NotFound />);
    const link = screen.getByText('Back to Home');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/');
  });
});
