import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from './auth/auth.module';
import { DanhMucModule } from './danh-muc/danh-muc.module';
import { SinhVienModule } from './sinh-vien/sinh-vien.module';
import { DaoTaoModule } from './dao-tao/dao-tao.module';
import { GiangDayModule } from './giang-day/giang-day.module';
import { KetQuaModule } from './ket-qua/ket-qua.module';
import { BaoCaoModule } from './bao-cao/bao-cao.module';

@Module({
  imports: [
    // Load .env
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // MySQL + TypeORM
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('DB_HOST'),
        port: Number(config.get('DB_PORT')),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),

        autoLoadEntities: true,
        synchronize: true, // ⚠️ CHỈ DEV
      }),
    }),

    // Các module hiện có
    AuthModule,
    DanhMucModule,
    SinhVienModule,
    DaoTaoModule,
    GiangDayModule,
    KetQuaModule,
    BaoCaoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
