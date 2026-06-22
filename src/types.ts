export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  jobTitle: string;
  linkedin: string;
  profilePicture?: string;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
  bulletPoints: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  graduationYear: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
}

export interface Referee {
  id: string;
  name: string;
  relationship: string;
  company: string;
  phone: string;
  email: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  technologies?: string;
  url?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
}

export interface SkillWithLevel {
  id: string;
  name: string;
  level: number; // 1-5
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  summary: string;
  experiences: Experience[];
  educations: Education[];
  skills: string;
  skillsWithLevels?: SkillWithLevel[];
  skillDisplayMode?: 'text' | 'proficiency';
  skillDisplayType?: 'dots' | 'bars';
  certifications: Certification[];
  referees?: Referee[];
  projects?: Project[];
  achievements?: Achievement[];
  pdfFriendly?: boolean;
}
