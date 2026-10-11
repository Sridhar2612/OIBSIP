import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('slicecraft_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // Custom Pizza in-progress builder state
  const [customPizza, setCustomPizza] = useState({
    base: null,
    sauce: null,
    cheese: null,
    vegetables: [], // array of selected vegetable objects
    quantity: 1
  });

  useEffect(() => {
    localStorage.setItem('slicecraft_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addCustomPizzaToCart = () => {
    const vegPrice = customPizza.vegetables.reduce((sum, v) => sum + v.price, 0);
    const unitPrice = (customPizza.base?.price || 0) + (customPizza.sauce?.price || 0) + (customPizza.cheese?.price || 0) + vegPrice;

    const newItem = {
      id: 'custom_' + Date.now(),
      itemType: 'CUSTOM',
      name: `Custom Artisanal Pie (${customPizza.base?.name?.split(' ')[0]})`,
      base: customPizza.base,
      sauce: customPizza.sauce,
      cheese: customPizza.cheese,
      vegetables: customPizza.vegetables,
      unitPrice,
      quantity: customPizza.quantity || 1,
      totalPrice: unitPrice * (customPizza.quantity || 1)
    };

    setCartItems([newItem]); // We store current order in cart
    return newItem;
  };

  const resetCustomPizza = () => {
    setCustomPizza({
      base: null,
      sauce: null,
      cheese: null,
      vegetables: [],
      quantity: 1
    });
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('slicecraft_cart');
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        customPizza,
        setCustomPizza,
        addCustomPizzaToCart,
        resetCustomPizza,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);