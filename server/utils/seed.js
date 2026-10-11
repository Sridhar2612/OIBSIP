require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Pizza = require('../models/Pizza');
const Inventory = require('../models/Inventory');
const InventoryTransaction = require('../models/InventoryTransaction');
const Order = require('../models/Order');
const Payment = require('../models/Payment');

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/pizza_delivery_platform';
    console.log(`Connecting to database for seeding at: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('Clearing existing database collections...');
    await User.deleteMany({});
    await Pizza.deleteMany({});
    await Inventory.deleteMany({});
    await InventoryTransaction.deleteMany({});
    await Order.deleteMany({});
    await Payment.deleteMany({});

    console.log('Seeding Users (Admin & Customer)...');
    const adminUser = await User.create({
      name: 'SliceCraft Admin',
      email: process.env.ADMIN_EMAIL || 'admin@slicecraft.com',
      password: 'Admin@123456',
      role: 'admin',
      isVerified: true,
      phone: '+91 9876543210',
      address: {
        street: '100 Gourmet Plaza',
        city: 'Bengaluru',
        state: 'Karnataka',
        zipCode: '560001'
      }
    });

    const demoCustomer = await User.create({
      name: 'Priya Sharma',
      email: 'customer@slicecraft.com',
      password: 'Customer@123456',
      role: 'user',
      isVerified: true,
      phone: '+91 9123456780',
      address: {
        street: '42 Baker Street, Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        zipCode: '560038'
      }
    });

    console.log('Seeding Inventory Items...');

    const inventoryData = [
      // 5 BASES
      {
        name: 'Classic Hand-Tossed Base',
        category: 'Base',
        description: 'Traditional fermented dough with crispy edges and soft airy center.',
        image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&auto=format&fit=crop&q=60',
        quantity: 50,
        unit: 'piece',
        threshold: 15,
        price: 99,
        isAvailable: true
      },
      {
        name: 'Crispy Thin Crust Base',
        category: 'Base',
        description: 'Ultra-thin, light, and crunchy authentic Italian crust.',
        image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=500&auto=format&fit=crop&q=60',
        quantity: 45,
        unit: 'piece',
        threshold: 15,
        price: 119,
        isAvailable: true
      },
      {
        name: 'Cheese Burst Crust Base',
        category: 'Base',
        description: 'Molten liquid mozzarella core sealed inside rich golden dough.',
        image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60',
        quantity: 35,
        unit: 'piece',
        threshold: 12,
        price: 179,
        isAvailable: true
      },
      {
        name: 'Whole Wheat Organic Base',
        category: 'Base',
        description: 'Nutrient-rich stone-ground whole wheat crust for health enthusiasts.',
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop&q=60',
        quantity: 40,
        unit: 'piece',
        threshold: 10,
        price: 139,
        isAvailable: true
      },
      {
        name: 'Rustic Multigrain Base',
        category: 'Base',
        description: 'Infused with flax, chia, oats, and toasted sesame seeds.',
        image: 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?w=500&auto=format&fit=crop&q=60',
        quantity: 30,
        unit: 'piece',
        threshold: 10,
        price: 149,
        isAvailable: true
      },

      // 5 SAUCES
      {
        name: 'Classic San Marzano Tomato Sauce',
        category: 'Sauce',
        description: 'Sun-ripened Italian plum tomatoes simmered with fresh sweet basil and extra virgin olive oil.',
        image: 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=500&auto=format&fit=crop&q=60',
        quantity: 60,
        unit: 'portion',
        threshold: 20,
        price: 39,
        isAvailable: true
      },
      {
        name: 'Spicy Arrabbiata Chili Sauce',
        category: 'Sauce',
        description: 'Fiery roasted garlic sauce infused with crushed red bird-eye chilies.',
        image: 'https://images.unsplash.com/photo-1588833946439-44d222ca1b12?w=500&auto=format&fit=crop&q=60',
        quantity: 50,
        unit: 'portion',
        threshold: 15,
        price: 49,
        isAvailable: true
      },
      {
        name: 'Smoky Chipotle BBQ Sauce',
        category: 'Sauce',
        description: 'Rich, hickory wood-smoked glaze with subtle molasses sweetness.',
        image: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=500&auto=format&fit=crop&q=60',
        quantity: 40,
        unit: 'portion',
        threshold: 12,
        price: 55,
        isAvailable: true
      },
      {
        name: 'Genoese Basil Pesto',
        category: 'Sauce',
        description: 'Aromatic crushed fresh basil, toasted pine nuts, and aged parmesan.',
        image: 'https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?w=500&auto=format&fit=crop&q=60',
        quantity: 35,
        unit: 'portion',
        threshold: 10,
        price: 69,
        isAvailable: true
      },
      {
        name: 'Creamy Roasted Garlic Alfredo',
        category: 'Sauce',
        description: 'Velvety cream reduction with caramelized whole garlic cloves.',
        image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=500&auto=format&fit=crop&q=60',
        quantity: 30,
        unit: 'portion',
        threshold: 10,
        price: 59,
        isAvailable: true
      },

      // 4 CHEESES
      {
        name: 'Fior di Latte Fresh Mozzarella',
        category: 'Cheese',
        description: 'Creamy artisan whole-milk pulled curd with exceptional golden stretch.',
        image: 'https://images.unsplash.com/photo-1559561853-08451507cbe7?w=500&auto=format&fit=crop&q=60',
        quantity: 70,
        unit: 'portion',
        threshold: 20,
        price: 69,
        isAvailable: true
      },
      {
        name: 'Sharp Aged Cheddar',
        category: 'Cheese',
        description: 'Bold, tangy English farmhouse cheddar aged for 12 months.',
        image: 'https://images.unsplash.com/photo-1618164435735-413d3b066c9a?w=500&auto=format&fit=crop&q=60',
        quantity: 45,
        unit: 'portion',
        threshold: 15,
        price: 79,
        isAvailable: true
      },
      {
        name: 'Parmigiano-Reggiano Parmesan',
        category: 'Cheese',
        description: 'Granular, savory Italian umami shaved cheese.',
        image: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=500&auto=format&fit=crop&q=60',
        quantity: 40,
        unit: 'portion',
        threshold: 12,
        price: 89,
        isAvailable: true
      },
      {
        name: 'Quad-Formaggi Four Cheese Blend',
        category: 'Cheese',
        description: 'Decadent fusion of Mozzarella, Gouda, Fontina, and Gorgonzola.',
        image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=60',
        quantity: 35,
        unit: 'portion',
        threshold: 10,
        price: 99,
        isAvailable: true
      },

      // 8 VEGETABLES
      {
        name: 'Crisp Red Onion Slivers',
        category: 'Vegetable',
        description: 'Sweet and crunchy julienned red onions.',
        image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=500&auto=format&fit=crop&q=60',
        quantity: 80,
        unit: 'portion',
        threshold: 25,
        price: 25,
        isAvailable: true
      },
      {
        name: 'Green Bell Capsicum',
        category: 'Vegetable',
        description: 'Fresh farm-picked vibrant bell pepper dices.',
        image: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=500&auto=format&fit=crop&q=60',
        quantity: 75,
        unit: 'portion',
        threshold: 20,
        price: 25,
        isAvailable: true
      },
      {
        name: 'Roma Cherry Tomatoes',
        category: 'Vegetable',
        description: 'Sweet, juicy vine-ripened miniature tomatoes.',
        image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=60',
        quantity: 70,
        unit: 'portion',
        threshold: 20,
        price: 30,
        isAvailable: true
      },
      {
        name: 'Fresh Button Mushrooms',
        category: 'Vegetable',
        description: 'Earthy, sliced white button mushrooms.',
        image: 'https://images.unsplash.com/photo-1504544750208-dc0358e63f7f?w=500&auto=format&fit=crop&q=60',
        quantity: 50,
        unit: 'portion',
        threshold: 15,
        price: 35,
        isAvailable: true
      },
      {
        name: 'Spanish Black Olives',
        category: 'Vegetable',
        description: 'Pitted, tender Mediterranean black olive rings.',
        image: 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?w=500&auto=format&fit=crop&q=60',
        quantity: 65,
        unit: 'portion',
        threshold: 18,
        price: 35,
        isAvailable: true
      },
      {
        name: 'Spicy Pickled Jalapenos',
        category: 'Vegetable',
        description: 'Zesty Mexican sliced green jalapeno peppers with high kick.',
        image: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=500&auto=format&fit=crop&q=60',
        quantity: 55,
        unit: 'portion',
        threshold: 15,
        price: 30,
        isAvailable: true
      },
      {
        name: 'Sweet American Golden Corn',
        category: 'Vegetable',
        description: 'Steamed crisp and naturally sweet corn kernels.',
        image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=500&auto=format&fit=crop&q=60',
        quantity: 60,
        unit: 'portion',
        threshold: 18,
        price: 30,
        isAvailable: true
      },
      {
        name: 'Tender Baby Spinach Leaves',
        category: 'Vegetable',
        description: 'Fresh organic green baby spinach.',
        image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500&auto=format&fit=crop&q=60',
        quantity: 40,
        unit: 'portion',
        threshold: 12,
        price: 35,
        isAvailable: true
      }
    ];

    const insertedInventory = await Inventory.insertMany(inventoryData);
    console.log(`Seeded ${insertedInventory.length} inventory items.`);

    // Record initial inventory stock transactions
    const initialTx = insertedInventory.map((item) => ({
      item: item._id,
      itemName: item.name,
      type: 'MANUAL_ADD',
      quantity: item.quantity,
      stockAfter: item.quantity,
      reason: 'Initial system inventory stock provisioning',
      performedBy: adminUser._id
    }));
    await InventoryTransaction.insertMany(initialTx);

    console.log('Seeding Pre-Configured Pizza Catalog...');

    const pizzasData = [
      {
        name: 'Classic Margherita Royale',
        description: 'Timeless classic with Italian San Marzano marinara, torn fresh mozzarella, aromatic basil, and virgin olive oil.',
        image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=600&auto=format&fit=crop&q=80',
        category: 'Veg',
        price: 329,
        ingredients: ['San Marzano Tomato', 'Fresh Mozzarella', 'Sweet Basil', 'Olive Oil'],
        isAvailable: true
      },
      {
        name: 'Rustic Farmhouse Special',
        description: 'Crisp capsicum, Roma cherry tomatoes, sweet golden corn, red onion, and generous layer of mozzarella cheese.',
        image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&auto=format&fit=crop&q=80',
        category: 'Veg',
        price: 429,
        ingredients: ['Capsicum', 'Cherry Tomato', 'Sweet Corn', 'Red Onion', 'Mozzarella'],
        isAvailable: true
      },
      {
        name: 'Fiery Pepperoni Feast',
        description: 'Layered with premium cured Italian pepperoni slices, mozzarella, and a dash of hot chili flakes.',
        image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&auto=format&fit=crop&q=80',
        category: 'Non-Veg',
        price: 549,
        ingredients: ['Smoked Pepperoni', 'Mozzarella', 'Chili Flakes', 'Tomato Sauce'],
        isAvailable: true
      },
      {
        name: 'Supreme Garden Veggie Fiesta',
        description: 'Loaded with black olives, button mushrooms, jalapenos, crunchy capsicum, onion, and cheddar blend.',
        image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
        category: 'Veg',
        price: 469,
        ingredients: ['Black Olives', 'Mushrooms', 'Jalapenos', 'Capsicum', 'Cheddar Blend'],
        isAvailable: true
      },
      {
        name: 'Smoked BBQ Chicken Flame',
        description: 'Tender pulled chicken tossed in smoky chipotle BBQ sauce with caramelized onions and double mozzarella.',
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80',
        category: 'Non-Veg',
        price: 529,
        ingredients: ['BBQ Chicken', 'Smoky BBQ Sauce', 'Caramelized Onion', 'Mozzarella'],
        isAvailable: true
      },
      {
        name: 'Tandoori Paneer Tikka Blast',
        description: 'Charcoal-grilled paneer cubes marinated in rich Indian spices, red capsicum, mint drizzle, and spiced onion.',
        image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=600&auto=format&fit=crop&q=80',
        category: 'Veg',
        price: 459,
        ingredients: ['Paneer Tikka', 'Spicy Arrabbiata', 'Capsicum', 'Mint Chutney', 'Mozzarella'],
        isAvailable: true
      },
      {
        name: 'Ultimate Cheese Volcano Burst',
        description: 'For genuine cheese lovers — loaded with Mozzarella, Aged Cheddar, Parmesan, and Gorgonzola lava filling.',
        image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80',
        category: 'Specialty',
        price: 499,
        ingredients: ['Mozzarella', 'Aged Cheddar', 'Parmigiano-Reggiano', 'Gorgonzola'],
        isAvailable: true
      },
      {
        name: 'Wild Truffle & Garlic Mushroom',
        description: 'Gourmet wild sauteed portobello and button mushrooms with creamy garlic Alfredo sauce, spinach, and truffle essence.',
        image: 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?w=600&auto=format&fit=crop&q=80',
        category: 'Gourmet',
        price: 579,
        ingredients: ['Button Mushroom', 'Baby Spinach', 'Garlic Alfredo', 'Truffle Oil', 'Parmesan'],
        isAvailable: true
      }
    ];

    const insertedPizzas = await Pizza.insertMany(pizzasData);
    console.log(`Seeded ${insertedPizzas.length} signature pizzas.`);

    console.log('====================================================');
    console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
    console.log(`👑 Admin Account: ${adminUser.email} / Admin@123456`);
    console.log(`👤 Customer Account: ${demoCustomer.email} / Customer@123456`);
    console.log(`📦 Inventory: ${insertedInventory.length} items`);
    console.log(`🍕 Pizzas: ${insertedPizzas.length} items`);
    console.log('====================================================');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Seeding Failed:', error);
    process.exit(1);
  }
};

seedDatabase();
