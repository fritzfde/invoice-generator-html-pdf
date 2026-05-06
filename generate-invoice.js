const fs = require('fs');
const puppeteer = require('puppeteer');

async function generateInvoice(jsonPath, outputPath) {
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  // Format performance period in German
  function formatGermanDateRange(range) {
    const [start, end] = range.split(' – ');
    const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    const formatDate = (dateStr) => {
      const [day, month, year] = dateStr.split('.');
      return `${day}.${months[parseInt(month) - 1]} ${year}`;
    };
    return `${formatDate(start)} – ${formatDate(end)}`;
  }
  data.invoice.performance_period_formatted = formatGermanDateRange(data.invoice.performance_period);

  // Function to format numbers with thousand space and comma decimal
  function formatNumber(num) {
    let str = num.toFixed(2);
    str = str.replace(/\B(?=(\d{3})+\.)/g, ' ');
    return str.replace('.', ',');
  }

  // Add formatted fields
  data.totals.net_formatted = formatNumber(data.totals.net);
  data.totals.vat_amount_formatted = formatNumber(data.totals.vat_amount);
  data.totals.gross_formatted = formatNumber(data.totals.gross);
  data.items[0].hours_formatted = data.items[0].hours.toFixed(2).replace('.', ',');
  data.items[0].unit_rate_formatted = formatNumber(data.items[0].unit_rate);
  data.items[0].total_net_formatted = formatNumber(data.items[0].total_net);

  // Calculate payment due date
  function calculateDueDate(invoiceDate, termsDays) {
    let date;
    if (!invoiceDate || invoiceDate.trim() === '') {
      // Use current date if invoice date is empty or not provided
      date = new Date();
      // Also set the invoice date to current date for display
      const currentDay = date.getDate().toString().padStart(2, '0');
      const currentMonth = (date.getMonth() + 1).toString().padStart(2, '0');
      const currentYear = date.getFullYear();
      data.invoice.date = `${currentDay}.${currentMonth}.${currentYear}`;
    } else {
      const [day, month, year] = invoiceDate.split('.');
      date = new Date(year, month - 1, day);
    }
    date.setDate(date.getDate() + termsDays);
    const dueDay = date.getDate().toString().padStart(2, '0');
    const dueMonth = (date.getMonth() + 1).toString().padStart(2, '0');
    const dueYear = date.getFullYear();
    return `${dueDay}.${dueMonth}.${dueYear}`;
  }
  data.payment.due_date = calculateDueDate(data.invoice.date, data.payment.terms_days);

  // Process description lines
  if (data.items[0].description_lines) {
    data.items[0].description_html = data.items[0].description_lines.map(line => `<p>${line}</p>`).join('');
  }

  // Read template and styles
  let html = fs.readFileSync('template.html', 'utf8');
  const css = fs.readFileSync('styles.css', 'utf8');

  // Inline CSS
  html = html.replace('<link rel="stylesheet" href="styles.css">', `<style>${css}</style>`);

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

  // Special for HTML content
  html = html.replace(/\{\{\{items\.0\.description_html\}\}\}/g, data.items[0].description_html);

  // Write HTML for debugging
  const htmlPath = 'recipe_nvoice.html';
  fs.writeFileSync(htmlPath, html);
  console.log(`Invoice HTML generated at: ${htmlPath}`);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html);
  await page.pdf({ path: 'recipe_nvoice.pdf', format: 'A4', printBackground: true });
  await browser.close();

  console.log(`Invoice PDF generated at: recipe_nvoice.pdf`);
}



// Usage
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.log('Usage: node generate-invoice.js <invoice.json> <output.pdf>');
  process.exit(1);
}

const [jsonPath, outputPath] = args;
generateInvoice(jsonPath, outputPath);