import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });
  
  // 전역 ValidationPipe 설정 - 페이지네이션 파라미터 무시하도록 수정
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false, // 비활성화하여 정의되지 않은 속성 허용
    }),
  );
  
  // CORS 설정
  app.enableCors();
  
  // HTTP 보안 헤더 설정
  app.use(helmet());
  
  // API 프리픽스 설정
  app.setGlobalPrefix('api/v1');
  
  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('한밭대학교 교직원 식단 API')
    .setDescription('한밭대학교 교직원 식당의 식단 정보를 제공하는 API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
  
  // 서버 시작
  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
