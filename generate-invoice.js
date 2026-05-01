const fs = require('fs');
const puppeteer = require('puppeteer');

async function generateInvoice(jsonPath, outputPath) {
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  // Build HTML
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Helvetica, Arial, sans-serif;
      font-size: 14px;
      margin: 0;
      padding: 100px 50px 100px 100px;
      width: 595px;
      display: flex;
      flex-direction: column;
    }
    .sender-line {
      text-align: left;
      margin-bottom: 20px;
      font-size: 11px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-top: 100px;
      margin-bottom: 40px;
    }
    .recipient {
      margin-bottom: 10px;
      text-align: left;
    }
    .sender {
      text-align: left;
    }
    .sender .date {
      margin-top: 20px;
      text-align: right;
    }
    .date {
      text-align: right;
      margin-bottom: 30px;
      font-weight: bold;
    }
    .number {
      margin-bottom: 10px;
      font-weight: bold;
    }
    .contract {
      margin-bottom: 20px;
    }
    .greeting {
      margin-top: 10px;
      margin-bottom: 10px;
    }
    .text1 {
      margin-bottom: 5px;
    }
    .text2 {
      margin-bottom: 20px;
    }
    .table {
      width: 100%;
      margin-bottom: 30px;
    }
    .table table {
      width: 100%;
      border-collapse: collapse;
    }
    .table th, .table td {
      padding: 8px;
      text-align: left;
      font-size: 12px;
      vertical-align: top;
    }
    .table td p {
      margin: 5px 0;
    }
    .totals {
      text-align: right;
      margin-bottom: 20px;
      font-size: 12px;
    }
    .notes {
      margin-bottom: 50px;
      font-size: 12px;
    }
    .payment-section {
      position: fixed;
      bottom: 50px;
      left: 100px;
      right: 100px;
    }
    .payment-line {
      width: 100%;
      border: none;
      border-top: 1px solid black;
      margin-bottom: 10px;
    }
    .payment {
      font-size: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="recipient">
      <div class="sender-line">
        <u>${data.sender.name} ${data.sender.address} ${data.sender.zip_city}</u>
      </div>
      <strong>${data.recipient.company}</strong><br>
      ${data.recipient.department}<br>
      ${data.recipient.address}<br>
      ${data.recipient.zip_city}<br>
      <!-- ${data.recipient.email} -->
    </div>
    <div class="sender">
      <strong>${data.sender.name}</strong><br>
      ${data.sender.address}<br>
      ${data.sender.zip_city}<br>
      Telefon: ${data.sender.phone}<br>
      E-Mail: ${data.sender.email}<br>
      <!-- USt-IdNr.: ${data.sender.ust_id} -->
      <div class="date"><div style="display: flex; justify-content: space-between;"><span>Rechnungsdatum:</span><span>${data.invoice.date}</span></div></div>
    </div>
  </div>

  <div class="number">Rechnungsnummer: ${data.invoice.number}<br>Projekteinzelvertrag Nr. ${data.contract.project_contract}</div>
  <div class="contract">zum Rahmenvertrag vom ${data.contract.framework_contract_date}</div>
  <div class="greeting">Sehr geehrte Damen und Herren,</div>
  <div class="text1">gemäß Projekteinzelvertrag Nr. ${data.contract.project_contract} erlaube ich mir, Ihnen für den Leistungszeitraum</div>
  <div class="text2"><span style="color: blue;">${data.invoice.performance_period}</span> folgende Rechnung zu stellen:</div>
  <div class="table">
    <table>
      <tr>
        <th>Anz.</th>
        <th>Einheit</th>
        <th>Beschreibung</th>
        <th>Einzelpreis</th>
        <th>Gesamtpreis</th>
      </tr>
      ${data.items.map(item => `
      <tr>
        <td>${item.hours.toFixed(2).replace('.', ',')}</td>
        <td>Stunden</td>
        <td><p>Geleistete Arbeitsstunden gemäß beigefügtem, abgezeichneten Leistungsnachweis:</p><p>Aufsetzung der Entwicklungsumgebung und IDE für Spring Boot und React</p><p>Konzeption, Programmierung, Implementierung von FE + BE Architektur</p><p>AN-6009</p><p>AN-6012</p></td>
        <td>${item.unit_rate.toFixed(2).replace('.', ',')} €</td>
        <td>${item.total_net.toFixed(2).replace('.', ',')} €</td>
      </tr>
      `).join('')}
    </table>
  </div>
  <div class="totals">
    Zwischensumme netto: €${data.totals.net.toFixed(2).replace('.', ',')}<br>
    Umsatzsteuer ${data.totals.vat_rate}%: €${data.totals.vat_amount.toFixed(2).replace('.', ',')}<br>
    <strong>Gesamtbetrag brutto: €${data.totals.gross.toFixed(2).replace('.', ',')}</strong>
  </div>
  <div class="notes">Bitte überweisen Sie den Betrag bis ${data.payment.due_date} ohne Abzug.</div>
  <div class="payment-section">
    <hr class="payment-line">
    <div class="payment">
      Bankverbindung<br>
      ${data.payment.bank_name}<br>
      IBAN: ${data.payment.iban}<br>
      BIC: ${data.payment.bic}
    </div>
  </div>
</body>
</html>
  `;

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html);
  await page.pdf({ path: outputPath, format: 'A4', printBackground: true });
  await browser.close();

  console.log(`Invoice PDF generated at: ${outputPath}`);
}



// Usage
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.log('Usage: node generate-invoice.js <invoice.json> <output.pdf>');
  process.exit(1);
}

const [jsonPath, outputPath] = args;
generateInvoice(jsonPath, outputPath);