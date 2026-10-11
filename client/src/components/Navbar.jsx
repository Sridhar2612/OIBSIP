import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Pizza, Shield, LogOut, ShoppingBag, PlusCircle } from 'lucide-react';

export const Navbar = () => {
  const { user, isAdmin, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-stone-950/80 backdrop-blur-md border-b border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2.5">
          <div className="p-2 bg-orange-500/10 rounded-xl">
            <Pizza className="w-6 h-6 text-orange-500" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Slice<span className="text-orange-500">Craft</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link to="/" className="text-stone-300 hover:text-orange-400 transition-colors">
            Home
          </Link>
          <Link to="/pizzas" className="text-stone-300 hover:text-orange-400 transition-colors">
            Pizzas
          </Link>
          <Link to="/custom-pizza" className="flex items-center text-orange-400 hover:text-orange-300 transition-colors">
            <PlusCircle className="w-4 h-4 mr-1.5" />
            Build Custom Pizza
          </Link>

          {isAuthenticated && !isAdmin && (
            <Link to="/orders" className="flex items-center text-stone-300 hover:text-orange-400 transition-colors">
              <ShoppingBag className="w-4 h-4 mr-1.5" />
              My Orders
            </Link>
          )}

          {isAdmin && (
            <Link to="/admin/dashboard" className="flex items-center text-amber-400 hover:text-amber-300 transition-colors font-semibold">
              <Shield className="w-4 h-4 mr-1.5" />
              Admin Portal
            </Link>
          )}
        </nav>

        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-medium text-white">{user?.name}</span>
                <span className="text-[10px] text-stone-400 capitalize">{user?.role}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-stone-400 hover:text-red-400 hover:bg-stone-900 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="text-xs font-semibold px-4 py-2 text-stone-300 hover:text-white rounded-lg hover:bg-stone-900 transition-all"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-xs font-semibold px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg shadow-lg shadow-orange-950/50 transition-all"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
