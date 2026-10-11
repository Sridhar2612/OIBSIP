const http = require('http');
const assert = require('assert');

const BASE_URL = 'http://localhost:5000/api';

const request = (path, method = 'GET', body = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const postData = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    if (postData) {
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(
      url,
      {
        method,
        headers: reqHeaders
      },
      (res) => {
        let resData = '';
        res.on('data', (chunk) => (resData += chunk));
        res.on('end', () => {
          try {
            const parsed = resData ? JSON.parse(resData) : null;
            resolve({ status: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, raw: resData });
          }
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
};

const runAllTests = async () => {
  console.log('====================================================');
  console.log('🧪 SLICECRAFT PIZZA PLATFORM — AUTOMATED TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const test = async (name, fn) => {
    try {
      process.stdout.write(`⏳ Testing: ${name}... `);
      await fn();
      console.log('✅ PASSED');
      passed++;
    } catch (error) {
      console.log('❌ FAILED');
      console.error(`   Error: ${error.message}`);
      failed++;
    }
  };

  let adminToken = '';
  let customerToken = '';
  let samplePizzaId = '';
  let sampleBaseId = '';
  let sampleSauceId = '';
  let sampleCheeseId = '';

  // 1. Health Check
  await test('GET /api/health — API Liveness', async () => {
    const res = await request('/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
  });

  // 2. Auth: Customer Login
  await test('POST /api/auth/login — Customer Authentication', async () => {
    const res = await request('/auth/login', 'POST', {
      email: 'customer@slicecraft.com',
      password: 'Customer@123456'
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.token);
    assert.strictEqual(res.data.data.user.role, 'user');
    customerToken = res.data.data.token;
  });

  // 3. Auth: Admin Login
  await test('POST /api/auth/admin/login — Admin Authentication', async () => {
    const res = await request('/auth/admin/login', 'POST', {
      email: 'admin@slicecraft.com',
      password: 'Admin@123456'
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.token);
    assert.strictEqual(res.data.data.user.role, 'admin');
    adminToken = res.data.data.token;
  });

  // 4. Auth: Role Guard
  await test('GET /api/admin/stats — Role Guard Denial for Customer Token', async () => {
    const res = await request('/admin/stats', 'GET', null, {
      Authorization: `Bearer ${customerToken}`
    });
    assert.strictEqual(res.status, 403);
  });

  // 5. Pizza Catalog
  await test('GET /api/pizzas — Catalog Browsing', async () => {
    const res = await request('/pizzas');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(Array.isArray(res.data.data.pizzas));
    assert.ok(res.data.data.pizzas.length >= 8);
    samplePizzaId = res.data.data.pizzas[0]._id;
  });

  // 6. Pizza Details
  await test('GET /api/pizzas/:id — Single Pizza Retrieval', async () => {
    const res = await request(`/pizzas/${samplePizzaId}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.pizza._id, samplePizzaId);
  });

  // 7. Inventory Ingredients
  await test('GET /api/inventory — 22 Stock Item Integrity', async () => {
    const res = await request('/inventory');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    const { Base, Sauce, Cheese, Vegetable } = res.data.data.grouped;
    assert.strictEqual(Base.length, 5, 'Should have exactly 5 bases');
    assert.strictEqual(Sauce.length, 5, 'Should have exactly 5 sauces');
    assert.strictEqual(Cheese.length, 4, 'Should have exactly 4 cheeses');
    assert.strictEqual(Vegetable.length, 8, 'Should have exactly 8 vegetables');

    sampleBaseId = Base[0]._id;
    sampleSauceId = Sauce[0]._id;
    sampleCheeseId = Cheese[0]._id;
  });

  // 8. Order Placement & Server-Side Price Recalculation
  await test('POST /api/orders — Server-Side Price & Order Creation', async () => {
    const orderPayload = {
      items: [
        {
          itemType: 'CUSTOM',
          base: { id: sampleBaseId },
          sauce: { id: sampleSauceId },
          cheese: { id: sampleCheeseId },
          vegetables: [],
          quantity: 1
        }
      ],
      deliveryAddress: {
        name: 'Test Customer',
        phone: '+91 9876543210',
        street: '12 Brigade Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        zipCode: '560001'
      }
    };

    const res = await request('/orders', 'POST', orderPayload, {
      Authorization: `Bearer ${customerToken}`
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.order.orderId);
    assert.ok(res.data.data.order.finalAmount > 0);
  });

  // 9. Admin Stats API
  await test('GET /api/admin/stats — Admin Operations Metrics', async () => {
    const res = await request('/admin/stats', 'GET', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.stats.totalOrders >= 1);
  });

  // 10. Admin Orders Management
  await test('GET /api/admin/orders — Admin Order Queue', async () => {
    const res = await request('/admin/orders', 'GET', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(Array.isArray(res.data.data.orders));
  });

  // 11. Admin Inventory Management
  await test('GET /api/admin/inventory — Inventory Restock Hub', async () => {
    const res = await request('/admin/inventory', 'GET', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(Array.isArray(res.data.data.inventory));
  });

  // 12. Watchdog Scan Trigger
  await test('POST /api/admin/inventory/check-alerts — Watchdog Scanner', async () => {
    const res = await request('/admin/inventory/check-alerts', 'POST', {}, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
  });

  console.log('\n====================================================');
  console.log(`📊 TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runAllTests().catch((e) => {
  console.error('Fatal test runner error:', e);
  process.exit(1);
});
