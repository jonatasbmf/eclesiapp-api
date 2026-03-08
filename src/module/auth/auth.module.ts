import { Module } from '@nestjs/common';
import { AuthController } from './api/auth.controller';
import { PrismaService } from 'src/lib/prisma.service';
import { SignUpUseCase } from './application/useCase/sign-up.usecase';
import { SignInUseCase } from './application/useCase/sign-in.usecase';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default-secret-key-please-change',
        signOptions: {
          expiresIn: (configService.get<string>('JWT_EXPIRES_IN') || '1d') as any,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [PrismaService, SignUpUseCase, SignInUseCase],
})
export class AuthModule {}
