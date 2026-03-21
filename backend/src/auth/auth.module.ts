import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesGuard } from './guards/roles.guard';
import { UserModule } from '../user/user.module';
import { AdminModule } from '../admin/admin.module';
import { TokenBlacklistService } from './token-blacklist.service';

@Module({
  imports: [
    UserModule,
    forwardRef(() => AdminModule),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION', '7d'),
        },
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
  ],
  providers: [AuthService, JwtStrategy, RolesGuard, TokenBlacklistService],
  controllers: [AuthController],
  exports: [RolesGuard, TokenBlacklistService],
})
export class AuthModule {}
