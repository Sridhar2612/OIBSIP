import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../services/api';
import { io } from 'socket.io-client';
import { ChefHat, Truck, CheckCircle2, Clock, ArrowLeft, Activity, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const OrderTracker = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    try {
      const res = await API.get(`/orders/${id}`);
      setOrder(res.data.data.order);
    } catch (error) {
      toast.error('Failed to load tracking details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();

    const socket = io('http://localhost:5000', { withCredentials: true });
    socket.emit('join_order_room', id);

    socket.on('order:status_updated', (data) => {
      if (data.orderId === id || data.id === id || (order && order.orderId === data.orderId)) {
        toast.success(`Order Status: ${data.status} 🍕`);
        fetchOrder();
      }
    });

    socket.on('order_status_updated', (data) => {
      if (data.orderId === id || data.id === id || (order && order.orderId === data.orderId)) {
        toast.success(`Order Status: ${data.status} 🍕`);
        fetchOrder();
      }
    });

    const interval = setInterval(fetchOrder, 5000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-4">
        <AlertCircle className="w-12 h-12 text-red-400 mb-2" />
        <h2 className="text-xl font-bold text-white">Order Record Not Found</h2>
        <Link to="/orders" className="text-xs text-orange-400 hover:underline mt-2">
          Back to Orders
        </Link>
      </div>
    );
  }

  const steps = [
    { label: 'Order Received', desc: 'Payment verified & queued in kitchen', icon: Clock },
    { label: 'In Kitchen', desc: 'Dough hand-stretched, topped & baked in oven', icon: ChefHat },
    { label: 'Sent to Delivery', desc: 'Hot insulated box out on delivery run', icon: Truck },
    { label: 'Delivered', desc: 'Delivered fresh at your doorstep. Enjoy!', icon: CheckCircle2 }
  ];

  const currentStepIndex = steps.findIndex((s) => s.label === order.orderStatus);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center justify-between border-b border-stone-800 pb-4">
        <Link to="/orders" className="flex items-center text-xs text-stone-400 hover:text-white font-semibold">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to My Orders
        </Link>
        <div className="flex items-center space-x-2 text-xs text-emerald-400 font-semibold bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/40">
          <Activity className="w-3.5 h-3.5 animate-pulse" />
          <span>Real-Time Sync Active</span>
        </div>
      </div>

      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider block">Live Order Status</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5">Order #{order.orderId}</h1>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs text-stone-400 block">Total Amount</span>
            <span className="text-2xl font-black text-white">₹{order.finalAmount}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isCompleted = idx <= currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={s.label}
                className={`p-4 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'bg-orange-950/40 border-orange-500 ring-2 ring-orange-500/30 shadow-lg'
                    : isCompleted
                    ? 'bg-emerald-950/20 border-emerald-800/60 text-emerald-400'
                    : 'bg-stone-950/60 border-stone-800/80 opacity-40'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`p-2.5 rounded-xl ${
                      isCurrent
                        ? 'bg-orange-600 text-white'
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold font-mono">0{idx + 1}</span>
                </div>

                <h4 className="text-xs font-bold text-white mb-1">{s.label}</h4>
                <p className="text-[11px] text-stone-400 leading-relaxed">{s.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-stone-800 pt-6">
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">Order Items:</h3>
            <div className="space-y-2">
              {order.items.map((it, i) => (
                <div key={i} className="p-3 bg-stone-950 rounded-xl border border-stone-800/80 text-xs">
                  <div className="flex justify-between font-bold text-white">
                    <span>{it.quantity}x {it.name}</span>
                    <span>₹{it.totalItemPrice}</span>
                  </div>
                  {it.customDetails && (
                    <p className="text-[11px] text-stone-400 mt-1">
                      {it.customDetails.base?.name} • {it.customDetails.sauce?.name} • {it.customDetails.cheese?.name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">Delivery Address:</h3>
            <div className="p-4 bg-stone-950 rounded-xl border border-stone-800/80 text-xs space-y-1.5 text-stone-300">
              <p className="font-semibold text-white">{order.deliveryAddress?.street}</p>
              <p>{order.deliveryAddress?.city}, {order.deliveryAddress?.state} {order.deliveryAddress?.zipCode}</p>
              <p className="text-stone-400 pt-1">Phone: {order.deliveryAddress?.phone}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
