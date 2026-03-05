import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private configService: ConfigService) {
    const databaseUrl = configService.get<string>('DATABASE_URL');
    const isDevelopment = process.env.NODE_ENV !== 'production';

    if (!databaseUrl) {
      throw new Error('DATABASE_URL não está definida no arquivo .env');
    }

    const adapter = new PrismaPg({
      connectionString: databaseUrl,
    });

    // Configura logs apenas em desenvolvimento
    super({
      adapter,
      log: isDevelopment
        ? ['query', 'info', 'warn', 'error']
        : ['error'], // Em produção, apenas erros
    });
  }

  async onModuleInit() {
    if (process.env.NODE_ENV !== 'production') {
      // @ts-ignore - necessário para tipagem correta
      this.$on('query', (e: any) => {
        this.logger.debug('\n' + '='.repeat(50));
        this.logger.debug(`📊 QUERY: ${e.query}`);
        this.logger.debug(`📦 PARAMS: ${e.params}`);
        this.logger.debug(`⏱️  TEMPO: ${e.duration}ms`);
        this.logger.debug('='.repeat(50) + '\n');
      });
    }

    await this.$connect();
    this.logger.log(`📀 Banco de dados conectado (modo: ${process.env.NODE_ENV || 'development'})`);
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}