# Invoice Generator HTML-PDF

This project generates professional invoice PDFs from structured JSON data using HTML templates and Puppeteer for high-quality rendering.

## Features

- HTML-based invoice generation for easy customization
- Professional layout with proper typography
- Supports sender/recipient information, detailed item tables, totals, and payment details
- German number formatting (comma as decimal separator)
- Fixed payment section at bottom of page
- Responsive design with flexbox layout

## Installation

```bash
npm install
```

## Usage

```bash
node generate-invoice.js <invoice-data.json> <output.pdf>
```

## Data Structure

Create a JSON file with the following structure:

```json
{
  "invoice": {
    "number": "2026-04-001",
    "date": "01.05.2026",
    "performance_period": "13.04.2026 – 30.04.2026"
  },
  "contract": {
    "project_contract": "14085 01/01",
    "framework_contract_date": "19.03.2026"
  },
  "sender": {
    "name": "Your Name",
    "address": "Your Address",
    "zip_city": "12345 Your City",
    "phone": "+49 123 456789",
    "email": "your.email@example.com",
    "ust_id": "DE123456789"
  },
  "recipient": {
    "company": "Client Company GmbH",
    "department": "Accounting",
    "address": "Client Address",
    "zip_city": "54321 Client City",
    "email": "accounting@client.com"
  },
  "items": [
    {
      "position": 1,
      "description": "Service description",
      "hours": 100,
      "unit_rate": 50.00,
      "total_net": 5000.00
    }
  ],
  "totals": {
    "net": 5000.00,
    "vat_rate": 19,
    "vat_amount": 950.00,
    "gross": 5950.00
  },
  "payment": {
    "due_date": "15.05.2026",
    "iban": "DE12 3456 7890 1234 5678 90",
    "bic": "SAMPLEBIC",
    "bank_name": "Sample Bank",
    "account_holder": "Your Name"
  },
  "notes": {
    "kleinunternehmer": false,
    "reverse_charge": false,
    "payment_term": "Please transfer the amount by due date without deduction."
  }
}
```

## Dependencies

- puppeteer: For HTML to PDF conversion

## Example Files

- `sample-invoice-data.json`: Template with placeholder data

## Security Note

Do not commit sensitive data (real IBAN, addresses, etc.) to version control. Use the sample data as a template and keep your actual data files private.

## Customization

The invoice layout is defined in `generate-invoice.js` as an HTML template. Modify the HTML and CSS within the script to customize the appearance.
