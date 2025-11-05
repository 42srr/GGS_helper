import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './entities/user.entity';
import { Info } from './entities/info.entity';
import { Api42Module } from '../api-42/api-42.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Info]),
    Api42Module,
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
