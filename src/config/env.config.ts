import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  apiPrefix: `${process.env.API_PREFIX ?? 'api'}/${process.env.API_VERSION ?? 'v1'}`,
  hanbatUrl: process.env.HANBAT_URL ?? 'https://www.hanbat.ac.kr',
}));

export const throttleConfig = registerAs('throttle', () => ({
  ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10),
  limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
}));

export const swaggerConfig = registerAs('swagger', () => ({
  title: process.env.SWAGGER_TITLE ?? '한밭대학교 테크누리 API',
  description:
    process.env.SWAGGER_DESCRIPTION ??
    '한밭대학교 모바일융합공학과를 위한 통합 정보 API 서비스',
  version: process.env.SWAGGER_VERSION ?? '1.0',
  path: process.env.SWAGGER_PATH ?? 'api-docs',
}));
