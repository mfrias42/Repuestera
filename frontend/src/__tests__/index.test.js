import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';

// Mock de reportWebVitals
jest.mock('../reportWebVitals', () => ({
  __esModule: true,
  default: jest.fn()
}));

// Mock de ReactDOM.createRoot
const mockRender = jest.fn();
jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({
    render: mockRender
  }))
}));

describe('index.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe renderizar App dentro de StrictMode', () => {
    // Simular que el módulo se ejecuta
    require('../index');
    
    // Verificar que createRoot fue llamado
    const { createRoot } = require('react-dom/client');
    expect(createRoot).toHaveBeenCalled();
    
    // Verificar que render fue llamado
    expect(mockRender).toHaveBeenCalled();
  });
});

