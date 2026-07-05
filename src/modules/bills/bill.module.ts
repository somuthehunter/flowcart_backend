import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bill } from './bill.entity';
import { BillItem } from './bill-item.entity';
import { BillRepository } from './bill.repository';
import { BillService } from './bill.service';
import { BillController } from './bill.controller';
import { ProductModule } from '../products/product.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bill, BillItem]),
    ProductModule,
    AuthModule,
  ],
  controllers: [BillController],
  providers: [BillService, BillRepository],
  exports: [BillService, BillRepository],
})
export class BillModule {}
