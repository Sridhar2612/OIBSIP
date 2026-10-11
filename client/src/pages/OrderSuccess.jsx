import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../services/api';
import { CheckCircle2, ChefHat, Clock } from 'lucide-react';

export const OrderSuccess = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/orders/${id}`)
      .then((res) => {
        setOrder(res.data.data.order);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch order:', err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12 text-center space-y-6">
      <div className="p-8 bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl space-y-6">
        <div className="inline-flex p-4 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
          <CheckCircle2 className="w-16 h-16 animate-bounce" />
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Order Confirmed & Paid! ??
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Thank you for ordering with SliceCraft. Our pizzaiolos are preparing your pie.
          </p>
        </div>

        {order && (
          <div className="p-4 bg-stone-950 rounded-2xl border border-stone-800 text-left text-xs space-y-2.5">
            <div className="flex justify-between items-center border-b border-stone-800 pb-2">
              <span className="text-stone-400">Order ID:</span>
              <span className="font-mono font-bold text-orange-400">#{order.orderId}</span>
            </div>

            <div className="flex justify-between items-center border-b border-stone-800 pb-2">
              <span className="text-stone-400">Payment Status:</span>
              <span className="font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                PAID (Razorpay)
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-stone-800 pb-2">
              <span className="text-stone-400">Total Paid:</span>
              <span className="font-bold text-white">?{order.finalAmount}</span>
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className="text-stone-400 flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1 text-orange-500" /> Estimated Time:
              </span>
              <span className="font-semibold text-stone-200">25 - 35 mins</span>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            to={`/orders/${id}`}
            className="flex-1 py-3 px-4 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-950 flex items-center justify-center transition-all"
          >
            <ChefHat className="w-4 h-4 mr-1.5" />
            Track Live Kitchen Status
          </Link>
          <Link
            to="/orders"
            className="flex-1 py-3 px-4 bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs rounded-xl transition-all"
          >
            View Order History
          </Link>
        </div>
      </div>
    </div>
  );
};
