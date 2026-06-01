import { getBrandName } from '@/lib/store-config'

function rs(n: number): string {
  return 'Rs. ' + new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0)
}

function fmtDate(d: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(d))
}

/**
 * Opens a clean, structured A4 invoice in a new window and triggers print.
 * Works for any order object that includes `items` and `customer`.
 */
export function printInvoice(order: any) {
  const items: any[] = order.items || []
  const subtotal = order.subtotal || items.reduce((s, i) => s + (i.unit_price || 0) * (i.quantity || 0), 0)
  const discount = order.discount_amount || 0
  const tax = order.tax_amount || 0
  const total = order.total || 0
  const customer = order.customer || {}

  const rows = items.length
    ? items.map((it, i) => `
      <tr>
        <td class="c-num">${i + 1}</td>
        <td class="c-name">${it.product_name || 'Item'}</td>
        <td class="c-qty">${it.quantity || 1}</td>
        <td class="c-price">${rs(it.unit_price || 0)}</td>
        <td class="c-total">${rs(it.total || (it.unit_price || 0) * (it.quantity || 1))}</td>
      </tr>`).join('')
    : `<tr><td colspan="5" class="empty">No line items recorded for this order.</td></tr>`

  const paymentMethod = (order.payment_method || '').replace(/_/g, ' ')

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Invoice ${order.order_number}</title>
<style>
  @page { size: A4; margin: 16mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1f2937; font-size: 13px; line-height: 1.5; }

  .invoice { max-width: 800px; margin: 0 auto; }

  /* Header */
  .head { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 3px solid #EC4899; }
  .brand { font-size: 28px; font-weight: 800; background: linear-gradient(120deg,#EC4899,#8B5CF6); -webkit-background-clip: text; background-clip: text; color: transparent; letter-spacing: -0.5px; }
  .brand-sub { font-size: 11px; color: #9ca3af; margin-top: 2px; letter-spacing: 1px; text-transform: uppercase; }
  .doc-title { text-align: right; }
  .doc-title h1 { font-size: 24px; color: #EC4899; letter-spacing: 1px; }
  .doc-title .num { font-family: monospace; font-size: 13px; color: #6b7280; margin-top: 4px; }

  /* Meta row */
  .meta { display: flex; justify-content: space-between; margin: 24px 0; gap: 24px; }
  .meta .block { flex: 1; }
  .meta .label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin-bottom: 4px; font-weight: 600; }
  .meta .value { font-size: 13px; color: #1f2937; }
  .meta .value strong { display: block; font-size: 14px; margin-bottom: 2px; }

  /* Status pill */
  .pill { display: inline-block; padding: 3px 12px; border-radius: 999px; font-size: 11px; font-weight: 600; text-transform: capitalize; }
  .pill.delivered { background: #dcfce7; color: #15803d; }
  .pill.pending { background: #fef9c3; color: #a16207; }
  .pill.processing { background: #f3e8ff; color: #7e22ce; }
  .pill.cancelled { background: #fee2e2; color: #b91c1c; }
  .pill.shipped { background: #e0e7ff; color: #4338ca; }
  .pill.confirmed { background: #dbeafe; color: #1d4ed8; }

  /* Items table */
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  thead th { background: #fdf2f8; color: #831843; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; padding: 10px 12px; border-bottom: 2px solid #fbcfe8; }
  tbody td { padding: 11px 12px; border-bottom: 1px solid #f3f4f6; }
  .c-num { width: 36px; color: #9ca3af; }
  .c-qty { width: 50px; text-align: center; }
  .c-price, .c-total { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .c-total { font-weight: 600; }
  .c-name { font-weight: 500; }
  .empty { text-align: center; color: #9ca3af; padding: 24px; }

  /* Totals */
  .totals { display: flex; justify-content: flex-end; margin-top: 20px; }
  .totals .box { width: 280px; }
  .totals .line { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #4b5563; }
  .totals .line.discount { color: #16a34a; }
  .totals .grand { display: flex; justify-content: space-between; padding: 12px 0 0; margin-top: 6px; border-top: 2px solid #EC4899; font-size: 18px; font-weight: 800; color: #831843; }

  /* Footer */
  .foot { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 11px; }
  .foot .thanks { font-size: 14px; color: #EC4899; font-weight: 600; margin-bottom: 4px; }

  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
  <div class="invoice">
    <div class="head">
      <div>
        <div class="brand">${getBrandName()}</div>
        <div class="brand-sub">Luxury Cosmetics · Kathmandu, Nepal</div>
      </div>
      <div class="doc-title">
        <h1>INVOICE</h1>
        <div class="num">${order.order_number}</div>
      </div>
    </div>

    <div class="meta">
      <div class="block">
        <div class="label">Billed To</div>
        <div class="value">
          <strong>${customer.full_name || 'Walk-in Customer'}</strong>
          ${customer.email ? `${customer.email}<br/>` : ''}
          ${customer.phone ? `${customer.phone}` : ''}
        </div>
      </div>
      <div class="block">
        <div class="label">Invoice Date</div>
        <div class="value">${fmtDate(order.created_at)}</div>
        <div class="label" style="margin-top:10px">Payment</div>
        <div class="value" style="text-transform:capitalize">${paymentMethod || '—'} · ${order.payment_status || 'paid'}</div>
      </div>
      <div class="block" style="text-align:right">
        <div class="label">Status</div>
        <span class="pill ${order.status}">${order.status}</span>
        ${order.is_pos_order ? '<div class="value" style="margin-top:8px;font-size:11px;color:#9ca3af">In-store POS sale</div>' : ''}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th class="c-num">#</th>
          <th>Item</th>
          <th class="c-qty">Qty</th>
          <th class="c-price">Unit Price</th>
          <th class="c-total">Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="totals">
      <div class="box">
        <div class="line"><span>Subtotal</span><span>${rs(subtotal)}</span></div>
        ${discount > 0 ? `<div class="line discount"><span>Discount</span><span>- ${rs(discount)}</span></div>` : ''}
        <div class="line"><span>VAT (13%)</span><span>${rs(tax)}</span></div>
        <div class="grand"><span>Total</span><span>${rs(total)}</span></div>
      </div>
    </div>

    <div class="foot">
      <div class="thanks">Thank you for shopping with ${getBrandName()}!</div>
      <div>This is a computer-generated invoice. For queries, contact hello@glowlux.com</div>
    </div>
  </div>
  <script>window.onload = function(){ window.print(); setTimeout(function(){ window.close(); }, 200); };</script>
</body>
</html>`

  const win = window.open('', '_blank', 'width=820,height=900')
  if (!win) { alert('Please allow popups to print the invoice.'); return }
  win.document.write(html)
  win.document.close()
}
