import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { CategoryModule } from './modules/categories/category.module';
import { ProductModule } from './modules/products/product.module';
import { BillModule } from './modules/bills/bill.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { BrandModule } from './modules/brands/brand.module';
import { UserModule } from './modules/users/user.module';
import { HealthController } from './modules/health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgrespassword',
      database: process.env.DATABASE_DB || 'flowcart',
      autoLoadEntities: true,
      synchronize: true, // Auto-create tables in development/local compose
    }),
    AuthModule,
    CategoryModule,
    ProductModule,
    BillModule,
    InventoryModule,
    BrandModule,
    UserModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}

