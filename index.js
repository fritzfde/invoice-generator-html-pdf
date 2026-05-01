

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

  // Merge adjacent text items on the same line
  const mergedTextItems = [];
  const groupedByPage = {};
  textItems.forEach(item => {
    if (!groupedByPage[item.pageIndex]) groupedByPage[item.pageIndex] = [];
    groupedByPage[item.pageIndex].push(item);
  });

  for (const pageIndex in groupedByPage) {
    const pageItems = groupedByPage[pageIndex].sort((a, b) => a.y - b.y || a.x - b.x);
    const merged = [];
    let currentGroup = [pageItems[0]];

    for (let i = 1; i < pageItems.length; i++) {
      const prev = currentGroup[currentGroup.length - 1];
      const curr = pageItems[i];
      if (Math.abs(prev.y - curr.y) < 5 && curr.x > prev.x - 10) { // Same line, consecutive
        currentGroup.push(curr);
      } else {
        merged.push(mergeGroup(currentGroup));
        currentGroup = [curr];
      }
    }
    merged.push(mergeGroup(currentGroup));
    mergedTextItems.push(...merged);
  }

  function mergeGroup(group) {
    if (group.length === 1) return group[0];
    const merged = { ...group[0] };
    merged.text = group.map(g => g.text).join('');
    merged.width = group.reduce((sum, g) => sum + g.width, 0);
    return merged;
  }

  console.log('Merged text items:', mergedTextItems.slice(0, 10)); // Log first 10 for debugging
  const uniqueFonts = [...new Set(mergedTextItems.map(item => item.fontName))];
  console.log('Unique font names:', uniqueFonts);
  return mergedTextItems;
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
        const font = item.fontName.toLowerCase().includes('bold') ? helveticaBold : helvetica;
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
