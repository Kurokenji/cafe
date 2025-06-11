import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CustomerPage from './pages/CustomerPage';
import SellerPage from './pages/SellerPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import { Navigate } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/order/:tableId" element={<CustomerPage />} />
        <Route path="/staff" element={<SellerPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/test" element={<h1>Hello</h1>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;