import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle(process.env.SWAGGER_TITLE || '한밭대학교 테크누리 API')
    .setDescription(
      process.env.SWAGGER_DESCRIPTION ||
        '한밭대학교 모바일융합공학과를 위한 통합 정보 API 서비스',
    )
    .setVersion(process.env.SWAGGER_VERSION || '1.0')
    .addTag('notices', '공지사항 관련 API')
    .addTag('menu', '교직원 식단 관련 API')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(process.env.SWAGGER_PATH || 'api-docs', app, document);
} 