import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Merchant } from './merchant.entity';

@Injectable()
export class MerchantRepository {
  constructor(
    @InjectRepository(Merchant)
    private readonly repo: Repository<Merchant>,
  ) {}

  async findByPhoneNumber(phoneNumber: string): Promise<Merchant | null> {
    return this.repo.findOne({ where: { phone_number: phoneNumber } });
  }

  async findById(id: string): Promise<Merchant | null> {
    return this.repo.findOne({ where: { id } });
  }

  async create(merchantData: Partial<Merchant>): Promise<Merchant> {
    const merchant = this.repo.create(merchantData);
    return this.repo.save(merchant);
  }

  async save(merchant: Merchant): Promise<Merchant> {
    return this.repo.save(merchant);
  }
}
