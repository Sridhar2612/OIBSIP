const cron = require('node-cron');
const Inventory = require('../models/Inventory');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

/**
 * Checks all inventory items and dispatches email alert if any item is at or below threshold
 */
const runInventoryCheck = async () => {
  try {
    console.log('[Inventory Watchdog]: Scanning inventory stock levels...');
    const allItems = await Inventory.find();
    const lowStockItems = allItems.filter(
      (item) => item.quantity <= (item.threshold !== undefined ? item.threshold : 15)
    );

    if (lowStockItems.length === 0) {
      console.log('[Inventory Watchdog]: All 22 ingredients have healthy stock levels. ✅');
      return { triggered: false, count: 0 };
    }

    console.log(`⚠️ [Inventory Watchdog Alert]: ${lowStockItems.length} items below safety threshold!`);

    // Find admin users to notify
    const admins = await User.find({ role: 'admin' });
    const adminEmails = admins.map((a) => a.email);
    if (adminEmails.length === 0) {
      adminEmails.push(process.env.ADMIN_EMAIL || 'admin@slicecraft.com');
    }

    const itemsRowsHtml = lowStockItems
      .map(
        (item) => `
        <tr style="border-bottom: 1px solid #292524;">
          <td style="padding: 10px; font-weight: bold; color: #ffffff;">${item.name}</td>
          <td style="padding: 10px; color: #f97316;">${item.category}</td>
          <td style="padding: 10px; font-weight: bold; color: ${item.quantity === 0 ? '#ef4444' : '#f59e0b'};">
            ${item.quantity} ${item.unit}
          </td>
          <td style="padding: 10px; color: #a8a29e;">${item.threshold || 15} ${item.unit}</td>
        </tr>`
      )
      .join('');

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: auto; padding: 24px; background-color: #1c1917; color: #f5f5f4; border-radius: 16px; border: 1px solid #78350f;">
        <h2 style="color: #f59e0b; margin-top: 0;">⚠️ Low Inventory Stock Alert — SliceCraft Operations</h2>
        <p style="font-size: 14px; color: #d6d3d1; line-height: 1.6;">
          The automated inventory watchdog detected <strong>${lowStockItems.length} ingredient(s)</strong> that have reached or fallen below their required safety thresholds. Please restock immediately to avoid order fulfillment disruption.
        </p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; text-align: left; background-color: #0c0a09; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background-color: #292524; color: #d6d3d1;">
              <th style="padding: 10px;">Ingredient</th>
              <th style="padding: 10px;">Category</th>
              <th style="padding: 10px;">Current Stock</th>
              <th style="padding: 10px;">Threshold</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRowsHtml}
          </tbody>
        </table>

        <div style="margin: 24px 0;">
          <a href="http://localhost:5173/admin/dashboard" style="background-color: #ea580c; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Open Admin Restock Console
          </a>
        </div>

        <p style="font-size: 11px; color: #78716c; border-top: 1px solid #292524; padding-top: 12px;">
          SliceCraft Pizza Automated Watchdog • Scheduled execution every 30 minutes.
        </p>
      </div>
    `;

    for (const email of adminEmails) {
      await sendEmail({
        to: email,
        subject: `⚠️ Low Stock Alert: ${lowStockItems.length} ingredients require restocking — SliceCraft`,
        html: emailHtml
      });
    }

    return { triggered: true, count: lowStockItems.length, items: lowStockItems };
  } catch (error) {
    console.error('[Inventory Watchdog Error]:', error.message);
    return { triggered: false, error: error.message };
  }
};

/**
 * Initialize recurring cron job (Runs every 30 minutes)
 */
const initInventoryWatchdog = () => {
  cron.schedule('*/30 * * * *', () => {
    runInventoryCheck();
  });
  console.log('⏰ [Cron Initialized]: Inventory Watchdog scheduled to scan every 30 minutes.');
};

module.exports = {
  initInventoryWatchdog,
  runInventoryCheck
};
