import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import AdminLayout from './layouts/AdminLayout';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import ProductsPage from './pages/admin/ProductsPage';
import UsersPage from './pages/admin/UsersPage';
import NetworkPage from './pages/admin/NetworkPage';
import PositionsPage from './pages/admin/PositionsPage';
import WithdrawalsPage from './pages/admin/WithdrawalsPage';
import { isAuthenticated } from './lib/auth';
import './index.css';

function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard/analytics" replace />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="network" element={<NetworkPage />} />
          <Route path="positions" element={<PositionsPage />} />
          <Route path="withdrawals" element={<WithdrawalsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
