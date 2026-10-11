import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/orders')
      .then((res) => {
        setOrders(res.data.data.orders);
        setLoading(false);
      })
      .catch((err) => {
        toast.error('Failed to load your order history');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="border-b border-stone-800 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">My Orders</h1>
          <p className="text-xs text-stone-400 mt-1">Real-time status and past order history</p>
        </div>
        <Link
          to="/custom-pizza"
          className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow transition-all"
        >
          + New Pizza Order
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="p-12 text-center bg-stone-900 border border-stone-800 rounded-3xl space-y-3">
          <ShoppingBag className="w-12 h-12 text-stone-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Orders Placed Yet</h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto">
            Explore our signature pizzas or create your custom pie to place your first order.
          </p>
          <Link
            to="/pizzas"
            className="inline-block mt-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow"
          >
            Browse Pizzas
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusColor =
              order.orderStatus === 'Delivered'
                ? 'bg-emerald-950 text-emerald-400 border-emerald-800/50'
                : order.orderStatus === 'In Kitchen'
                ? 'bg-amber-950 text-amber-400 border-amber-800/50'
                : order.orderStatus === 'Sent to Delivery'
                ? 'bg-blue-950 text-blue-400 border-blue-800/50'
                : 'bg-orange-950 text-orange-400 border-orange-800/50';

            return (
              <Link
                key={order._id}
                to={`/orders/${order._id}`}
                className="block p-5 bg-stone-900 border border-stone-800 hover:border-orange-500/50 rounded-2xl transition-all shadow hover:shadow-xl group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono font-bold text-sm text-white group-hover:text-orange-400 transition-colors">
                        #{order.orderId}
                      </span>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusColor}`}>
                        {order.orderStatus}
                      </span>
                    </div>

                    <p className="text-xs text-stone-400">
                      {order.items.map((i) => `${i.name} (?${i.quantity})`).join(', ')}
                    </p>
                    <p className="text-[11px] text-stone-500">
                      Placed on {new Date(order.createdAt).toLocaleDateString()} at{' '}
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <div className="flex items-center justify-between md:justify-end space-x-6 border-t md:border-t-0 border-stone-800/60 pt-3 md:pt-0">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-stone-500 block font-semibold">Total Amount</span>
                      <span className="text-base font-extrabold text-white">?{order.finalAmount}</span>
                    </div>

                    <span className="p-2 bg-stone-950 group-hover:bg-orange-600 text-stone-400 group-hover:text-white rounded-xl transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
