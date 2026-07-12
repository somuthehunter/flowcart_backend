import PDFDocument from 'pdfkit';
import { Product } from '../../modules/products/product.entity';

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  if (!url) return null;
  if (url.startsWith('data:image')) {
    const base64Data = url.replace(/^data:image\/\w+;base64,/, '');
    return Buffer.from(base64Data, 'base64');
  }
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    return null;
  }
}

export async function generateLabelsPdf(
  products: Product[],
  options: {
    layout?: 'Portrait' | 'Landscape';
    qr_size?: number;
    rows?: number;
    columns?: number;
  },
): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const layout = options.layout === 'Portrait' ? 'portrait' : 'landscape';
      const doc = new PDFDocument({
        size: 'A4',
        layout: layout,
        margin: 10,
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

      // Grid configurations
      const cols = options.columns || (layout === 'landscape' ? 4 : 3);
      const rows = options.rows || (layout === 'landscape' ? 3 : 4);
      const qrSize = options.qr_size || 55;

      const cellWidth = (pageWidth - 20) / cols;
      const cellHeight = (pageHeight - 20) / rows;

      let index = 0;
      for (const product of products) {
        if (index > 0 && index % (cols * rows) === 0) {
          doc.addPage();
        }

        const pageIndex = index % (cols * rows);
        const col = pageIndex % cols;
        const row = Math.floor(pageIndex / cols);

        const x = 10 + col * cellWidth;
        const y = 10 + row * cellHeight;
        
        const padding = 12;
        const innerX = x + padding;
        const innerY = y + padding;

        // Draw border box for cutting convenience
        doc.rect(x, y, cellWidth, cellHeight)
          .strokeColor('#d0d0d0')
          .lineWidth(0.5)
          .stroke();

        // 1. Render Product Image (Top Left)
        const imgSize = 45;
        if (product.image_url) {
          const productImgBuffer = await fetchImageBuffer(product.image_url);
          if (productImgBuffer) {
            try {
              doc.image(productImgBuffer, innerX, innerY, {
                width: imgSize,
                height: imgSize,
              });
              doc.rect(innerX, innerY, imgSize, imgSize).strokeColor('#e0e0e0').lineWidth(0.5).stroke();
            } catch (err) {
              // Fallback if image data is invalid
              doc.rect(innerX, innerY, imgSize, imgSize).strokeColor('#e0e0e0').lineWidth(0.5).stroke();
              doc.fillColor('#999').fontSize(8).text('No Img', innerX + 5, innerY + 18);
            }
          }
        }

        // 2. Render QR Code (Top Right)
        if (product.qr_code_image_url) {
          try {
            const base64Data = product.qr_code_image_url.replace(/^data:image\/png;base64,/, '');
            const qrX = x + cellWidth - qrSize - padding;
            doc.image(Buffer.from(base64Data, 'base64'), qrX, innerY, {
              width: qrSize,
              height: qrSize,
            });
          } catch (err) {
            const qrX = x + cellWidth - qrSize - padding;
            doc.rect(qrX, innerY, qrSize, qrSize).stroke();
          }
        }

        // 3. Texts (Middle)
        const textYStart = innerY + Math.max(imgSize, qrSize) + 12;
        
        doc.fillColor('#1a1a1a')
          .font('Helvetica-Bold')
          .fontSize(10)
          .text(product.english_name.slice(0, 35), innerX, textYStart, { width: cellWidth - 2 * padding, align: 'center' });

        let currentTextY = textYStart + 12;

        if (product.bengali_name) {
          doc.font('Helvetica')
            .fontSize(9)
            .text(product.bengali_name.slice(0, 35), innerX, currentTextY, { width: cellWidth - 2 * padding, align: 'center' });
          currentTextY += 12;
        }

        currentTextY += 5;

        // Code & Barcode texts
        doc.font('Helvetica')
          .fontSize(7)
          .fillColor('#555555')
          .text(`SKU: ${product.product_code}`, innerX, currentTextY, { width: cellWidth - 2 * padding, align: 'center' });
        currentTextY += 10;
        doc.text(`Barcode: ${product.barcode}`, innerX, currentTextY, { width: cellWidth - 2 * padding, align: 'center' });
        
        currentTextY += 10;

        // 4. Barcode Lines (Simulated - Centered)
        // We have ~28 bars of varying width
        let barcodeWidth = 0;
        const bars: { w: number; g: number }[] = [];
        for (let i = 0; i < 28; i++) {
          const barWidth = (i % 3 === 0 || i === 1 || i === 7 || i === 15) ? 1.5 : 0.6;
          const gap = (i % 2 === 0) ? 1.8 : 1.0;
          bars.push({ w: barWidth, g: gap });
          barcodeWidth += barWidth + gap;
        }
        
        const barcodeStartX = innerX + (cellWidth - 2 * padding - barcodeWidth) / 2;
        let currentOffset = 0;
        doc.lineWidth(1);

        for (const bar of bars) {
          doc.moveTo(barcodeStartX + currentOffset, currentTextY)
            .lineTo(barcodeStartX + currentOffset, currentTextY + 20)
            .lineWidth(bar.w)
            .strokeColor('#000000')
            .stroke();
          currentOffset += bar.w + bar.g;
        }

        index++;
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export async function generateCatalogPdf(products: Product[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // Landscape A4 Catalog
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 20,
    });

    const buffers: Buffer[] = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', (err) => reject(err));

    // Page title and headers
    const title = 'PRODUCT QUICK-SCAN CATALOGUE';
    doc.fillColor('#1a1a1a')
      .font('Helvetica-Bold')
      .fontSize(14)
      .text(title, 20, 20);

    const headers = ['QR Code', 'Barcode', 'Product Code', 'English Name', 'Bengali Name'];
    const colWidths = [80, 120, 130, 220, 210];
    const rowHeight = 65;

    // Header drawing function
    const drawHeaders = (yPos: number) => {
      doc.rect(20, yPos, 800, 20).fill('#2c3e50');
      let currentX = 20;
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
      for (let i = 0; i < headers.length; i++) {
        doc.text(headers[i], currentX + 5, yPos + 6, { width: colWidths[i] });
        currentX += colWidths[i];
      }
    };

    let y = 45;
    drawHeaders(y);
    y += 20;

    let itemsOnPage = 0;
    const maxItemsPerPage = 7;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      if (itemsOnPage > 0 && itemsOnPage % maxItemsPerPage === 0) {
        doc.addPage();
        // Redraw headers on new page
        doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(14).text(title, 20, 20);
        y = 45;
        drawHeaders(y);
        y += 20;
        itemsOnPage = 0;
      }

      // Draw alternating row backgrounds
      if (i % 2 === 0) {
        doc.rect(20, y, 800, rowHeight).fill('#f9f9f9');
      }

      // Draw cell boundaries
      doc.rect(20, y, 800, rowHeight).strokeColor('#e0e0e0').lineWidth(0.5).stroke();

      let cellX = 20;

      // Col 1: QR Code
      if (product.qr_code_image_url) {
        try {
          const base64Data = product.qr_code_image_url.replace(/^data:image\/png;base64,/, '');
          doc.image(Buffer.from(base64Data, 'base64'), cellX + 15, y + 8, {
            width: 48,
            height: 48,
          });
        } catch (err) {
          doc.rect(cellX + 15, y + 8, 48, 48).stroke();
        }
      }
      cellX += colWidths[0];

      // Col 2: Barcode simulated lines + text
      const barcodeLinesX = cellX + 10;
      const barcodeLinesY = y + 15;
      let offset = 0;
      doc.lineWidth(1);
      for (let b = 0; b < 24; b++) {
        const barWidth = (b % 4 === 0 || b === 2) ? 1.8 : 0.8;
        const gap = (b % 2 === 0) ? 2.0 : 1.2;
        doc.moveTo(barcodeLinesX + offset, barcodeLinesY)
          .lineTo(barcodeLinesX + offset, barcodeLinesY + 22)
          .lineWidth(barWidth)
          .strokeColor('#000000')
          .stroke();
        offset += barWidth + gap;
      }
      doc.fillColor('#333333').font('Helvetica').fontSize(7)
        .text(product.barcode, cellX + 10, y + 42);
      cellX += colWidths[1];

      // Col 3: Product Code
      doc.fillColor('#333333').font('Helvetica-Bold').fontSize(8)
        .text(product.product_code, cellX + 5, y + 25, { width: colWidths[2] - 10 });
      cellX += colWidths[2];

      // Col 4: English Name
      doc.font('Helvetica').fontSize(9)
        .text(product.english_name, cellX + 5, y + 25, { width: colWidths[3] - 10 });
      cellX += colWidths[3];

      // Col 5: Bengali Name
      if (product.bengali_name) {
        doc.text(product.bengali_name, cellX + 5, y + 25, { width: colWidths[4] - 10 });
      }

      y += rowHeight;
      itemsOnPage++;
    }

    doc.end();
  });
}
