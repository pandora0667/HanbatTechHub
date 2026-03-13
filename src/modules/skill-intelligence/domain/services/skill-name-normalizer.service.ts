import { Injectable } from '@nestjs/common';

const CANONICAL_SKILL_NAMES: Record<string, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  reactjs: 'React',
  react: 'React',
  'react.js': 'React',
  vue: 'Vue',
  'vue.js': 'Vue',
  angular: 'Angular',
  node: 'Node.js',
  nodejs: 'Node.js',
  'node.js': 'Node.js',
  nestjs: 'NestJS',
  'nest.js': 'NestJS',
  nextjs: 'Next.js',
  'next.js': 'Next.js',
  spring: 'Spring',
  springboot: 'Spring Boot',
  'spring boot': 'Spring Boot',
  java: 'Java',
  kotlin: 'Kotlin',
  python: 'Python',
  golang: 'Go',
  go: 'Go',
  docker: 'Docker',
  kubernetes: 'Kubernetes',
  aws: 'AWS',
  gcp: 'GCP',
  azure: 'Azure',
  mysql: 'MySQL',
  postgresql: 'PostgreSQL',
  postgres: 'PostgreSQL',
  redis: 'Redis',
  kafka: 'Kafka',
  elasticsearch: 'Elasticsearch',
  graphql: 'GraphQL',
  swift: 'Swift',
  swiftui: 'SwiftUI',
  objectivec: 'Objective-C',
  ios: 'iOS',
  android: 'Android',
  linux: 'Linux',
  cicd: 'CI/CD',
  'ci/cd': 'CI/CD',
  git: 'Git',
  spark: 'Spark',
  hadoop: 'Hadoop',
  hbase: 'HBase',
  ai: 'AI',
  'machine learning': 'Machine Learning',
  'deep learning': 'Deep Learning',
};

@Injectable()
export class SkillNameNormalizerService {
  normalize(value: string): string | null {
    const trimmed = value.trim();

    if (!trimmed) {
      return null;
    }

    const compact = trimmed
      .toLowerCase()
      .replace(/[()]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const key = compact.replace(/[^a-z0-9+.#/\s-]/g, '').trim();

    if (!key) {
      return null;
    }

    return CANONICAL_SKILL_NAMES[key] ?? this.toTitleLike(trimmed);
  }

  private toTitleLike(value: string): string {
    if (value.toUpperCase() === value) {
      return value;
    }

    return value
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join(' ');
  }
}
