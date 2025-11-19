// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Configurar transformIgnorePatterns para axios y otros módulos ES
// Esto se hace automáticamente con react-scripts, pero podemos asegurarnos
if (typeof jest !== 'undefined') {
  jest.mock('axios', () => {
    const mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    };
    
    return {
      __esModule: true,
      default: {
        create: jest.fn(() => mockAxiosInstance)
      }
    };
  });
}
