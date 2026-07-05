import * as ExcelJS from 'exceljs';
import { Product } from '../../modules/products/product.entity';

export async function generateExcelReport(products: Product[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Product Catalog');

  // Define column properties
  worksheet.columns = [
    { header: 'Product Code', key: 'product_code', width: 20 },
    { header: 'Barcode', key: 'barcode', width: 20 },
    { header: 'QR Number', key: 'qr_number', width: 20 },
    { header: 'English Name', key: 'english_name', width: 30 },
    { header: 'Bengali Name', key: 'bengali_name', width: 30 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Unit', key: 'unit', width: 12 },
    { header: 'Base Price', key: 'base_price', width: 15 },
    { header: 'Current Stock', key: 'current_stock', width: 15 },
    { header: 'Minimum Stock', key: 'minimum_stock', width: 15 },
  ];

  // Format header row style
  const headerRow = worksheet.getRow(1);
  headerRow.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '2C3E50' }, // Dark Slate header
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'left' };
  headerRow.height = 25;

  // Add Product catalog rows
  for (const product of products) {
    worksheet.addRow({
      product_code: product.product_code,
      barcode: product.barcode,
      qr_number: product.qr_number,
      english_name: product.english_name,
      bengali_name: product.bengali_name || '',
      category: product.category?.name || 'N/A',
      unit: product.unit || 'KG',
      base_price: Number(product.base_price),
      current_stock: product.current_stock,
      minimum_stock: product.minimum_stock,
    });
  }

  // Set borders for data rows
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'E0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'E0E0E0' } },
          left: { style: 'thin', color: { argb: 'E0E0E0' } },
          right: { style: 'thin', color: { argb: 'E0E0E0' } },
        };
      });
    }
  });

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer() as ArrayBuffer);
  return buffer;
}
