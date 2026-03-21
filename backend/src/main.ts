import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { ThrottlerExceptionFilter } from './common/filters/throttler-exception.filter';
import { join } from 'path';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { UserService } from './user/user.service';
import { Role } from './auth/enums/role.enum';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // 정적 파일 서빙 설정
  // __dirname은 dist/src를 가리킴, uploads는 backend/ (프로젝트 루트)에 있음
  app.useStaticAssets(join(__dirname, '..', '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // 쿠키 파서
  app.use(cookieParser());

  // 보안 헤더 설정
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // 정적 파일 서빙 허용
  }));

  // 파일 업로드 크기 제한 증가 (20MB)
  app.use(json({ limit: '20mb' }));
  app.use(urlencoded({ limit: '20mb', extended: true }));

  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL', 'http://localhost:3000'),
    credentials: true,
  });

  // Global exception filters for better error handling
  app.useGlobalFilters(
    new AllExceptionsFilter(),
    new ThrottlerExceptionFilter(),  // Rate Limit 초과 에러 처리
  );

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger API 문서 설정 (프로덕션 환경에서는 비활성화)
  if (configService.get('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('GGS Helper API')
      .setDescription('GGS Helper 회의실 예약 시스템 API 문서')
      .setVersion('1.0')
      .addTag('auth', '인증/인가')
      .addTag('users', '사용자 관리')
      .addTag('rooms', '회의실 관리')
      .addTag('reservations', '예약 관리')
      .addTag('admin', '관리자 기능')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'JWT 토큰을 입력하세요',
          in: 'header',
        },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api-docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });
  }

  const port = configService.get<number>('PORT', 3001);
  await app.listen(port);

  logger.log(`Server running on: http://localhost:${port}`);
  logger.log(`API Documentation: http://localhost:${port}/api-docs`);

  // 환경변수 기반 관리자 계정 자동 생성
  const adminId = configService.get<string>('ADMIN_ID');
  const adminPassword = configService.get<string>('ADMIN_PASSWORD');

  if (adminId && adminPassword) {
    const userService = app.get(UserService);
    const existingAdmin = await userService.findByIntraId(adminId);

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const admin = await userService.create({
        name: adminId,
        intraId: adminId,
        password: hashedPassword,
      });
      await userService.updateUserRole(admin.userId, Role.ADMIN);
      logger.log(`Admin account '${adminId}' created successfully`);
    }
  }
}
bootstrap();
