import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';

import { Login } from './pages/Login';
import { AdminLogin } from './pages/AdminLogin';
import { Register } from './pages/Register';
import { VerifyEmail } from './pages/VerifyEmail';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { UserDashboard } from './pages/UserDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { PizzaCatalog } from './pages/PizzaCatalog';
import { CustomPizzaBuilder } from './pages/CustomPizzaBuilder';
import { OrderSummary } from './pages/OrderSummary';
import { OrderSuccess } from './pages/OrderSuccess';
import { OrderHistory } from './pages/OrderHistory';
import { OrderTracker } from './pages/OrderTracker';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public / Browsing Routes */}
                <Route path="/" element={<Navigate to="/pizzas" replace />} />
                <Route path="/pizzas" element={<PizzaCatalog />} />
                <Route path="/custom-pizza" element={<CustomPizzaBuilder />} />
                <Route path="/order-summary" element={<OrderSummary />} />
                <Route path="/order-success/:id" element={<OrderSuccess />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />

                {/* Protected Customer Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <UserDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute>
                      <OrderHistory />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders/:id"
                  element={
                    <ProtectedRoute>
                      <OrderTracker />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Admin Routes */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* 404 Fallback */}
                <Route path="*" element={<Navigate to="/pizzas" replace />} />
              </Routes>
            </main>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#1c1917',
                  color: '#f5f5f4',
                  border: '1px solid #292524',
                  fontSize: '13px'
                }
              }}
            />
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}
