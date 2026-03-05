import { Module } from '@nestjs/common';
import { PrismaService } from './lib/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { PostModule } from './post/post.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // disponível em toda aplicação
      envFilePath: '.env', // caminho para o arquivo .env
    }),PostModule],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
