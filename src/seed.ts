import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { User } from './modules/users/user.entity';
import * as bcrypt from 'bcrypt';
import { UserRole } from './common/enums/user-role.enum';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  
  const userRepo = dataSource.getRepository(User);
  
  const email = 'superadmin.user@gmail.com';
  const existingAdmin = await userRepo.findOne({ where: { email } });
  
  if (existingAdmin) {
    console.log('Super admin already exists!');
    await app.close();
    return;
  }
  
  const hashedPassword = await bcrypt.hash('strong-password', 10);
  
  const admin = userRepo.create({
    email: email,
    password: hashedPassword,
    role: UserRole.PlatformAdmin,
    merchant_id: null,
  });
  
  const savedAdmin = await userRepo.save(admin);
  
  // Set creator tracking
  savedAdmin.created_by = savedAdmin.id;
  savedAdmin.updated_by = savedAdmin.id;
  await userRepo.save(savedAdmin);
  
  console.log('Successfully seeded super admin in users table!');
  await app.close();
}

bootstrap().catch(err => {
  console.error('Failed to seed:', err);
  process.exit(1);
});
