// Mock de react-router-dom ANTES de cualquier importación
jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    BrowserRouter: ({ children }) => React.createElement('div', { 'data-testid': 'browser-router' }, children),
    Routes: ({ children }) => React.createElement('div', { 'data-testid': 'routes' }, children),
    Route: ({ element, path }) => React.createElement('div', { 'data-testid': `route-${path || 'default'}` }, element),
    Navigate: ({ to }) => React.createElement('div', { 'data-testid': `navigate-${to || 'default'}` }, 'Navigate'),
    Link: ({ children, to }) => React.createElement('a', { href: to }, children),
    useNavigate: () => jest.fn()
  };
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app without crashing', () => {
  render(<App />);
  // Test básico para verificar que la app se renderiza sin errores
  expect(document.body).toBeInTheDocument();
});
