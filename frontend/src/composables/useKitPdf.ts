import { jsPDF } from 'jspdf';
import autoTable, { type CellHookData } from 'jspdf-autotable';
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

// Brand colours
const PRIMARY_R = 177;
const PRIMARY_G =  77;
const PRIMARY_B =  77;
const DARK      = '#2d2d2d';
const DARK_R    = 45;
const DARK_G    = 45;
const DARK_B    = 45;
const GREY_LIGHT_R = 245;
const GREY_LIGHT_G = 245;
const GREY_LIGHT_B = 245;
const GREY_TEXT  = '#888888';

function fmt(iso: string | null | undefined): string {
  if (!iso) return '—';
  return date.formatDate(iso, 'DD MMM YYYY');
}

export async function exportKitPdf(kit: Kit, items: KitItem[]): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const margin = 14;

  // ── QR code data URL ─────────────────────────────────────────────────────────
  const qrUrl = `${window.location.origin}${window.location.pathname}#/kit/${kit.id}`;
  const qrDataUrl = await QRCode.toDataURL(qrUrl, {
    width: 200,
    margin: 1,
    color: { dark: DARK, light: '#ffffff' },
  });

  // ── Header bar ───────────────────────────────────────────────────────────────
  doc.setFillColor(PRIMARY_R, PRIMARY_G, PRIMARY_B);
  doc.rect(0, 0, W, 32, 'F');

  // Logo icon placeholder (cross symbol)
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, 7, 18, 18, 3, 3, 'F');
  doc.setFontSize(16);
  doc.setTextColor(PRIMARY_R, PRIMARY_G, PRIMARY_B);
  doc.setFont('helvetica', 'bold');
  doc.text('+', margin + 9, 19, { align: 'center' });

  // Title
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill of Materials', margin + 22, 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('FAK-CRM · First Aid Kit Management', margin + 22, 21);

  // Generated date (top right)
  doc.setFontSize(8);
  doc.text(`Generated: ${date.formatDate(new Date(), 'DD MMM YYYY HH:mm')}`, W - margin, 21, { align: 'right' });

  // ── Kit info block + QR ───────────────────────────────────────────────────────
  const infoY = 38;
  const qrSize = 28;
  const qrX = W - margin - qrSize;

  // Info card background
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(margin, infoY, W - margin * 2, 36, 3, 3, 'F');

  // Kit name
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(DARK);
  doc.text(kit.name, margin + 4, infoY + 9);

  // Meta rows
  const metaRows: [string, string][] = [];
  if (kit.location)    metaRows.push(['Location', kit.location]);
  if (kit.description) metaRows.push(['Description', kit.description]);
  const assigneeNames = (kit.assignees ?? []).map((a) => a.fullName).join(', ');
  if (assigneeNames)   metaRows.push(['Assigned to', assigneeNames]);
  metaRows.push(['Total items', `${items.length} line(s) · ${items.reduce((s, i) => s + i.quantity, 0)} units`]);

  let metaY = infoY + 16;
  for (const [label, val] of metaRows) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(GREY_TEXT);
    doc.text(label.toUpperCase(), margin + 4, metaY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(DARK);
    doc.text(val, margin + 32, metaY);
    metaY += 5;
  }

  // QR code
  doc.addImage(qrDataUrl, 'PNG', qrX, infoY + 4, qrSize, qrSize);
  doc.setFontSize(6.5);
  doc.setTextColor(GREY_TEXT);
  doc.text('Scan to open kit', qrX + qrSize / 2, infoY + qrSize + 7, { align: 'center' });

  // ── Summary stat chips ────────────────────────────────────────────────────────
  const statY = infoY + 42;
  const expired     = items.filter((i) => i.isValid === false).length;
  const expiringSoon = items.filter((i) => {
    if (!i.expirationDate || i.isValid === false) return false;
    return new Date(i.expirationDate) <= new Date(Date.now() + 30 * 86_400_000);
  }).length;
  const ok = items.length - expired - expiringSoon;

  const chips: { label: string; value: number; r: number; g: number; b: number }[] = [
    { label: 'OK',           value: ok,           r: 33,  g: 186, b: 69  },
    { label: 'Expiring Soon',value: expiringSoon, r: 242, g: 192, b: 55  },
    { label: 'Expired',      value: expired,      r: 193, g: 0,   b: 21  },
  ];
  const chipW = (W - margin * 2 - 8) / 3;
  chips.forEach((chip, idx) => {
    const cx = margin + idx * (chipW + 4);
    doc.setFillColor(chip.r, chip.g, chip.b);
    doc.roundedRect(cx, statY, chipW, 12, 2, 2, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(String(chip.value), cx + chipW / 2, statY + 7.5, { align: 'center' });
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text(chip.label, cx + chipW / 2, statY + 11, { align: 'center' });
  });

  // ── Items table ───────────────────────────────────────────────────────────────
  const tableY = statY + 16;

  // Group by category for a nicer look
  const grouped = new Map<string, KitItem[]>();
  for (const item of items) {
    const cat = item.category ?? 'Other';
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(item);
  }

  const tableRows: (string | { content: string; styles: Record<string, unknown> })[][] = [];
  for (const [cat, catItems] of grouped) {
    // Category header row
    tableRows.push([
      { content: cat.toUpperCase(), styles: { fillColor: [PRIMARY_R, PRIMARY_G, PRIMARY_B], textColor: [255, 255, 255], fontStyle: 'bold', colSpan: 6 } },
      '', '', '', '', '',
    ]);
    for (const item of catItems) {
      const expiryColor: [number, number, number] | undefined =
        item.isValid === false ? [193, 0, 21] :
        (item.expirationDate && new Date(item.expirationDate) <= new Date(Date.now() + 30 * 86_400_000))
          ? [180, 120, 0] : undefined;

      const expiryCell = expiryColor
        ? { content: fmt(item.expirationDate), styles: { textColor: expiryColor, fontStyle: 'bold' } }
        : fmt(item.expirationDate);

      tableRows.push([
        item.name,
        String(item.quantity),
        item.unit ?? '—',
        item.locationInKit ?? '—',
        expiryCell as string,
        item.isValid === false ? '✗ Expired' : (
          item.expirationDate && new Date(item.expirationDate) <= new Date(Date.now() + 30 * 86_400_000)
            ? '⚠ Soon' : '✓ OK'
        ),
      ]);
    }
  }

  autoTable(doc, {
    startY: tableY,
    head: [['Item', 'Qty', 'Unit', 'Location in Kit', 'Expiry Date', 'Status']],
    body: tableRows,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: [50, 50, 50],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: { fontSize: 8, textColor: [DARK_R, DARK_G, DARK_B] },
    alternateRowStyles: { fillColor: [GREY_LIGHT_R, GREY_LIGHT_G, GREY_LIGHT_B] },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 12, halign: 'center' },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 30 },
      4: { cellWidth: 26 },
      5: { cellWidth: 22, halign: 'center' },
    },
    didParseCell(data: CellHookData) {
      // Style status column
      if (data.column.index === 5 && data.section === 'body') {
        const v = `${data.cell.raw as string}`;
        if (v.includes('Expired'))    data.cell.styles.textColor = [193, 0, 21];
        else if (v.includes('Soon'))  data.cell.styles.textColor = [180, 120, 0];
        else                          data.cell.styles.textColor = [33, 186, 69];
        data.cell.styles.fontStyle = 'bold';
      }
    },
    showHead: 'firstPage',
  });

  // ── Footer on every page ──────────────────────────────────────────────────────
  const pageCount = (doc.internal as unknown as { getNumberOfPages(): number }).getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, H - 12, W - margin, H - 12);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(GREY_TEXT);
    doc.text('FAK-CRM · First Aid Kit Management System', margin, H - 7);
    doc.text(`Page ${p} of ${pageCount}`, W - margin, H - 7, { align: 'right' });
  }

  doc.save(`BoM_${kit.name.replace(/[^a-zA-Z0-9]/g, '_')}_${date.formatDate(new Date(), 'YYYYMMDD')}.pdf`);
}
