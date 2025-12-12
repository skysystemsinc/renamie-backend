import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { AdminController } from './controllers/admin.controller';
import { FoldersModule } from 'src/folder/folders.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [UsersModule, FoldersModule, AuthModule],
  controllers: [AdminController],
})
export class AdminModule {}
