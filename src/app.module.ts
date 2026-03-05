import { Module } from '@nestjs/common';
import { PrismaService } from './lib/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { OrganizationModule } from './module/organization/organization.module';
import { AuthModule } from './module/auth/auth.module';
import { UserModule } from './module/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // disponível em toda aplicação
      envFilePath: '.env', // caminho para o arquivo .env
    }), HealthModule, OrganizationModule, AuthModule, UserModule],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
