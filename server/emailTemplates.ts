// HTML email template generator for order invoices

interface InvoiceItem {
  product: { title: string; image?: string };
  quantity: number;
  price: number;
}

interface InvoiceOrder {
  id: string;
  total: number;
  status: string;
  items: InvoiceItem[];
  createdAt: Date | string;
  customerName?: string | null;
  customerPhone?: string | null;
  streetAddress?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  paymentMethod?: string | null;
  deliveryCharge?: number | null;
  advancePaid?: number | null;
}

export function generateInvoiceEmail(order: InvoiceOrder, userEmail: string): { subject: string; html: string } {
  const subtotal = order.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const delivery = order.deliveryCharge ?? 100;
  const advance = order.advancePaid;
  const isCoD = order.paymentMethod === 'cod';

  const paymentMethodLabel = order.paymentMethod === 'cod'
    ? 'Cash on Delivery (Partial COD)'
    : order.paymentMethod === 'upi'
      ? 'UPI'
      : 'Card';

  const orderRef = order.id.slice(-10).toUpperCase();
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const itemRows = order.items.map(item => `
        <tr>
            <td style="padding: 14px 16px; border-bottom: 1px solid #f0f0f0; font-size: 14px; color: #333;">${item.product.title}</td>
            <td style="padding: 14px 16px; border-bottom: 1px solid #f0f0f0; font-size: 14px; color: #666; text-align: center;">×${item.quantity}</td>
            <td style="padding: 14px 16px; border-bottom: 1px solid #f0f0f0; font-size: 14px; color: #666; text-align: right;">₹${item.price.toFixed(2)}</td>
            <td style="padding: 14px 16px; border-bottom: 1px solid #f0f0f0; font-size: 14px; font-weight: 700; color: #111; text-align: right;">₹${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
    `).join('');

  const subject = `🛍️ Pricekam Order Confirmed — #${orderRef}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Order Invoice — Pricekam</title>
</head>
<body style="margin:0; padding:0; background:#f5f5f5; font-family: 'Segoe UI', Arial, sans-serif;">
  <div style="max-width:680px; margin:40px auto; background:#fff; border-radius:24px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 40px 48px; text-align:center;">
      <div style="font-size:40px; margin-bottom:12px;">🛒</div>
      <h1 style="margin:0; color:#fff; font-size:28px; font-weight:900; letter-spacing:-0.5px;">PRICEKAM</h1>
      <p style="margin:8px 0 0; color:rgba(255,255,255,0.8); font-size:13px; letter-spacing:2px; text-transform:uppercase;">Order Confirmed!</p>
    </div>

    <!-- Hero Message -->
    <div style="padding: 36px 48px 24px; text-align: center; border-bottom: 1px solid #f0f0f0;">
      <h2 style="margin:0 0 8px; font-size:22px; color:#111; font-weight:800;">Victory is Yours! 🏆</h2>
      <p style="margin:0; color:#666; font-size:14px; line-height:1.6;">Thank you for your order. Here's your digital invoice for reference.</p>
      <div style="display:inline-block; margin-top:20px; padding:8px 24px; background:#f3e8ff; border-radius:100px;">
        <span style="color:#7c3aed; font-weight:800; font-size:13px; letter-spacing:1px;">ORDER #${orderRef}</span>
      </div>
      <p style="margin:8px 0 0; color:#999; font-size:12px;">${orderDate}</p>
    </div>

    <!-- Delivery Address + Payment -->
    <div style="padding: 28px 48px; display:flex; gap:24px; border-bottom:1px solid #f0f0f0; background:#fafafa;">
      <div style="flex:1;">
        <p style="margin:0 0 8px; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:2px; color:#7c3aed;">Deliver To</p>
        <p style="margin:0; font-size:15px; font-weight:700; color:#111;">${order.customerName || '—'}</p>
        <p style="margin:4px 0 0; font-size:13px; color:#666; line-height:1.6;">${order.streetAddress || ''}<br/>${order.city || ''}, ${order.state || ''} ${order.pincode || ''}</p>
        <p style="margin:8px 0 0; font-size:13px; color:#888;">${order.customerPhone || ''}</p>
      </div>
      <div style="flex:1; text-align:right;">
        <p style="margin:0 0 8px; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:2px; color:#7c3aed;">Payment</p>
        <p style="margin:0; font-size:14px; font-weight:700; color:#111;">${paymentMethodLabel}</p>
        <div style="margin-top:10px; display:inline-block; padding:6px 14px; background:#dcfce7; border-radius:100px;">
          <span style="color:#16a34a; font-size:11px; font-weight:800;">✓ VERIFIED</span>
        </div>
      </div>
    </div>

    <!-- Items Table -->
    <div style="padding: 28px 48px;">
      <p style="margin:0 0 16px; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:2px; color:#999;">Order Items</p>
      <table style="width:100%; border-collapse:collapse;">
        <thead>
          <tr style="border-bottom:2px solid #111;">
            <th style="padding:10px 16px; text-align:left; font-size:10px; text-transform:uppercase; letter-spacing:1.5px; color:#999;">Product</th>
            <th style="padding:10px 16px; text-align:center; font-size:10px; text-transform:uppercase; letter-spacing:1.5px; color:#999;">Qty</th>
            <th style="padding:10px 16px; text-align:right; font-size:10px; text-transform:uppercase; letter-spacing:1.5px; color:#999;">Unit Price</th>
            <th style="padding:10px 16px; text-align:right; font-size:10px; text-transform:uppercase; letter-spacing:1.5px; color:#999;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>
    </div>

    <!-- Totals -->
    <div style="padding: 0 48px 32px;">
      <div style="background:#f9f9f9; border-radius:16px; padding:24px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
          <span style="font-size:13px; color:#666;">Subtotal</span>
          <span style="font-size:13px; font-weight:600; color:#111;">₹${subtotal.toFixed(2)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
          <span style="font-size:13px; color:#666;">Delivery Charge</span>
          <span style="font-size:13px; font-weight:600; color:${delivery === 0 ? '#16a34a' : '#111'};">${delivery === 0 ? 'FREE ✓' : `₹${delivery.toFixed(2)}`}</span>
        </div>
        ${isCoD && advance ? `
        <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
          <span style="font-size:13px; color:#666;">Advance Paid (via Razorpay)</span>
          <span style="font-size:13px; font-weight:600; color:#7c3aed;">₹${advance.toFixed(2)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
          <span style="font-size:13px; color:#666;">Balance Due on Delivery</span>
          <span style="font-size:13px; font-weight:600; color:#f97316;">₹${(order.total - advance).toFixed(2)}</span>
        </div>
        ` : ''}
        <div style="border-top:2px solid #111; margin-top:12px; padding-top:16px; display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:12px; font-weight:800; text-transform:uppercase; letter-spacing:2px; color:#111;">Grand Total</span>
          <span style="font-size:28px; font-weight:900; color:#7c3aed;">₹${order.total.toFixed(2)}</span>
        </div>
      </div>
    </div>

    <!-- Expected Delivery -->
    <div style="padding: 0 48px 28px;">
      <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:16px; padding:16px 20px; display:flex; align-items:center; gap:16px;">
        <span style="font-size:28px;">🚚</span>
        <div>
          <p style="margin:0 0 2px; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:2px; color:#2563eb;">Expected Delivery</p>
          <p style="margin:0; font-size:15px; font-weight:800; color:#111;">7 – 10 Business Days</p>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#111; padding:32px 48px; text-align:center;">
      <p style="margin:0 0 8px; color:#fff; font-size:14px; font-weight:800; letter-spacing:2px; text-transform:uppercase;">Thank You for Shopping!</p>
      <p style="margin:0 0 16px; color:#666; font-size:12px;">This is a computer-generated invoice. No signature required.</p>
      <p style="margin:0; color:#555; font-size:11px;">Questions? Email us at <a href="mailto:support@pricekam.com" style="color:#a855f7;">support@pricekam.com</a></p>
      <div style="margin-top:20px;">
        <span style="color:#a855f7; font-size:20px;">★★★★★</span>
      </div>
    </div>

  </div>
</body>
</html>
    `;

  return { subject, html };
}
