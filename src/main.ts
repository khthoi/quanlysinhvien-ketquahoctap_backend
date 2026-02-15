import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ===== Validation =====
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,              // Chỉ cho phép field có trong DTO
      forbidNonWhitelisted: true,   // Báo lỗi nếu có field lạ
      forbidUnknownValues: true,    // Không cho giá trị không xác định
      transform: true,              // Quan trọng: tự convert type (string -> number)
    }),
  );

  // ===== CORS =====
  const allowedOrigins = [
    process.env.FRONTEND_ADMIN_URL || 'http://localhost:3001',
    process.env.FRONTEND_CL_SIDE_URL || 'http://localhost:3002',
    'http://localhost:3003', // Giữ lại cho tương thích
  ].filter(Boolean); // Loại bỏ giá trị undefined/null

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // ===== Swagger =====
  const swaggerConfig = new DocumentBuilder()
    .setTitle('QLSV API')
    .setDescription('Tài liệu API hệ thống quản lý sinh viên')
    .setVersion('1.0')
    // .addBearerAuth() // bật nếu dùng JWT
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api-docs', app, swaggerDocument);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
