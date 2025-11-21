import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { PolicyModule } from './modules/policy/policy.module';
import { PaymentModule } from './modules/payment/payment.module';
import { AdminModule } from './modules/admin/admin.module';
import { SettingsModule } from './modules/settings/settings.module';

@Module({
  imports: [
    // Load env vars from .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),

    // Pino logger (pretty printing disabled in production for performance)
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        serializers: {
          req: (req) => ({
            method: req.method,
            url: req.url,
          }),
          res: (res) => ({
            statusCode: res.statusCode,
          }),
        },
      },
    }),
    PrismaModule,
    AuthModule,
    ProductsModule,
    PolicyModule,
    PaymentModule,
    AdminModule,
    SettingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
