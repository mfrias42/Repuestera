// Manual mock para react-router-dom
// Este archivo se usa automáticamente cuando jest.mock('react-router-dom') es llamado

module.exports = {
  BrowserRouter: ({ children }) => children,
  Routes: ({ children }) => children,
  Route: ({ element }) => element,
  Navigate: () => null,
  Link: ({ children, to }) => children,
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/' }),
  useParams: () => ({})
};

