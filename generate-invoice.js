const fs = require('fs');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

async function generateInvoice(jsonPath, outputPath) {
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size in points
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();

  // Helper function to draw text
  function drawText(text, x, y, options = {}) {
    const font = options.bold ? helveticaBold : helvetica;
    const size = options.size || 10;
    page.drawText(text, { x, y, size, font, color: rgb(0, 0, 0) });
  }

  // Sender info (top left)
  drawText(data.sender.name, 50, height - 50, { bold: true });
  drawText(data.sender.address, 50, height - 65);
  drawText(data.sender.zip_city, 50, height - 80);
  drawText(`Telefon: ${data.sender.phone}`, 50, height - 95);
  drawText(`E-Mail: ${data.sender.email}`, 50, height - 110);
  drawText(`USt-IdNr.: ${data.sender.ust_id}`, 50, height - 125);

  // Recipient info (top right)
  drawText(data.recipient.company, 300, height - 50, { bold: true });
  drawText(data.recipient.department, 300, height - 65);
  drawText(data.recipient.address, 300, height - 80);
  drawText(data.recipient.zip_city, 300, height - 95);
  drawText(data.recipient.email, 300, height - 110);

  // Invoice header
  drawText('Rechnung', 250, height - 150, { bold: true, size: 16 });

  drawText(`Rechnungsdatum: ${data.invoice.date}`, 50, height - 180, { bold: true });
  drawText(`Rechnungsnummer: ${data.invoice.number}`, 50, height - 195, { bold: true });
  drawText(`Projekteinzelvertrag Nr. ${data.contract.project_contract}`, 50, height - 210, { bold: true });
  drawText(`zum Rahmenvertrag vom ${data.contract.framework_contract_date}`, 50, height - 225);

  drawText('Sehr geehrte Damen und Herren,', 50, height - 250);
  drawText(`gemäß Projekteinzelvertrag Nr. ${data.contract.project_contract} erlaube ich mir, Ihnen für den Leistungszeitraum`, 50, height - 265);
  drawText(`${data.invoice.performance_period} folgende Rechnung zu stellen:`, 50, height - 280);

  // Table header
  const tableY = height - 320;
  drawText('Pos.', 50, tableY, { bold: true });
  drawText('Beschreibung', 80, tableY, { bold: true });
  drawText('Stunden', 350, tableY, { bold: true });
  drawText('Satz', 400, tableY, { bold: true });
  drawText('Betrag netto', 450, tableY, { bold: true });

  // Draw table lines
  page.drawLine({ start: { x: 50, y: tableY - 5 }, end: { x: 550, y: tableY - 5 }, thickness: 1 });

  // Items
  let currentY = tableY - 25;
  data.items.forEach(item => {
    drawText(item.position.toString(), 50, currentY);
    // Wrap description
    const descLines = wrapText(item.description, 250);
    descLines.forEach((line, i) => {
      drawText(line, 80, currentY - i * 12);
    });
    drawText(item.hours.toString(), 350, currentY);
    drawText(`${item.unit_rate.toFixed(2)} €`, 400, currentY);
    drawText(`${item.total_net.toFixed(2)} €`, 450, currentY);
    currentY -= Math.max(12, descLines.length * 12) + 5;
  });

  // Totals
  currentY -= 20;
  drawText(`Zwischensumme netto: €${data.totals.net.toFixed(2)}`, 350, currentY);
  currentY -= 15;
  drawText(`Umsatzsteuer ${data.totals.vat_rate}%: €${data.totals.vat_amount.toFixed(2)}`, 350, currentY);
  currentY -= 15;
  drawText(`Gesamtbetrag brutto: €${data.totals.gross.toFixed(2)}`, 350, currentY, { bold: true });

  // Payment info
  currentY -= 40;
  drawText('Zahlungsinformationen:', 50, currentY, { bold: true });
  currentY -= 15;
  drawText(`Zahlungsziel: ${data.payment.due_date}`, 50, currentY);
  currentY -= 15;
  drawText(`IBAN: ${data.payment.iban}`, 50, currentY);
  currentY -= 15;
  drawText(`BIC: ${data.payment.bic}`, 50, currentY);
  currentY -= 15;
  drawText(`Kreditinstitut: ${data.payment.bank_name}`, 50, currentY);
  currentY -= 15;
  drawText(`Kontoinhaber: ${data.payment.account_holder}`, 50, currentY);

  // Notes
  currentY -= 40;
  drawText(data.notes.payment_term, 50, currentY);

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);
  console.log(`Invoice PDF generated at: ${outputPath}`);
}

function wrapText(text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  words.forEach(word => {
    if ((currentLine + ' ' + word).length * 6 < maxWidth) { // Rough estimate
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  });
  lines.push(currentLine);
  return lines;
}

// Usage
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.log('Usage: node generate-invoice.js <invoice.json> <output.pdf>');
  process.exit(1);
}

const [jsonPath, outputPath] = args;
generateInvoice(jsonPath, outputPath);