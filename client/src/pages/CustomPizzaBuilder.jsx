import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useCart } from '../context/CartContext';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Pizza,
  Flame,
  Layers,
  Sparkles,
  ShoppingBag,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export const CustomPizzaBuilder = () => {
  const [step, setStep] = useState(1);
  const [inventory, setInventory] = useState({
    Base: [],
    Sauce: [],
    Cheese: [],
    Vegetable: []
  });
  const [loading, setLoading] = useState(true);

  const { customPizza, setCustomPizza, addCustomPizzaToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await API.get('/inventory');
        if (res.data.data.grouped) {
          setInventory(res.data.data.grouped);
        }
      } catch (error) {
        toast.error('Failed to load fresh ingredients inventory');
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  // Step 1: Base Selection
  const handleSelectBase = (item) => {
    if (item.quantity <= 0) return;
    setCustomPizza((prev) => ({ ...prev, base: item }));
  };

  // Step 2: Sauce Selection
  const handleSelectSauce = (item) => {
    if (item.quantity <= 0) return;
    setCustomPizza((prev) => ({ ...prev, sauce: item }));
  };

  // Step 3: Cheese Selection
  const handleSelectCheese = (item) => {
    if (item.quantity <= 0) return;
    setCustomPizza((prev) => ({ ...prev, cheese: item }));
  };

  // Step 4: Toggle Vegetable (Multi-select)
  const handleToggleVegetable = (item) => {
    if (item.quantity <= 0) return;
    setCustomPizza((prev) => {
      const exists = prev.vegetables.some((v) => v._id === item._id);
      if (exists) {
        return { ...prev, vegetables: prev.vegetables.filter((v) => v._id !== item._id) };
      } else {
        return { ...prev, vegetables: [...prev.vegetables, item] };
      }
    });
  };

  // Live Price Calculations
  const basePrice = customPizza.base?.price || 0;
  const saucePrice = customPizza.sauce?.price || 0;
  const cheesePrice = customPizza.cheese?.price || 0;
  const vegPrice = customPizza.vegetables.reduce((sum, v) => sum + v.price, 0);
  const totalPrice = (basePrice + saucePrice + cheesePrice + vegPrice) * (customPizza.quantity || 1);

  // Step Navigation Validation
  const canProceed = () => {
    if (step === 1) return !!customPizza.base;
    if (step === 2) return !!customPizza.sauce;
    if (step === 3) return !!customPizza.cheese;
    if (step === 4) return true; // Veggies are optional
    return false;
  };

  const handleNext = () => {
    if (!canProceed()) {
      toast.error('Please make a selection to proceed to the next step');
      return;
    }
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Proceed to Order Summary
      addCustomPizzaToCart();
      navigate('/order-summary');
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const stepsMeta = [
    { num: 1, title: 'Crust Base', subtitle: 'Choose 1 of 5 Bases' },
    { num: 2, title: 'Sauce', subtitle: 'Choose 1 of 5 Sauces' },
    { num: 3, title: 'Cheese', subtitle: 'Choose 1 of 4 Cheeses' },
    { num: 4, title: 'Vegetables', subtitle: 'Pick Fresh Toppings' }
  ];

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-stone-400 text-sm">Preparing fresh pizza studio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-stone-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-semibold text-orange-400 uppercase tracking-widest mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Custom Pizza Studio</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Build Your Masterpiece Pie</h1>
        </div>

        {/* Step Progress Pills */}
        <div className="flex items-center gap-2">
          {stepsMeta.map((s) => (
            <div
              key={s.num}
              onClick={() => {
                if (s.num < step || canProceed()) setStep(s.num);
              }}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                step === s.num
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-950 ring-2 ring-orange-400/40'
                  : s.num < step
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                  : 'bg-stone-900 text-stone-500 border border-stone-800'
              }`}
            >
              <span>{s.num < step ? '✓' : s.num}.</span>
              <span className="hidden sm:inline">{s.title}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Multi-Step Selection Area (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Step 1: PIZZA BASE */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Step 1 — Select Your Pizza Crust</h2>
                  <p className="text-xs text-stone-400">Choose one of our 5 artisan 48h cold-fermented doughs</p>
                </div>
                <span className="text-xs text-orange-400 font-semibold bg-orange-950/60 px-2.5 py-1 rounded-full border border-orange-800/40">
                  Required (1 Base)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {inventory.Base.map((item) => {
                  const isSelected = customPizza.base?._id === item._id;
                  const isOutOfStock = item.quantity <= 0;

                  return (
                    <div
                      key={item._id}
                      onClick={() => handleSelectBase(item)}
                      className={`relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-orange-950/20 border-orange-500 ring-2 ring-orange-500/30'
                          : isOutOfStock
                          ? 'bg-stone-950/50 border-stone-900 opacity-50 cursor-not-allowed'
                          : 'bg-stone-900 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex gap-4">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-20 h-20 rounded-xl object-cover border border-stone-800"
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-white">{item.name}</h3>
                            {isSelected && (
                              <span className="p-1 bg-orange-600 text-white rounded-full">
                                <Check className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-stone-800/60 flex items-center justify-between text-xs">
                        <span className="font-extrabold text-orange-400">₹{item.price}</span>
                        <span
                          className={`text-[10px] font-semibold ${
                            isOutOfStock ? 'text-red-400' : 'text-stone-400'
                          }`}
                        >
                          {isOutOfStock ? 'Out of Stock' : `${item.quantity} in stock`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: SAUCE */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Step 2 — Select Sauce Base</h2>
                  <p className="text-xs text-stone-400">Choose one of our 5 signature slow-simmered sauces</p>
                </div>
                <span className="text-xs text-orange-400 font-semibold bg-orange-950/60 px-2.5 py-1 rounded-full border border-orange-800/40">
                  Required (1 Sauce)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {inventory.Sauce.map((item) => {
                  const isSelected = customPizza.sauce?._id === item._id;
                  const isOutOfStock = item.quantity <= 0;

                  return (
                    <div
                      key={item._id}
                      onClick={() => handleSelectSauce(item)}
                      className={`relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-orange-950/20 border-orange-500 ring-2 ring-orange-500/30'
                          : isOutOfStock
                          ? 'bg-stone-950/50 border-stone-900 opacity-50 cursor-not-allowed'
                          : 'bg-stone-900 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex gap-4">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-20 h-20 rounded-xl object-cover border border-stone-800"
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-white">{item.name}</h3>
                            {isSelected && (
                              <span className="p-1 bg-orange-600 text-white rounded-full">
                                <Check className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-stone-800/60 flex items-center justify-between text-xs">
                        <span className="font-extrabold text-orange-400">₹{item.price}</span>
                        <span
                          className={`text-[10px] font-semibold ${
                            isOutOfStock ? 'text-red-400' : 'text-stone-400'
                          }`}
                        >
                          {isOutOfStock ? 'Out of Stock' : `${item.quantity} portions left`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: CHEESE */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Step 3 — Select Artisanal Cheese</h2>
                  <p className="text-xs text-stone-400">Choose one of our 4 premium melted cheese options</p>
                </div>
                <span className="text-xs text-orange-400 font-semibold bg-orange-950/60 px-2.5 py-1 rounded-full border border-orange-800/40">
                  Required (1 Cheese)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {inventory.Cheese.map((item) => {
                  const isSelected = customPizza.cheese?._id === item._id;
                  const isOutOfStock = item.quantity <= 0;

                  return (
                    <div
                      key={item._id}
                      onClick={() => handleSelectCheese(item)}
                      className={`relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-orange-950/20 border-orange-500 ring-2 ring-orange-500/30'
                          : isOutOfStock
                          ? 'bg-stone-950/50 border-stone-900 opacity-50 cursor-not-allowed'
                          : 'bg-stone-900 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex gap-4">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-20 h-20 rounded-xl object-cover border border-stone-800"
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-white">{item.name}</h3>
                            {isSelected && (
                              <span className="p-1 bg-orange-600 text-white rounded-full">
                                <Check className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-stone-800/60 flex items-center justify-between text-xs">
                        <span className="font-extrabold text-orange-400">₹{item.price}</span>
                        <span
                          className={`text-[10px] font-semibold ${
                            isOutOfStock ? 'text-red-400' : 'text-stone-400'
                          }`}
                        >
                          {isOutOfStock ? 'Out of Stock' : `${item.quantity} in stock`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4: VEGETABLES */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Step 4 — Pick Fresh Vegetables</h2>
                  <p className="text-xs text-stone-400">Select as many farm-picked veggies as you desire</p>
                </div>
                <span className="text-xs text-emerald-400 font-semibold bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/40">
                  Multiple Selection Allowed
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {inventory.Vegetable.map((item) => {
                  const isSelected = customPizza.vegetables.some((v) => v._id === item._id);
                  const isOutOfStock = item.quantity <= 0;

                  return (
                    <div
                      key={item._id}
                      onClick={() => handleToggleVegetable(item)}
                      className={`relative p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between text-center ${
                        isSelected
                          ? 'bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/30'
                          : isOutOfStock
                          ? 'bg-stone-950/50 border-stone-900 opacity-50 cursor-not-allowed'
                          : 'bg-stone-900 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      <div className="relative mx-auto mb-2">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 rounded-xl object-cover border border-stone-800 mx-auto"
                        />
                        {isSelected && (
                          <span className="absolute -top-1.5 -right-1.5 p-1 bg-emerald-600 text-white rounded-full shadow">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-white line-clamp-1">{item.name}</h4>
                      <div className="mt-2 flex items-center justify-between text-[11px] pt-1 border-t border-stone-800/50">
                        <span className="text-emerald-400 font-extrabold">+₹{item.price}</span>
                        <span className="text-[10px] text-stone-500">{item.quantity} left</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom Step Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-stone-800">
            <button
              onClick={handleBack}
              disabled={step === 1}
              className="flex items-center px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-semibold rounded-xl border border-stone-800 disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </button>

            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex items-center px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-950 disabled:opacity-40 transition-all"
            >
              <span>{step === 4 ? 'Review Order & Checkout' : 'Next Step'}</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>

        {/* Right Column: Live Pizza Visualizer & Order Summary (4 cols) */}
        <div className="lg:col-span-4 space-y-6 sticky top-24">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-400 flex items-center justify-between">
              <span>Live Visualizer</span>
              <Pizza className="w-4 h-4 text-orange-500 animate-spin-slow" />
            </h3>

            {/* Interactive Pizza Visualizer */}
            <div className="relative w-56 h-56 mx-auto rounded-full bg-amber-950/20 border-4 border-amber-900/40 flex items-center justify-center p-3 shadow-inner overflow-hidden">
              {/* Dough Base */}
              <div
                className={`w-full h-full rounded-full transition-all duration-500 flex items-center justify-center ${
                  customPizza.base
                    ? 'bg-amber-100/90 shadow-2xl border-4 border-amber-600/80 scale-100'
                    : 'bg-stone-800/40 border-2 border-dashed border-stone-700'
                }`}
              >
                {/* Sauce Layer */}
                {customPizza.sauce && (
                  <div
                    className={`w-40 h-40 rounded-full transition-all duration-500 flex items-center justify-center ${
                      customPizza.sauce.name.includes('Tomato') || customPizza.sauce.name.includes('Arrabbiata')
                        ? 'bg-red-600/90'
                        : customPizza.sauce.name.includes('BBQ')
                        ? 'bg-amber-900/90'
                        : customPizza.sauce.name.includes('Pesto')
                        ? 'bg-emerald-700/90'
                        : 'bg-amber-50/90'
                    }`}
                  >
                    {/* Cheese Melt Layer */}
                    {customPizza.cheese && (
                      <div className="w-32 h-32 rounded-full bg-yellow-200/85 shadow-md flex flex-wrap items-center justify-center p-2 relative">
                        {/* Vegetable Scatter */}
                        {customPizza.vegetables.map((v, i) => (
                          <span
                            key={v._id}
                            className="w-3 h-3 m-1 rounded-full shadow-sm animate-ping-slow text-[8px] flex items-center justify-center font-bold"
                            style={{
                              backgroundColor:
                                v.name.includes('Tomato') || v.name.includes('Chili')
                                  ? '#ef4444'
                                  : v.name.includes('Capsicum') || v.name.includes('Spinach')
                                  ? '#10b981'
                                  : v.name.includes('Olive')
                                  ? '#1c1917'
                                  : v.name.includes('Corn')
                                  ? '#eab308'
                                  : '#f97316'
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Selection Breakdown */}
            <div className="space-y-2.5 text-xs border-t border-stone-800 pt-4">
              <div className="flex justify-between">
                <span className="text-stone-400">Base:</span>
                <span className="font-semibold text-white">
                  {customPizza.base ? `${customPizza.base.name} (₹${customPizza.base.price})` : '—'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-stone-400">Sauce:</span>
                <span className="font-semibold text-white">
                  {customPizza.sauce ? `${customPizza.sauce.name} (₹${customPizza.sauce.price})` : '—'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-stone-400">Cheese:</span>
                <span className="font-semibold text-white">
                  {customPizza.cheese ? `${customPizza.cheese.name} (₹${customPizza.cheese.price})` : '—'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-stone-400">Veggies ({customPizza.vegetables.length}):</span>
                <span className="font-semibold text-emerald-400">
                  {customPizza.vegetables.length > 0 ? `+₹${vegPrice}` : 'None'}
                </span>
              </div>
            </div>

            {/* Total Price */}
            <div className="p-4 bg-stone-950/80 rounded-2xl border border-stone-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-stone-500 uppercase font-bold block">Live Total</span>
                <span className="text-2xl font-black text-white">₹{totalPrice}</span>
              </div>

              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow transition-all disabled:opacity-30"
              >
                {step === 4 ? 'Checkout' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};