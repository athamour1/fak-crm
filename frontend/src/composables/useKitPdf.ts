import QRCode from 'qrcode';
import { date } from 'quasar';

interface KitItem {
  name: string;
  category?: string | null;
  unit?: string | null;
  quantity: number;
  locationInKit?: string | null;
  expirationDate?: string | null;
  isValid?: boolean;
}

interface Kit {
  id: string;
  name: string;
  location?: string | null;
  description?: string | null;
  assignees?: { fullName: string }[];
  kitItems?: KitItem[];
}

function fmt(iso: string | null | undefined): string {
  if (!iso) return '—';
  return date.formatDate(iso, 'DD MMM YYYY');
}

function isExpiringSoon(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  return days >= 0 && days <= 30;
}

function statusLabel(item: KitItem): { text: string; cls: string } {
  if (item.isValid === false) return { text: '✗ Expired',     cls: 'expired' };
  if (isExpiringSoon(item.expirationDate)) return { text: '⚠ Expiring Soon', cls: 'soon' };
  return { text: '✓ OK', cls: 'ok' };
}

export async function buildBomHtml(kit: Kit, items: KitItem[], isDark = false): Promise<string> {
  // ── QR code ────────────────────────────────────────────────────────────────
  const qrUrl = `${window.location.origin}${window.location.pathname}#/kit/${kit.id}`;
  const qrDataUrl = await QRCode.toDataURL(qrUrl, { width: 160, margin: 1 });

  // ── Stats ──────────────────────────────────────────────────────────────────
  const expired      = items.filter((i) => i.isValid === false).length;
  const expiringSoon = items.filter((i) => i.isValid !== false && isExpiringSoon(i.expirationDate)).length;
  const ok           = items.length - expired - expiringSoon;
  const totalUnits   = items.reduce((s, i) => s + i.quantity, 0);

  // ── Group by category ──────────────────────────────────────────────────────
  const grouped = new Map<string, KitItem[]>();
  for (const item of items) {
    const cat = item.category ?? 'Other';
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(item);
  }

  const tableRows = [...grouped.entries()].map(([cat, catItems]) => `
    <tr class="cat-row"><td colspan="6">${cat.toUpperCase()}</td></tr>
    ${catItems.map((item) => {
      const s = statusLabel(item);
      return `
      <tr>
        <td class="item-name">${item.name}</td>
        <td class="center">${item.quantity}</td>
        <td class="center">${item.unit ?? '—'}</td>
        <td>${item.locationInKit ?? '—'}</td>
        <td>${fmt(item.expirationDate)}</td>
        <td class="center status ${s.cls}">${s.text}</td>
      </tr>`;
    }).join('')}
  `).join('');

  const assignees = (kit.assignees ?? []).map((a) => a.fullName).join(', ') || '—';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>BoM - ${kit.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 11px;
      color: #222;
      background: #fff;
    }

    /* ── Header ── */
    .header {
      background: #b14d4d;
      color: #fff;
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .header-left { display: flex; align-items: center; gap: 14px; }
    .header-logo {
      background: #fff;
      color: #b14d4d;
      border-radius: 8px;
      width: 40px; height: 40px;
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; font-weight: 900;
    }
    .header-title { font-size: 20px; font-weight: 700; }
    .header-sub   { font-size: 10px; opacity: .8; margin-top: 2px; }
    .header-date  { font-size: 9px; opacity: .75; text-align: right; }

    /* ── Info block ── */
    .info-block {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      background: #f7f7f7;
      border: 1px solid #e8e8e8;
      border-radius: 8px;
      margin: 16px 24px 0;
      padding: 14px 18px;
    }
    .info-left { flex: 1; }
    .kit-name  { font-size: 16px; font-weight: 700; color: #b14d4d; margin-bottom: 8px; }
    .meta-row  { display: flex; gap: 6px; margin-bottom: 4px; font-size: 10px; }
    .meta-label { color: #888; text-transform: uppercase; font-weight: 600; min-width: 90px; }
    .meta-val   { color: #333; }
    .qr-block   { text-align: center; }
    .qr-block img { width: 90px; height: 90px; display: block; }
    .qr-label   { font-size: 8px; color: #888; margin-top: 4px; }

    /* ── Stats chips ── */
    .stats {
      display: flex;
      gap: 10px;
      margin: 12px 24px 0;
    }
    .chip {
      flex: 1;
      border-radius: 6px;
      padding: 8px 10px;
      color: #fff;
      text-align: center;
    }
    .chip-ok     { background: #21ba45; }
    .chip-soon   { background: #f2c037; color: #333; }
    .chip-expired{ background: #c10015; }
    .chip-num    { font-size: 18px; font-weight: 700; display: block; }
    .chip-lbl    { font-size: 9px; display: block; margin-top: 2px; }

    /* ── Table ── */
    .table-wrap { margin: 14px 24px 24px; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }
    thead tr th {
      background: #333;
      color: #fff;
      font-weight: 600;
      padding: 6px 8px;
      text-align: left;
    }
    thead tr th.center { text-align: center; }
    tbody tr:nth-child(even) { background: #fafafa; }
    tbody tr td { padding: 5px 8px; border-bottom: 1px solid #eee; }
    .center { text-align: center; }
    .item-name { font-weight: 500; }

    .cat-row td {
      background: #b14d4d !important;
      color: #fff;
      font-weight: 700;
      font-size: 9px;
      padding: 4px 8px;
      letter-spacing: .06em;
    }

    .status { font-weight: 700; }
    .status.ok      { color: #21ba45; }
    .status.soon    { color: #b87a00; }
    .status.expired { color: #c10015; }

    /* ── Footer ── */
    .footer {
      border-top: 1px solid #ddd;
      margin: 0 24px;
      padding: 8px 0;
      display: flex;
      justify-content: space-between;
      font-size: 8.5px;
      color: #999;
    }

    @media print {
      @page { margin: 10mm; }
      body  { font-size: 10px; }
      .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .cat-row td { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .chip { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }

    ${isDark ? `
    /* ── Dark mode ── */
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: #2d2d2d; }
    ::-webkit-scrollbar-thumb { background: #555; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #777; }

    body { background: #1e1e1e; color: #e0e0e0; }

    .info-block {
      background: #2a2a2a;
      border-color: #3a3a3a;
    }
    .kit-name { color: #e57373; }
    .meta-label { color: #aaa; }
    .meta-val { color: #ddd; }
    .qr-label { color: #aaa; }

    thead tr th { background: #111; color: #e0e0e0; }
    tbody tr:nth-child(even) { background: #262626; }
    tbody tr td { border-bottom-color: #333; color: #ddd; }
    tbody tr:nth-child(odd) { background: #1e1e1e; }

    .footer { border-top-color: #444; color: #777; }

    .status.ok      { color: #4caf50; }
    .status.soon    { color: #ffc107; }
    .status.expired { color: #f44336; }
    ` : ''}
  </style>
</head>
<body>

  <div class="header">
    <div class="header-left">
      <div class="header-logo">+</div>
      <div>
        <div class="header-title">Bill of Materials</div>
        <div class="header-sub">FAK-CRM · First Aid Kit Management</div>
      </div>
    </div>
    <div class="header-date">
      Generated: ${date.formatDate(new Date(), 'DD MMM YYYY HH:mm')}
    </div>
  </div>

  <div class="info-block">
    <div class="info-left">
      <div class="kit-name">${kit.name}</div>
      ${kit.location    ? `<div class="meta-row"><span class="meta-label">Location</span><span class="meta-val">${kit.location}</span></div>` : ''}
      ${kit.description ? `<div class="meta-row"><span class="meta-label">Description</span><span class="meta-val">${kit.description}</span></div>` : ''}
      <div class="meta-row"><span class="meta-label">Assigned to</span><span class="meta-val">${assignees}</span></div>
      <div class="meta-row"><span class="meta-label">Total items</span><span class="meta-val">${items.length} lines · ${totalUnits} units</span></div>
    </div>
    <div class="qr-block">
      <img src="${qrDataUrl}" alt="QR Code" />
      <div class="qr-label">Scan to open kit</div>
    </div>
  </div>

  <div class="stats">
    <div class="chip chip-ok">
      <span class="chip-num">${ok}</span>
      <span class="chip-lbl">OK</span>
    </div>
    <div class="chip chip-soon">
      <span class="chip-num">${expiringSoon}</span>
      <span class="chip-lbl">Expiring Soon</span>
    </div>
    <div class="chip chip-expired">
      <span class="chip-num">${expired}</span>
      <span class="chip-lbl">Expired</span>
    </div>
  </div>

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th class="center">Qty</th>
          <th class="center">Unit</th>
          <th>Location in Kit</th>
          <th>Expiry Date</th>
          <th class="center">Status</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  </div>

  <div class="footer">
    <span>FAK-CRM · First Aid Kit Management System</span>
    <span>${kit.name} · ${date.formatDate(new Date(), 'DD MMM YYYY')}</span>
  </div>


</body>
</html>`;

  return html;
}
