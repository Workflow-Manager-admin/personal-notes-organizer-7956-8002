import { render, screen } from '@testing-library/react';
import App from './App';

test('renders NotesApp brand', () => {
  render(<App />);
  expect(screen.getByText(/NotesApp/i)).toBeInTheDocument();
});

test('renders sidebar heading', () => {
  render(<App />);
  expect(screen.getByText("Notes")).toBeInTheDocument();
});

test('renders New note button', () => {
  render(<App />);
  expect(screen.getByRole("button", {name: "+"})).toBeInTheDocument();
});
