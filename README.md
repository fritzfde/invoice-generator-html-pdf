# PDF Tools

This project contains two scripts for PDF processing:

## 1. PDF Template Filler (`index.js`)

Fills a PDF template with data from a JSON file, preserving the layout and removing specified text like watermarks.

### Usage
```bash
node index.js <input.pdf> <replacements.json> [output_base]
```

### Features
- Extracts text with exact positions from PDF
- Replaces specified text while preserving layout
- Removes watermark text
- Handles bold fonts and text merging for broken PDFs
- Generates PDF and DOCX outputs

## 2. Invoice Generator (`generate-invoice.js`)

Creates a professional invoice PDF from structured JSON data.

### Usage
```bash
node generate-invoice.js <invoice.json> <output.pdf>
```

### Features
- Generates clean invoice PDFs with proper layout
- Supports sender/recipient info, items table, totals, payment details
- Handles text wrapping and formatting
- Uses Helvetica fonts with bold support

## Dependencies

- pdfjs-dist: For PDF text extraction
- pdf-lib: For PDF creation and manipulation
- docx: For DOCX generation

Install with:
```bash
npm install
```

## Example Files

- `sample-replacements.json`: Example replacements for template filler
- `invoice-data.json`: Example invoice data for generator
