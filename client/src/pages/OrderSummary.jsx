import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import API from '../services/api';
import {
  ShoppingBag,
  MapPin,
  CreditCard,
  ArrowRight,
  Pizza,
  ShieldCheck,
  Edit,
  AlertTriangle,
  X,
  Smartphone,
  CheckCircle2,
  Lock
} from 'lucide-react';
import toast from 'react-hot-toast';

export const OrderSummary = () => {
  const { user, isAuthenticated } = useAuth();
  const { cartItems, clearCart } = useCart();
  const navigate = useNavigate();

  const [address, setAddress] = useState({
    street: user?.address?.street || 'Indiranagar 100ft Road',
    city: user?.address?.city || 'Bengaluru',
    state: user?.address?.state || 'Karnataka',
    zipCode: user?.address?.zipCode || '560038',
    phone: user?.phone || '+91 9876543210'
  });

  const [submitting, setSubmitting] = useState(false);
  const [activePaymentModal, setActivePaymentModal] = useState(null); // Simulated test modal state

  const item = cartItems[0];

  if (!item) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="p-4 bg-stone-900 rounded-full border border-stone-800">
          <ShoppingBag className="w-12 h-12 text-stone-600" />
        </div>
        <h2 className="text-xl font-bold text-white">Your Order Summary is Empty</h2>
        <p className="text-xs text-stone-400 max-w-sm">
          Please select a signature pizza or craft your custom pie before proceeding to summary.
        </p>
        <Link
          to="/custom-pizza"
          className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
        >
          Build Custom Pizza
        </Link>
      </div>
    );
  }

  const subtotal = item.totalPrice || item.unitPrice;
  const taxes = Math.round(subtotal * 0.05);
  const deliveryFee = subtotal >= 500 ? 0 : 40;
  const finalAmount = subtotal + taxes + deliveryFee;

  const handleProceedToPayment = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to confirm and place your order');
      navigate('/login', { state: { from: { pathname: '/order-summary' } } });
      return;
    }

    if (!address.street || !address.city || !address.phone) {
      toast.error('Please complete your delivery address and phone number');
      return;
    }

    setSubmitting(true);

    try {
      // Step 1: Create Order in Backend (Server validates prices and stock atomically)
      const orderPayload = {
        items: [item],
        deliveryAddress: address
      };

      const orderRes = await API.post('/orders', orderPayload);
      const createdOrder = orderRes.data.data.order;

      // Step 2: Initialize Razorpay Test Gateway Order
      const paymentRes = await API.post('/payment/create-order', {
        orderId: createdOrder._id
      });
      const { razorpayOrder, keyId, customer } = paymentRes.data.data;

      // Check if real key is configured
      const isRealKey = keyId && !keyId.includes('YourKeyHere') && !keyId.includes('dummy');

      if (isRealKey && window.Razorpay) {
        const options = {
          key: keyId,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: 'SliceCraft Artisanal Pizza',
          description: `Order #${createdOrder.orderId}`,
          image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&auto=format&fit=crop&q=80',
          order_id: razorpayOrder.id,
          handler: async function (response) {
            await finalizePayment(createdOrder._id, response.razorpay_order_id, response.razorpay_payment_id, response.razorpay_signature);
          },
          prefill: {
            name: customer.name,
            email: customer.email,
            contact: customer.phone
          },
          theme: { color: '#ea580c' }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function () {
          toast.error('Payment cancelled or failed');
          setSubmitting(false);
        });
        rzp.open();
      } else {
        // Open the Razorpay Test Simulator Modal
        setActivePaymentModal({
          order: createdOrder,
          razorpayOrder,
          amount: finalAmount
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to initiate order');
    } finally {
      setSubmitting(false);
    }
  };

  const finalizePayment = async (orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
    try {
      const verifyRes = await API.post('/payment/verify', {
        orderId,
        razorpayOrderId,
        razorpayPaymentId: razorpayPaymentId || `pay_test_${Date.now()}`,
        razorpaySignature: razorpaySignature || 'simulated_sig'
      });

      if (verifyRes.data.success) {
        clearCart();
        toast.success('Payment captured! Your pizza is in the oven! 🍕');
        navigate(`/order-success/${orderId}`);
      }
    } catch (verifyErr) {
      toast.error(verifyErr.response?.data?.message || 'Payment verification failed');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-stone-800 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Review Your Order</h1>
          <p className="text-xs text-stone-400 mt-1">
            Confirm your artisanal selection and delivery location before test checkout.
          </p>
        </div>
        <span className="text-xs font-bold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-3 py-1 rounded-full">
          Razorpay Test Mode
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Itemized Receipt & Delivery Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-orange-500/10 text-orange-500 rounded-xl">
                  <Pizza className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{item.name}</h3>
                  <span className="text-xs text-stone-400 font-mono">Custom Studio Pie × {item.quantity}</span>
                </div>
              </div>

              <Link
                to="/custom-pizza"
                className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center"
              >
                <Edit className="w-3.5 h-3.5 mr-1" /> Edit Recipe
              </Link>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-stone-800/40">
                <span className="text-stone-400">1. Crust Base:</span>
                <span className="font-semibold text-stone-200">
                  {item.base?.name} <span className="text-orange-400">(₹{item.base?.price})</span>
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-stone-800/40">
                <span className="text-stone-400">2. Sauce Selection:</span>
                <span className="font-semibold text-stone-200">
                  {item.sauce?.name} <span className="text-orange-400">(₹{item.sauce?.price})</span>
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-stone-800/40">
                <span className="text-stone-400">3. Melted Cheese:</span>
                <span className="font-semibold text-stone-200">
                  {item.cheese?.name} <span className="text-orange-400">(₹{item.cheese?.price})</span>
                </span>
              </div>

              <div className="py-1">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-stone-400">4. Fresh Toppings:</span>
                  <span className="text-emerald-400 font-semibold">
                    {item.vegetables?.length > 0 ? `${item.vegetables.length} selected` : 'None'}
                  </span>
                </div>
                {item.vegetables?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pl-2">
                    {item.vegetables.map((v) => (
                      <span
                        key={v._id || v.id}
                        className="text-[11px] bg-stone-950 text-stone-300 px-2 py-0.5 rounded border border-stone-800"
                      >
                        {v.name} (+₹{v.price})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2.5 border-b border-stone-800 pb-3">
              <MapPin className="w-5 h-5 text-orange-500" />
              <h3 className="text-sm font-bold text-white">Delivery Destination</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-stone-400 mb-1">Street Address</label>
                <input
                  type="text"
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-stone-400 mb-1">City</label>
                  <input
                    type="text"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-stone-400 mb-1">State</label>
                  <input
                    type="text"
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-stone-400 mb-1">PIN Code</label>
                  <input
                    type="text"
                    value={address.zipCode}
                    onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-stone-400 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={address.phone}
                  onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Price Calculation & Checkout Trigger */}
        <div className="lg:col-span-5 space-y-6 sticky top-24">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-400 flex items-center justify-between">
              <span>Bill Summary</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </h3>

            <div className="space-y-3 text-xs border-b border-stone-800 pb-4">
              <div className="flex justify-between text-stone-400">
                <span>Pizza Item Subtotal:</span>
                <span className="text-white font-semibold">₹{subtotal}</span>
              </div>

              <div className="flex justify-between text-stone-400">
                <span>GST (5% Food Tax):</span>
                <span className="text-white font-semibold">₹{taxes}</span>
              </div>

              <div className="flex justify-between text-stone-400">
                <span>Artisan Delivery Fee:</span>
                <span className={deliveryFee === 0 ? 'text-emerald-400 font-bold' : 'text-white font-semibold'}>
                  {deliveryFee === 0 ? 'FREE (Order > ₹500)' : `₹${deliveryFee}`}
                </span>
              </div>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-xs text-stone-400 block">Total Amount Payable</span>
                <span className="text-3xl font-black text-white">₹{finalAmount}</span>
              </div>
              <span className="text-[10px] text-stone-500 font-mono">INR incl. taxes</span>
            </div>

            <button
              onClick={handleProceedToPayment}
              disabled={submitting}
              className="w-full py-4 px-6 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-sm rounded-2xl shadow-xl shadow-orange-950 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Pay with Razorpay Test Mode</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800/80 text-[11px] text-stone-400 space-y-1">
              <div className="flex items-center text-amber-400 font-semibold mb-1">
                <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Test Mode Simulation
              </div>
              <p>Supports Razorpay Gateway and Test Simulator with atomic stock deduction.</p>
            </div>
          </div>
        </div>
      </div>

      {/* RAZORPAY TEST SIMULATION MODAL */}
      {activePaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative">
            {/* Modal Top Header */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-6 text-white relative">
              <button
                onClick={() => setActivePaymentModal(null)}
                className="absolute top-4 right-4 p-1.5 bg-black/40 hover:bg-black/70 rounded-full text-stone-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                  <CreditCard className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Razorpay Test Gateway</h3>
                  <p className="text-[10px] text-blue-200">Secure Sandboxed Checkout Simulation</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-baseline">
                <span className="text-xs text-blue-200">Order #{activePaymentModal.order.orderId}</span>
                <span className="text-2xl font-extrabold text-white">₹{activePaymentModal.amount}</span>
              </div>
            </div>

            {/* Test Payment Options */}
            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 flex items-center justify-between text-stone-300">
                <span className="flex items-center">
                  <Smartphone className="w-4 h-4 mr-2 text-emerald-400" /> UPI / QR (Google Pay / PhonePe / Paytm)
                </span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                  Ready
                </span>
              </div>

              <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 flex items-center justify-between text-stone-300">
                <span className="flex items-center">
                  <CreditCard className="w-4 h-4 mr-2 text-blue-400" /> Test Credit / Debit Cards
                </span>
                <span className="text-[10px] text-stone-400">•••• 4242</span>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() =>
                    finalizePayment(
                      activePaymentModal.order._id,
                      activePaymentModal.razorpayOrder.id,
                      `pay_test_${Date.now()}`,
                      'simulated_sig'
                    )
                  }
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center space-x-2 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simulate Successful Payment (₹{activePaymentModal.amount})</span>
                </button>

                <button
                  onClick={() => {
                    toast.error('Payment cancelled by user');
                    setActivePaymentModal(null);
                  }}
                  className="w-full py-2.5 px-4 bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 text-xs font-semibold rounded-xl transition-all"
                >
                  Cancel Payment
                </button>
              </div>

              <div className="text-center pt-2 flex items-center justify-center text-[10px] text-stone-500">
                <Lock className="w-3 h-3 mr-1 text-stone-500" />
                <span>HMAC SHA-256 Signature Verification & Stock Deduction Active</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};