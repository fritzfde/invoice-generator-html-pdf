# PDF Template Filler

This script fills a PDF template with data from a JSON file, preserving the layout and removing specified text like watermarks.

## Usage

```bash
node index.js <input.pdf> <replacements.json> [output_base]
```

### Parameters:
- `input.pdf`: Path to the input PDF template file
- `replacements.json`: Path to the JSON file containing text replacements
- `output_base` (optional): Base name for output files. Defaults to input filename with "_new" suffix.

### Output:
- `output_base.pdf`: Filled PDF with preserved layout
- `output_base.docx`: Editable DOCX version (text only, layout not preserved)

### JSON Format for Replacements

The `replacements.json` should be an object where keys are the text to replace and values are the new text. Use an empty string `""` to remove text (e.g., watermarks).

Example `replacements.json`:
```json
{
  "Max Mustermann": "John Doe",
  "MUSTER": "",
  "Example Address": "123 Main St"
}
```

## Features

- Extracts text with exact positions from PDF
- Replaces specified text while preserving layout
- Removes watermark text by setting replacement to empty string
- Creates a new PDF with the same page sizes and text positions
- Handles rotated text (for diagonal watermarks)

## Dependencies

- pdfjs-dist: For extracting text and positions from PDFs
- pdf-lib: For creating the new filled PDF

Install dependencies with:
```bash
npm install
```

## Output

The generated PDF will have the same layout as the input, but with replaced text. Text that is set to `""` in the JSON will be omitted from the output.
