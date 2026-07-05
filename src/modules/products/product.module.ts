import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { ProductBrand } from './product-brand.entity';
import { ProductRepository } from './product.repository';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { CategoryModule } from '../categories/category.module';
import { AuthModule } from '../auth/auth.module';
import { BrandModule } from '../brands/brand.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductBrand]),
    CategoryModule,
    BrandModule,
    AuthModule,
  ],
  controllers: [ProductController],
  providers: [ProductService, ProductRepository],
  exports: [ProductService, ProductRepository],
})
export class ProductModule {}
