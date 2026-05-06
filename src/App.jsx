import { Routes, Route, Navigate } from 'react-router';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import DashboardPage from './features/dashboard/DashboardPage';
import WalletsPage from './features/wallets/WalletsPage';
import TransactionsPage from './features/transactions/TransactionsPage';
import GroupsPage from './features/groups/GroupsPage';
import GroupDetailsPage from './features/groups/GroupDetailsPage';
import BudgetsPage from './features/budgets/BudgetsPage';
import NotFoundPage from './components/NotFoundPage';

function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      
      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/wallets" element={<WalletsPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/groups/:groupId" element={<GroupDetailsPage />} />
        <Route path="/budgets" element={<BudgetsPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Route>
      
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;


