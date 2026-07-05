import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, IsNull } from 'typeorm';
import { RefreshToken } from './refresh-token.entity';

@Injectable()
export class RefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly repo: Repository<RefreshToken>,
  ) {}

  async create(tokenData: Partial<RefreshToken>): Promise<RefreshToken> {
    const token = this.repo.create(tokenData);
    return this.repo.save(token);
  }

  async findActiveByHash(hash: string): Promise<RefreshToken | null> {
    return this.repo.findOne({
      where: {
        token_hash: hash,
        revoked_at: IsNull(),
        expires_at: MoreThan(new Date()),
      },
      relations: { user: true },
    });
  }

  async revoke(id: string): Promise<void> {
    await this.repo.update(id, { revoked_at: new Date() });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.repo.update(
      { user_id: userId, revoked_at: IsNull() },
      { revoked_at: new Date() },
    );
  }
}
