const fs = require('fs');
const { getDocument } = require('pdfjs-dist');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const { Document, Packer, Paragraph, TextRun } = require('docx');

// Function to extract text items with positions from PDF
async function extractTextItems(pdfPath) {
  const dataBuffer = fs.readFileSync(pdfPath);
  const data = new Uint8Array(dataBuffer);
  const pdf = await getDocument({ data }).promise;

  let textItems = [];

  for (let pageIndex = 0; pageIndex < pdf.numPages; pageIndex++) {
    const page = await pdf.getPage(pageIndex + 1);
    const textContent = await page.getTextContent();

    const items = textContent.items.map((item) => ({
      text: item.str,
      x: item.transform[4],
      y: item.transform[5],
      width: item.width,
      height: item.height,
      fontSize: item.transform[0], // scale x
      fontName: item.fontName || 'Helvetica',
      rotation: Math.atan2(item.transform[2], item.transform[0]) * (180 / Math.PI), // rotation in degrees
      pageIndex: pageIndex,
    }));

    textItems.push(...items);
  }

  return textItems;
}

// Function to get page sizes from PDF
async function getPageSizes(pdfPath) {
  const dataBuffer = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(dataBuffer);
  const pages = pdfDoc.getPages();
  return pages.map(page => ({
    width: page.getWidth(),
    height: page.getHeight(),
  }));
}

// Function to replace text based on JSON
function replaceText(textItems, replacements) {
  return textItems.map(item => {
    const replacement = replacements[item.text];
    if (replacement !== undefined) {
      if (replacement === '') {
        return null; // Skip this item
      }
      return { ...item, text: replacement };
    }
    return item;
  }).filter(item => item !== null);
}

// Function to create DOCX
function createDOCX(replacedItems) {
  const paragraphs = replacedItems.map(item => new Paragraph({
    children: [new TextRun(item.text)],
  }));

  const doc = new Document({
    sections: [{
      properties: {},
      children: paragraphs,
    }],
  });

  return doc;
}

// Main function
async function fillPDFTemplate(inputPath, outputPath, replacementsPath, docxPath = null) {
  try {
    const replacements = JSON.parse(fs.readFileSync(replacementsPath, 'utf8'));
    const textItems = await extractTextItems(inputPath);
    const pageSizes = await getPageSizes(inputPath);

    const replacedItems = replaceText(textItems, replacements);

    // Group items by page
    const itemsByPage = {};
    replacedItems.forEach(item => {
      if (!itemsByPage[item.pageIndex]) {
        itemsByPage[item.pageIndex] = [];
      }
      itemsByPage[item.pageIndex].push(item);
    });

    // Create new PDF
    const pdfDoc = await PDFDocument.create();
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    for (let pageIndex = 0; pageIndex < pageSizes.length; pageIndex++) {
      const page = pdfDoc.addPage([pageSizes[pageIndex].width, pageSizes[pageIndex].height]);
      const items = itemsByPage[pageIndex] || [];

      items.forEach(item => {
        const font = item.fontName.includes('Bold') ? helveticaBold : helvetica;
        page.drawText(item.text, {
          x: item.x,
          y: item.y,
          size: item.fontSize,
          font: font,
          color: rgb(0, 0, 0),
          rotate: item.rotation ? { angle: item.rotation * (Math.PI / 180) } : undefined,
        });
      });
    }

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, pdfBytes);

    console.log(`Filled PDF created at: ${outputPath}`);

    // Create DOCX if requested
    if (docxPath) {
      const doc = createDOCX(replacedItems);
      const docxBuffer = await Packer.toBuffer(doc);
      fs.writeFileSync(docxPath, docxBuffer);
      console.log(`Editable DOCX created at: ${docxPath}`);
    }
  } catch (error) {
    console.error('Error filling PDF template:', error);
  }
}

// Check command line arguments
const args = process.argv.slice(2);
if (args.length < 2 || args.length > 3) {
  console.log('Usage: node index.js <input.pdf> <replacements.json> [output_base]');
  console.log('output_base defaults to input filename with "_new" suffix.');
  console.log('Generates output_base.pdf and output_base.docx');
  process.exit(1);
}

const [inputPDF, replacementsJSON, outputBase] = args;
const baseName = outputBase || inputPDF.replace(/\.pdf$/i, '') + '_new';
const outputPDF = baseName + '.pdf';
const outputDOCX = baseName + '.docx';

fillPDFTemplate(inputPDF, outputPDF, replacementsJSON, outputDOCX);
