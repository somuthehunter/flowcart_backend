import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as QRCode from 'qrcode';
import { Merchant } from '../modules/merchants/merchant.entity';
import { User } from '../modules/users/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { RefreshToken } from '../modules/refresh-tokens/refresh-token.entity';
import { Category } from '../modules/categories/category.entity';
import { Product } from '../modules/products/product.entity';
import { Bill } from '../modules/bills/bill.entity';
import { BillItem } from '../modules/bills/bill-item.entity';
import { Brand } from '../modules/brands/brand.entity';
import { ProductBrand } from '../modules/products/product-brand.entity';
import * as dotenv from 'dotenv';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgrespassword',
  database: process.env.DATABASE_DB || 'flowcart',
  entities: [Merchant, User, RefreshToken, Category, Product, Bill, BillItem, Brand, ProductBrand],
  synchronize: true, // Make sure schema exists
});

async function runSeed() {
  console.log('Connecting to database for seeding...');
  await dataSource.initialize();
  console.log('Database initialized.');

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    console.log('Starting seed operations...');

    // 1. Seed Merchant
    const merchantRepo = dataSource.getRepository(Merchant);
    const userRepo = dataSource.getRepository(User);
    const existingMerchant = await merchantRepo.findOne({
      where: [
        { phone_number: '9876543210' },
      ],
    });

    let merchant: Merchant;

    if (existingMerchant) {
      console.log('Merchant merchant@example.com already exists. Reusing...');
      merchant = existingMerchant;
    } else {
      console.log('Creating new merchant...');
      const hashedPassword = await bcrypt.hash('StrongPassword@123', 10);
      merchant = merchantRepo.create({
        owner_name: 'Pritam Dutta',
        phone_number: '9876543210',
        shop_name: 'Pritam Grocery',
        shop_type: 'GROCERY',
      });
      merchant = await merchantRepo.save(merchant);
      
      // Update creator audit field
      merchant.created_by = merchant.id;
      merchant.updated_by = merchant.id;
      await merchantRepo.save(merchant);
      
      const user = userRepo.create({
        email: 'merchant@example.com',
        password: hashedPassword,
        role: UserRole.MerchantOwner,
        merchant_id: merchant.id,
        created_by: merchant.id,
        updated_by: merchant.id,
      });
      await userRepo.save(user);
      console.log('Merchant created successfully.');
    }

    // Seed admin.merchant@gmail.com user
    const adminEmail = 'admin.merchant@gmail.com';
    let adminUser = await userRepo.findOne({ where: { email: adminEmail } });
    if (!adminUser) {
      console.log(`Creating user: ${adminEmail}`);
      const adminPassword = await bcrypt.hash('strong-password', 10);
      adminUser = userRepo.create({
        email: adminEmail,
        password: adminPassword,
        role: UserRole.MerchantOwner,
        merchant_id: merchant.id,
        created_by: merchant.id,
        updated_by: merchant.id,
      });
      await userRepo.save(adminUser);
      console.log(`User ${adminEmail} created successfully.`);
    } else {
      console.log(`User ${adminEmail} already exists. Skipping.`);
    }


    // 2. Seed Categories
    const categoryRepo = dataSource.getRepository(Category);
    const categoryNames = ['Rice', 'Vegetables', 'Drinks'];
    const categories: Category[] = [];

    for (const name of categoryNames) {
      let cat = await categoryRepo.findOne({
        where: { name, merchant_id: merchant.id },
      });

      if (!cat) {
        console.log(`Creating category: ${name}`);
        cat = categoryRepo.create({
          name,
          merchant_id: merchant.id,
          created_by: merchant.id,
          updated_by: merchant.id,
        });
        cat = await categoryRepo.save(cat);
      }
      categories.push(cat);
    }
    console.log('Categories seeded.');

    // 3. Seed Products
    const productRepo = dataSource.getRepository(Product);
    const sampleProducts = [
      {
        product_code: 'FLOW-PROD-000001',
        english_name: 'Miniket Rice 1kg',
        bengali_name: 'মিনিকেট চাল ১ কেজি',
        description: 'Premium parboiled long grain miniket rice',
        unit: 'KG',
        barcode: '890000000001',
        qr_number: 'FLOW-QR-000001',
        base_price: 65.00,
        track_stock: true,
        current_stock: 100,
        minimum_stock: 10,
        category: categories.find((c) => c.name === 'Rice')!,
      },
      {
        product_code: 'FLOW-PROD-000002',
        english_name: 'Fresh Potato 1kg',
        bengali_name: 'আলু ১ কেজি',
        description: 'Fresh white potatoes sourced locally',
        unit: 'KG',
        barcode: '890000000002',
        qr_number: 'FLOW-QR-000002',
        base_price: 30.00,
        track_stock: true,
        current_stock: 50,
        minimum_stock: 10,
        category: categories.find((c) => c.name === 'Vegetables')!,
      },
      {
        product_code: 'FLOW-PROD-000003',
        english_name: 'Coca Cola 250ml',
        bengali_name: 'কোকা কোলা ২৫০ মিলি',
        description: 'Chilled soft drink beverage carbonated',
        unit: 'PCS',
        barcode: '890000000003',
        qr_number: 'FLOW-QR-000003',
        base_price: 40.00,
        track_stock: false,
        current_stock: 0,
        minimum_stock: 0,
        category: categories.find((c) => c.name === 'Drinks')!,
      },
    ];

    for (const item of sampleProducts) {
      const prod = await productRepo.findOne({
        where: { product_code: item.product_code, merchant_id: merchant.id },
      });

      if (!prod) {
        console.log(`Creating product: ${item.english_name}`);
        const qrCodeImageUrl = await QRCode.toDataURL(item.qr_number);
        const newProd = productRepo.create({
          product_code: item.product_code,
          english_name: item.english_name,
          bengali_name: item.bengali_name,
          description: item.description,
          unit: item.unit,
          barcode: item.barcode,
          qr_number: item.qr_number,
          qr_code_image_url: qrCodeImageUrl,
          base_price: item.base_price,
          track_stock: item.track_stock,
          current_stock: item.current_stock,
          minimum_stock: item.minimum_stock,
          category_id: item.category.id,
          merchant_id: merchant.id,
          created_by: merchant.id,
          updated_by: merchant.id,
        });
        await productRepo.save(newProd);
      } else {
        console.log(`Product ${item.english_name} already exists. Skipping.`);
      }
    }

    console.log('Products seeded successfully.');
    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

runSeed();
