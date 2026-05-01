const fs = require('fs');
const puppeteer = require('puppeteer');

async function generateInvoice(jsonPath, outputPath) {
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  // Add formatted fields
  data.totals.net_formatted = data.totals.net.toFixed(2).replace('.', ',');
  data.totals.vat_amount_formatted = data.totals.vat_amount.toFixed(2).replace('.', ',');
  data.totals.gross_formatted = data.totals.gross.toFixed(2).replace('.', ',');
  data.items[0].hours_formatted = data.items[0].hours.toFixed(2).replace('.', ',');
  data.items[0].unit_rate_formatted = data.items[0].unit_rate.toFixed(2).replace('.', ',');
  data.items[0].total_net_formatted = data.items[0].total_net.toFixed(2).replace('.', ',');

  // Read template
  let html = fs.readFileSync('template.html', 'utf8');

  // Replace placeholders
  Object.keys(data).forEach(key => {
    if (typeof data[key] === 'object') {
      Object.keys(data[key]).forEach(subKey => {
        const regex = new RegExp(`{{${key}\.${subKey}}}`, 'g');
        html = html.replace(regex, data[key][subKey]);
      });
    } else {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, data[key]);
    }
  });

  // Special for items.0
  html = html.replace(/{{items\.0\.(\w+)}}/g, (match, prop) => data.items[0][prop]);

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