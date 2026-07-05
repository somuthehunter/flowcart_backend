import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { StockLedger } from '../entities/stock-ledger.entity';

@Injectable()
export class StockLedgerRepository extends Repository<StockLedger> {
  constructor(private dataSource: DataSource) {
    super(StockLedger, dataSource.createEntityManager());
  }
}
