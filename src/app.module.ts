import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './config/database/database.module';
import { LoggerMiddleware } from './middlewares';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BookModule } from './modules/book/book.module';
import { MemberModule } from './modules/member/member.module';
import { BorrowingModule } from './modules/borrowing/borrowing.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    BookModule,
    MemberModule,
    BorrowingModule,
    CacheModule.register({
      ttl: 5 * 1000, // time to live (TTL) in seconds (5 seconds)
      max: 10, // the maximum number of items to store in cache memory
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
