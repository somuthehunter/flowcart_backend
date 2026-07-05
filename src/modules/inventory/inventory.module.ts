import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { StockLedger } from './entities/stock-ledger.entity';
import { StockLedgerRepository } from './repositories/stock-ledger.repository';
import { ProductModule } from '../products/product.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StockLedger]),
    ProductModule,
  ],
  controllers: [InventoryController],
  providers: [InventoryService, StockLedgerRepository],
  exports: [InventoryService, StockLedgerRepository],
})
export class InventoryModule {}
