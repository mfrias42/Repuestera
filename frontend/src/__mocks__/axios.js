// Mock manual de axios para tests
const mockAxiosInstance = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: {
      use: jest.fn()
    },
    response: {
      use: jest.fn()
    }
  }
};

const createMock = jest.fn(() => mockAxiosInstance);

const axios = {
  create: createMock,
  default: {
    create: createMock
  },
  mockAxiosInstance: mockAxiosInstance
};

// Exportar como ES module y CommonJS
module.exports = axios;
module.exports.default = axios;
module.exports.__esModule = true;

