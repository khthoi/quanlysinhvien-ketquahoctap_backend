import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { NguoiDung } from './entity/nguoi-dung.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';

@Module({
  imports: [TypeOrmModule.forFeature([NguoiDung])],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
