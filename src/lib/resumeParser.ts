import { ResumeData, Experience, Education, Certification, Referee } from '../types';

export function parseMarkdownToResumeData(md: string, defaultData: ResumeData): ResumeData {
  // Deep clone default data to use as fallback
  const result: ResumeData = JSON.parse(JSON.stringify(defaultData));
  
  if (!md || md.trim() === '') {
    return result;
  }

  const lines = md.split('\n').map(l => l.trim());
  
  // 1. Parse Name
  const nameLine = lines.find(l => l.startsWith('# '));
  if (nameLine) {
    result.personalInfo.fullName = nameLine.replace('# ', '').trim();
  }
  
  // 2. Parse Job Title
  // Search for bold or italic blocks below name but before contact details or next headers
  for (let i = 0; i < Math.min(lines.length, 12); i++) {
    const line = lines[i];
    if (line.startsWith('**') && line.endsWith('**')) {
      const extracted = line.replace(/\*\*/g, '').trim();
      if (extracted && !extracted.includes('|') && !extracted.includes('##')) {
        result.personalInfo.jobTitle = extracted;
        break;
      }
    } else if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('* ')) {
      const extracted = line.replace(/\*/g, '').trim();
      if (extracted && !extracted.includes('|') && !extracted.includes('##')) {
        result.personalInfo.jobTitle = extracted;
        break;
      }
    }
  }
  
  // 3. Parse Contact Line
  const contactLine = lines.find(l => l.includes('|') || l.includes('•') || (l.includes('@') && l.includes('+')));
  if (contactLine) {
    const parts = contactLine.split(/[|•]/).map(p => p.trim());
    parts.forEach(part => {
      if (part.includes('@')) {
        result.personalInfo.email = part;
      } else if (part.match(/\+?\d[\d-\s()]{7,}/)) {
        result.personalInfo.phone = part;
      } else if (part.toLowerCase().includes('linkedin.com') || part.toLowerCase().includes('linkedin')) {
        result.personalInfo.linkedin = part;
      } else if (part.length > 2 && !part.startsWith('#') && !part.startsWith('*') && !part.startsWith('!')) {
        result.personalInfo.location = part;
      }
    });
  }

  // Parse Sections by splitting by ## Header lines
  let currentSection = '';
  let sectionContent: string[] = [];
  const sections: { [key: string]: string[] } = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('## ')) {
      if (currentSection) {
        sections[currentSection] = sectionContent;
      }
      currentSection = line.replace('## ', '').toLowerCase().trim();
      sectionContent = [];
    } else if (currentSection) {
      sectionContent.push(line);
    }
  }
  if (currentSection) {
    sections[currentSection] = sectionContent;
  }

  // Helper helper to locate a section matching any of the alternative titles
  const findSectionLines = (titles: string[]): string[] | null => {
    for (const title of titles) {
      if (sections[title]) {
        return sections[title];
      }
    }
    // Deep fallback search (partial match)
    for (const key of Object.keys(sections)) {
      for (const title of titles) {
        if (key.includes(title) || title.includes(key)) {
          return sections[key];
        }
      }
    }
    return null;
  };

  // Parse Summary
  const summaryLines = findSectionLines(['summary', 'professional summary', 'profile', 'about me', 'executive summary']);
  if (summaryLines && summaryLines.length > 0) {
    result.summary = summaryLines
      .filter(l => !l.startsWith('![')) // remove profile picture markdown
      .join('\n')
      .trim();
  }

  // Parse Skills
  const skillsLines = findSectionLines(['skills', 'core competencies', 'technical skills', 'skills & core competencies', 'key competencies']);
  if (skillsLines && skillsLines.length > 0) {
    result.skills = skillsLines.join('\n').trim();
  }

  // Parse Work Experience
  const expLines = findSectionLines(['work experience', 'experience', 'professional experience', 'employment history', 'milestones']);
  if (expLines && expLines.length > 0) {
    const experiences: Experience[] = [];
    let currentExp: Experience | null = null;
    
    for (const line of expLines) {
      if (line.startsWith('### ')) {
        if (currentExp) {
          experiences.push(currentExp);
        }
        
        // Format: "Role at Company" or "Role - Company"
        const headerText = line.replace('### ', '').trim();
        let role = '';
        let company = '';
        
        if (headerText.includes(' at ')) {
          const parts = headerText.split(' at ');
          role = parts[0].trim();
          company = parts.slice(1).join(' at ').trim();
        } else if (headerText.includes(' - ')) {
          const parts = headerText.split(' - ');
          role = parts[0].trim();
          company = parts.slice(1).join(' - ').trim();
        } else {
          role = headerText;
          company = '';
        }

        currentExp = {
          id: Math.random().toString(),
          role,
          company,
          startDate: '',
          endDate: '',
          description: '',
          bulletPoints: []
        };
      } else if (currentExp) {
        // Parse dates: check if of the format *Jan 2022 - Present*
        if (line.startsWith('*') && line.endsWith('*') && line.includes('-') && !line.startsWith('* ')) {
          const dates = line.replace(/\*/g, '').split('-').map(d => d.trim());
          currentExp.startDate = dates[0] || '';
          currentExp.endDate = dates[1] || '';
        } else if (line.startsWith('_') && line.endsWith('_') && line.includes('-')) {
          const dates = line.replace(/_/g, '').split('-').map(d => d.trim());
          currentExp.startDate = dates[0] || '';
          currentExp.endDate = dates[1] || '';
        } else if (line.startsWith('-') || line.startsWith('* ')) {
          const bullet = line.replace(/^[-*]\s*/, '').trim();
          if (bullet) {
            currentExp.bulletPoints.push(bullet);
          }
        } else if (line.trim()) {
          if (currentExp.description) currentExp.description += '\n';
          currentExp.description += line;
        }
      }
    }
    if (currentExp) {
      experiences.push(currentExp);
    }
    if (experiences.length > 0) {
      result.experiences = experiences;
    }
  }

  // Parse Education
  const eduLines = findSectionLines(['education', 'academic history', 'education history', 'degrees']);
  if (eduLines && eduLines.length > 0) {
    const educations: Education[] = [];
    let currentEdu: Education | null = null;

    for (const line of eduLines) {
      if (line.startsWith('### ')) {
        if (currentEdu) {
          educations.push(currentEdu);
        }
        
        const headerText = line.replace('### ', '').trim();
        let degree = '';
        let institution = '';

        if (headerText.includes(' - ')) {
          const parts = headerText.split(' - ');
          degree = parts[0].trim();
          institution = parts.slice(1).join(' - ').trim();
        } else if (headerText.includes(' at ')) {
          const parts = headerText.split(' at ');
          degree = parts[0].trim();
          institution = parts.slice(1).join(' at ').trim();
        } else {
          degree = headerText;
          institution = '';
        }

        currentEdu = {
          id: Math.random().toString(),
          institution,
          degree,
          graduationYear: ''
        };
      } else if (currentEdu) {
        if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('* ')) {
          currentEdu.graduationYear = line.replace(/\*|Class of /g, '').trim();
        } else if (line.startsWith('_') && line.endsWith('_')) {
          currentEdu.graduationYear = line.replace(/_|Class of /g, '').trim();
        } else if (line.trim()) {
          if (currentEdu.institution === '') {
            currentEdu.institution = line;
          }
        }
      }
    }
    if (currentEdu) {
      educations.push(currentEdu);
    }
    if (educations.length > 0) {
      result.educations = educations;
    }
  }

  // Parse Certifications
  const certLines = findSectionLines(['certifications', 'licenses & certifications', 'certificates', 'accreditations']);
  if (certLines && certLines.length > 0) {
    const certifications: Certification[] = [];
    let currentCert: Certification | null = null;

    for (const line of certLines) {
      if (line.startsWith('### ')) {
        if (currentCert) {
          certifications.push(currentCert);
        }
        currentCert = {
          id: Math.random().toString(),
          name: line.replace('### ', '').trim(),
          issuer: '',
          date: ''
        };
      } else if (currentCert) {
        if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('* ')) {
          const parts = line.replace(/\*/g, '').split('-').map(p => p.trim());
          if (parts[1]) {
            currentCert.issuer = parts[0] || '';
            currentCert.date = parts[1] || '';
          } else {
            currentCert.issuer = parts[0] || '';
          }
        } else if (line.startsWith('_') && line.endsWith('_')) {
          const parts = line.replace(/_/g, '').split('-').map(p => p.trim());
          if (parts[1]) {
            currentCert.issuer = parts[0] || '';
            currentCert.date = parts[1] || '';
          } else {
            currentCert.issuer = parts[0] || '';
          }
        } else if (line.trim()) {
          currentCert.issuer = line;
        }
      }
    }
    if (currentCert) {
      certifications.push(currentCert);
    }
    if (certifications.length > 0) {
      result.certifications = certifications;
    }
  }

  // Parse Projects
  const projectLines = findSectionLines(['projects', 'key projects', 'featured projects', 'selected projects']);
  if (projectLines && projectLines.length > 0) {
    const projects: any[] = [];
    let currentProj: any = null;

    for (const line of projectLines) {
      if (line.startsWith('### ')) {
        if (currentProj) {
          projects.push(currentProj);
        }
        currentProj = {
          id: Math.random().toString(),
          name: line.replace('### ', '').trim(),
          url: '',
          technologies: '',
          description: ''
        };
      } else if (currentProj) {
        const trimmed = line.trim();
        if (trimmed.startsWith('*') && trimmed.endsWith('*') && (trimmed.includes('http') || trimmed.includes('/') || trimmed.includes('.'))) {
          currentProj.url = trimmed.replace(/\*/g, '').trim();
        } else if (/^technologies\s*:/i.test(trimmed)) {
          currentProj.technologies = trimmed.replace(/^technologies\s*:\s*/i, '').trim();
        } else if (trimmed) {
          if (currentProj.description) {
            currentProj.description += '\n' + trimmed;
          } else {
            currentProj.description = trimmed;
          }
        }
      }
    }
    if (currentProj) {
      projects.push(currentProj);
    }
    if (projects.length > 0) {
      result.projects = projects;
    }
  }

  // Parse Achievements
  const achLines = findSectionLines(['achievements', 'accomplishments', 'key accomplishments', 'milestones & key achievements']);
  if (achLines && achLines.length > 0) {
    const achievements: any[] = [];
    let currentAch: any = null;

    for (const line of achLines) {
      if (line.startsWith('### ')) {
        if (currentAch) {
          achievements.push(currentAch);
        }
        currentAch = {
          id: Math.random().toString(),
          title: line.replace('### ', '').trim(),
          description: ''
        };
      } else if (currentAch) {
        const trimmed = line.trim();
        if (trimmed) {
          if (currentAch.description) {
            currentAch.description += '\n' + trimmed;
          } else {
            currentAch.description = trimmed;
          }
        }
      }
    }
    if (currentAch) {
      achievements.push(currentAch);
    }
    if (achievements.length > 0) {
      result.achievements = achievements;
    }
  }

  // Parse Referees/References
  const refereeLines = findSectionLines(['referees', 'references', 'referee', 'reference']);
  if (refereeLines && refereeLines.length > 0) {
    const referees: Referee[] = [];
    let currentRef: Referee | null = null;

    for (const line of refereeLines) {
      if (line.startsWith('### ')) {
        if (currentRef) {
          referees.push(currentRef);
        }
        currentRef = {
          id: Math.random().toString(),
          name: line.replace('### ', '').trim(),
          relationship: '',
          company: '',
          phone: '',
          email: ''
        };
      } else if (currentRef) {
        const trimmed = line.trim();
        if ((trimmed.startsWith('*') && trimmed.endsWith('*') && !trimmed.startsWith('* ')) || 
            (trimmed.startsWith('_') && trimmed.endsWith('_'))) {
          const formatVal = trimmed.replace(/^[\*_]|[\*_]$/g, '').trim();
          if (formatVal.includes(' - ')) {
            const parts = formatVal.split(' - ');
            currentRef.relationship = parts[0].trim();
            currentRef.company = parts.slice(1).join(' - ').trim();
          } else if (formatVal.includes(' at ')) {
            const parts = formatVal.split(' at ');
            currentRef.relationship = parts[0].trim();
            currentRef.company = parts.slice(1).join(' at ').trim();
          } else {
            currentRef.relationship = formatVal;
          }
        } else if (/phone|tel|contact/i.test(trimmed)) {
          currentRef.phone = trimmed.replace(/^(phone|tel|contact)\s*:\s*/i, '').trim();
        } else if (/email|mail/i.test(trimmed)) {
          currentRef.email = trimmed.replace(/^(email|mail)\s*:\s*/i, '').trim();
        } else if (trimmed) {
          if (!currentRef.relationship) {
            currentRef.relationship = trimmed;
          } else if (!currentRef.company) {
            currentRef.company = trimmed;
          }
        }
      }
    }
    if (currentRef) {
      referees.push(currentRef);
    }
    if (referees.length > 0) {
      result.referees = referees;
    }
  }

  return result;
}

export function getResumeStructuredData(markdown: string | null, defaultData: ResumeData): ResumeData {
  if (!markdown) return defaultData;
  return parseMarkdownToResumeData(markdown, defaultData);
}
