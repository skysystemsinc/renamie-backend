import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';
import { UserRepository } from './repositories/user.repository';
import { DeletedUserRepository } from './repositories/deleted-user.repository';
import { User, UserSchema } from './schemas/user.schema';
import { DeletedUser, DeletedUserSchema } from './schemas/deleted-user.schema';
import { SSEModule } from 'src/sse/sse.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: DeletedUser.name, schema: DeletedUserSchema },
    ]),
    SSEModule,
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository, DeletedUserRepository],
  exports: [UserService, DeletedUserRepository],
})
export class UsersModule {}
