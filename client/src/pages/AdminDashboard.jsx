import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import {
  Shield,
  Package,
  ShoppingCart,
  Users,
  AlertTriangle,
  RefreshCw,
  Clock,
  ChefHat,
  Truck,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowUpRight,
  Filter,
  DollarSign,
  TrendingUp,
  Search
} from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'inventory' | 'analytics'
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchOrder, setSearchOrder] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Restock modal state
  const [restockItem, setRestockItem] = useState(null);
  const [restockQty, setRestockQty] = useState(50);
  const [restocking, setRestocking] = useState(false);

  // Status update state
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, ordersRes, invRes] = await Promise.all([
        API.get('/admin/stats'),
        API.get(`/admin/orders?status=${statusFilter}&search=${searchOrder}`),
        API.get(`/admin/inventory?category=${categoryFilter}`)
      ]);

      setStats(statsRes.data.data.stats);
      setOrders(ordersRes.data.data.orders);
      setInventory(invRes.data.data.inventory);
    } catch (error) {
      toast.error('Failed to load admin operations data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const socket = io('http://localhost:5000', { withCredentials: true });
    socket.emit('join_admin_room');

    socket.on('order:status_updated', () => {
      fetchDashboardData();
    });

    socket.on('inventory:updated', () => {
      fetchDashboardData();
    });

    return () => {
      socket.disconnect();
    };
  }, [statusFilter, searchOrder, categoryFilter]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setUpdatingOrderId(orderId);
      await API.patch(`/admin/orders/${orderId}/status`, { status: newStatus });
      toast.success(`Order #${orderId} marked as ${newStatus}`);
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!restockItem) return;
    try {
      setRestocking(true);
      await API.patch(`/admin/inventory/${restockItem._id}`, {
        restockAmount: Number(restockQty)
      });
      toast.success(`Restocked +${restockQty} ${restockItem.unit} of ${restockItem.name}!`);
      setRestockItem(null);
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Restock failed');
    } finally {
      setRestocking(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Order Received':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'In Kitchen':
        return 'bg-blue-950 text-blue-300 border-blue-800';
      case 'Sent to Delivery':
        return 'bg-purple-950 text-purple-300 border-purple-800';
      case 'Delivered':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      case 'Cancelled':
        return 'bg-rose-950 text-rose-300 border-rose-800';
      default:
        return 'bg-stone-800 text-stone-300 border-stone-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Admin Operations Console</h1>
            <p className="text-xs text-stone-400">Live Kitchen Dispatch, Inventory Restock Hub & Audit Logs</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchDashboardData}
            className="p-2.5 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded-xl border border-stone-800 text-xs flex items-center transition"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Live
          </button>
          <span className="text-xs font-semibold px-3 py-1 bg-amber-950 text-amber-300 border border-amber-800 rounded-full">
            Super Admin Active
          </span>
        </div>
      </div>

      {/* KPI Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-stone-900 border border-stone-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-stone-400 text-xs font-semibold">
              <span>ACTIVE KITCHEN ORDERS</span>
              <ChefHat className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-3xl font-extrabold text-white">{stats.activeOrders}</p>
            <p className="text-[11px] text-stone-400">{stats.totalOrders} total lifetime orders</p>
          </div>

          <div className="p-5 bg-stone-900 border border-stone-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-stone-400 text-xs font-semibold">
              <span>TOTAL REVENUE</span>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-3xl font-extrabold text-emerald-400">₹{stats.totalRevenue}</p>
            <p className="text-[11px] text-stone-400">Razorpay verified payments</p>
          </div>

          <div className="p-5 bg-stone-900 border border-stone-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-stone-400 text-xs font-semibold">
              <span>LOW STOCK ALERTS</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-3xl font-extrabold text-amber-400">{stats.lowStockCount}</p>
            <p className="text-[11px] text-stone-400">
              {stats.lowStockCount > 0 ? 'Items below safety threshold' : 'All 22 ingredients healthy'}
            </p>
          </div>

          <div className="p-5 bg-stone-900 border border-stone-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-stone-400 text-xs font-semibold">
              <span>REGISTERED USERS</span>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-3xl font-extrabold text-white">{stats.totalCustomers}</p>
            <p className="text-[11px] text-stone-400">Customer profiles</p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex space-x-2 border-b border-stone-800 pb-2">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-5 py-2.5 text-xs font-bold rounded-xl transition flex items-center space-x-2 ${
            activeTab === 'orders'
              ? 'bg-orange-600 text-white shadow-lg'
              : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Live Kitchen Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-5 py-2.5 text-xs font-bold rounded-xl transition flex items-center space-x-2 ${
            activeTab === 'inventory'
              ? 'bg-orange-600 text-white shadow-lg'
              : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Inventory & Restock ({inventory.length})</span>
        </button>
      </div>

      {/* TAB 1: LIVE ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-stone-900 p-4 rounded-2xl border border-stone-800">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-stone-400" />
              <div className="flex flex-wrap gap-1.5">
                {['ALL', 'Order Received', 'In Kitchen', 'Sent to Delivery', 'Delivered'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      statusFilter === st
                        ? 'bg-orange-500 text-white'
                        : 'bg-stone-950 text-stone-400 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-3 text-stone-500" />
              <input
                type="text"
                placeholder="Search Order ID or Phone..."
                value={searchOrder}
                onChange={(e) => setSearchOrder(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Orders List */}
          {orders.length === 0 ? (
            <div className="text-center py-16 bg-stone-900 rounded-2xl border border-stone-800">
              <ShoppingCart className="w-10 h-10 text-stone-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-white">No orders matching current filter</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((ord) => (
                <div
                  key={ord._id}
                  className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl hover:border-stone-700 transition space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-800/80 pb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg font-black text-white font-mono">#{ord.orderId}</span>
                      <span
                        className={`text-[11px] font-bold px-3 py-1 rounded-full border ${getStatusBadge(
                          ord.orderStatus
                        )}`}
                      >
                        {ord.orderStatus}
                      </span>
                      <span className="text-xs text-stone-400">
                        {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Quick Status Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-stone-400 font-semibold mr-1">Move Status:</span>
                      {ord.orderStatus === 'Order Received' && (
                        <button
                          disabled={updatingOrderId === ord._id}
                          onClick={() => handleUpdateStatus(ord._id, 'In Kitchen')}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center transition shadow"
                        >
                          <ChefHat className="w-3.5 h-3.5 mr-1" /> To Kitchen
                        </button>
                      )}
                      {ord.orderStatus === 'In Kitchen' && (
                        <button
                          disabled={updatingOrderId === ord._id}
                          onClick={() => handleUpdateStatus(ord._id, 'Sent to Delivery')}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold flex items-center transition shadow"
                        >
                          <Truck className="w-3.5 h-3.5 mr-1" /> Out For Delivery
                        </button>
                      )}
                      {ord.orderStatus === 'Sent to Delivery' && (
                        <button
                          disabled={updatingOrderId === ord._id}
                          onClick={() => handleUpdateStatus(ord._id, 'Delivered')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center transition shadow"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mark Delivered
                        </button>
                      )}
                      {ord.orderStatus === 'Delivered' && (
                        <span className="text-xs text-emerald-400 font-bold flex items-center">
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Completed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Order Contents & Customer Details */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
                    {/* Items List */}
                    <div className="lg:col-span-2 space-y-2">
                      <h4 className="font-bold uppercase tracking-wider text-stone-400">Order Items:</h4>
                      <div className="space-y-2">
                        {ord.items.map((it, idx) => (
                          <div key={idx} className="p-3 bg-stone-950 rounded-xl border border-stone-800/80">
                            <div className="flex justify-between items-center font-bold text-white">
                              <span>
                                {it.quantity}x {it.name}
                              </span>
                              <span className="font-mono">₹{it.totalItemPrice}</span>
                            </div>
                            {it.customDetails && (
                              <div className="text-[11px] text-stone-400 mt-1 space-y-0.5">
                                <p>
                                  <span className="text-stone-300">Crust:</span> {it.customDetails.base?.name} •{' '}
                                  <span className="text-stone-300">Sauce:</span> {it.customDetails.sauce?.name} •{' '}
                                  <span className="text-stone-300">Cheese:</span> {it.customDetails.cheese?.name}
                                </p>
                                {it.customDetails.vegetables?.length > 0 && (
                                  <p>
                                    <span className="text-stone-300">Veggies:</span>{' '}
                                    {it.customDetails.vegetables.map((v) => v.name).join(', ')}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery & Customer Info */}
                    <div className="p-4 bg-stone-950 rounded-xl border border-stone-800/80 space-y-2">
                      <h4 className="font-bold uppercase tracking-wider text-stone-400">Customer & Destination:</h4>
                      <p className="font-bold text-white text-sm">{ord.user?.name || ord.deliveryAddress?.name}</p>
                      <p className="text-stone-300">{ord.deliveryAddress?.street}</p>
                      <p className="text-stone-400">
                        {ord.deliveryAddress?.city}, {ord.deliveryAddress?.state} {ord.deliveryAddress?.zipCode}
                      </p>
                      <p className="text-orange-400 font-mono font-semibold pt-1">
                        📞 {ord.deliveryAddress?.phone || ord.user?.phone}
                      </p>
                      <div className="pt-2 border-t border-stone-800 flex justify-between font-bold text-white">
                        <span>Total Paid:</span>
                        <span className="text-emerald-400 font-mono text-sm">₹{ord.finalAmount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INVENTORY & RESTOCK */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* Category Selector */}
          <div className="flex flex-wrap gap-2">
            {['ALL', 'BASE', 'SAUCE', 'CHEESE', 'VEGETABLE'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  categoryFilter === cat
                    ? 'bg-orange-500 text-white'
                    : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {inventory.map((item) => (
              <div
                key={item._id}
                className={`p-5 rounded-2xl border transition space-y-4 ${
                  item.isLowStock
                    ? 'bg-amber-950/20 border-amber-600/60 ring-1 ring-amber-500/20'
                    : 'bg-stone-900 border-stone-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 block">
                      {item.category}
                    </span>
                    <h3 className="font-bold text-white text-sm mt-0.5">{item.name}</h3>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      item.stockStatus === 'OUT_OF_STOCK'
                        ? 'bg-rose-950 text-rose-300 border-rose-800'
                        : item.stockStatus === 'LOW_STOCK'
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    }`}
                  >
                    {item.stockStatus}
                  </span>
                </div>

                {/* Stock Level Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-400">Stock Available:</span>
                    <span className="font-bold text-white font-mono">
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                  <div className="w-full bg-stone-950 rounded-full h-2 overflow-hidden border border-stone-800">
                    <div
                      className={`h-full rounded-full transition-all ${
                        item.quantity <= item.lowStockThreshold ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{
                        width: `${Math.min(100, (item.quantity / (item.lowStockThreshold * 3)) * 100)}%`
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-stone-500">Alert threshold: ≤ {item.lowStockThreshold} {item.unit}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-stone-800/80">
                  <span className="text-xs text-stone-300 font-mono font-bold">₹{item.price}</span>
                  <button
                    onClick={() => {
                      setRestockItem(item);
                      setRestockQty(50);
                    }}
                    className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold flex items-center transition shadow"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Restock
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {restockItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-stone-800 pb-4">
              <div>
                <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider block">
                  Restock Inventory
                </span>
                <h3 className="text-lg font-bold text-white">{restockItem.name}</h3>
              </div>
              <button onClick={() => setRestockItem(null)} className="text-stone-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Add Quantity ({restockItem.unit}):
                </label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[20, 50, 100, 200].map((num) => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => setRestockQty(num)}
                      className={`py-2 rounded-xl text-xs font-bold border transition ${
                        restockQty === num
                          ? 'bg-orange-600 border-orange-500 text-white'
                          : 'bg-stone-950 border-stone-800 text-stone-300 hover:text-white'
                      }`}
                    >
                      +{num}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 text-xs text-stone-400">
                <p>
                  Current: <strong className="text-white">{restockItem.quantity}</strong> ➔ New Total:{' '}
                  <strong className="text-emerald-400">{restockItem.quantity + Number(restockQty || 0)}</strong>{' '}
                  {restockItem.unit}
                </p>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRestockItem(null)}
                  className="flex-1 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={restocking}
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center shadow-lg"
                >
                  {restocking ? 'Restocking...' : 'Confirm Restock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
