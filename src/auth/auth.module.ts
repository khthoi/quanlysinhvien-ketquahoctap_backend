import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { NguoiDung } from './entity/nguoi-dung.entity'; 
import { SinhVien } from '../sinh-vien/entity/sinh-vien.entity';       
import { GiangVien } from '../danh-muc/entity/giang-vien.entity';    
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([NguoiDung, SinhVien, GiangVien]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'fallback_secret_very_long',
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),

    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false, 
          auth: {
            user: configService.get<string>('EMAIL_APP'),
            pass: configService.get<string>('EMAIL_APP_PASSWORD'), 
          },
          tls: {
            rejectUnauthorized: false, 
          },
        },
        defaults: {
          from: `"Hệ thống Quản lý Sinh viên" <${configService.get<string>('EMAIL_APP')}>`,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class AuthModule {}