export interface JobDto {
  id: string;
  company: string;
  title: string;
  department: string;
  field: string;
  requirements: {
    career: string;
    skills: string[];
  };
  employmentType: string;
  locations: string[];
  period: {
    start: Date;
    end: Date;
  };
  url: string;
  source: {
    originalId: string;
    originalUrl: string;
  };
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
} 