import { DataSource } from 'typeorm';
import { Product } from '../src/modules/products/product.entity';
import { Brand } from '../src/modules/brands/brand.entity';
import { ProductBrand } from '../src/modules/products/product-brand.entity';

async function migrate() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgrespassword',
    database: process.env.DATABASE_DB || 'flowcart',
    entities: [__dirname + '/../src/**/*.entity.{js,ts}'],
  });

  await dataSource.initialize();
  console.log('Database connected.');

  const productRepo = dataSource.getRepository(Product);
  const brandRepo = dataSource.getRepository(Brand);
  const productBrandRepo = dataSource.getRepository(ProductBrand);

  const products = await productRepo.find();
  console.log(`Found ${products.length} products to migrate.`);

  for (const p of products) {
    if (p.base_price !== null && p.base_price !== undefined) {
      // Find or create 'Generic' brand for this merchant
      let genericBrand = await brandRepo.findOne({
        where: { name: 'Generic', merchant_id: p.merchant_id }
      });

      if (!genericBrand) {
        genericBrand = brandRepo.create({
          name: 'Generic',
          merchant_id: p.merchant_id,
          created_by: p.merchant_id,
          updated_by: p.merchant_id,
        });
        genericBrand = await brandRepo.save(genericBrand);
      }

      // Check if product already has this brand
      const existingProductBrand = await productBrandRepo.findOne({
        where: { product_id: p.id, brand_id: genericBrand.id }
      });

      if (!existingProductBrand) {
        const productBrand = productBrandRepo.create({
          product_id: p.id,
          brand_id: genericBrand.id,
          selling_price: p.base_price,
          created_by: p.merchant_id,
          updated_by: p.merchant_id,
        });
        await productBrandRepo.save(productBrand);
        console.log(`Migrated product ${p.english_name} to Generic brand with price ${p.base_price}`);
      }
      
      // We can nullify base_price now
      p.base_price = null;
      await productRepo.save(p);
    }
  }

  console.log('Migration complete.');
  await dataSource.destroy();
}

migrate().catch(console.error);
