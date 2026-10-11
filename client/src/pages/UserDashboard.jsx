import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Pizza, ShoppingBag, PlusCircle, MapPin, Sparkles } from 'lucide-react';

export const UserDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-600 to-amber-600 p-8 text-white shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Artisanal Sourdough & Fresh Toppings</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Craving Pizza, {user?.name?.split(' ')[0]}? 🍕
          </h1>
          <p className="mt-2 text-sm text-orange-100/90 leading-relaxed">
            Order your favorite signature pizza from our catalog or craft your own personalized pie step-by-step.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/custom-pizza"
              className="px-5 py-2.5 bg-stone-950 hover:bg-stone-900 text-white font-bold text-xs rounded-xl shadow-lg flex items-center transition-all"
            >
              <PlusCircle className="w-4 h-4 mr-2 text-orange-500" />
              Build Custom Pizza
            </Link>
            <Link
              to="/pizzas"
              className="px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl backdrop-blur-sm transition-all"
            >
              Browse Catalog
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-stone-900 border border-stone-800 rounded-2xl">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2.5 bg-orange-500/10 text-orange-500 rounded-xl">
              <Pizza className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white">Favorite Flavors</h3>
          </div>
          <p className="text-xs text-stone-400">Discover hand-crafted pizzas formulated by artisan pizzaiolos.</p>
          <Link to="/pizzas" className="mt-4 inline-block text-xs text-orange-400 font-semibold hover:underline">
            View Menu →
          </Link>
        </div>

        <div className="p-6 bg-stone-900 border border-stone-800 rounded-2xl">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white">Live Orders</h3>
          </div>
          <p className="text-xs text-stone-400">Track current preparation in kitchen & real-time delivery status.</p>
          <Link to="/orders" className="mt-4 inline-block text-xs text-emerald-400 font-semibold hover:underline">
            Track Orders →
          </Link>
        </div>

        <div className="p-6 bg-stone-900 border border-stone-800 rounded-2xl">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white">Saved Address</h3>
          </div>
          <p className="text-xs text-stone-400 truncate">{user?.address?.street || 'Indiranagar'}</p>
          <p className="text-[11px] text-stone-500">{user?.address?.city || 'Bengaluru'} {user?.address?.zipCode || '560038'}</p>
        </div>
      </div>
    </div>
  );
};
