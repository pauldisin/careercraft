export interface JobRoleSkills {
  title: string;
  category: string;
  skills: string[];
}

export const skillsDatabase: JobRoleSkills[] = [
  {
    title: "Software Engineer",
    category: "Technology",
    skills: ["TypeScript", "JavaScript", "React", "Node.js", "Python", "SQL", "Git", "REST APIs", "Docker", "AWS", "CI/CD", "Agile Methodology", "System Design", "Microservices", "Unit Testing"]
  },
  {
    title: "Frontend Developer",
    category: "Technology",
    skills: ["HTML5", "CSS3", "JavaScript", "TypeScript", "React", "Vue.js", "Tailwind CSS", "Sass", "Webpack", "Vite", "Responsive Design", "Next.js", "State Management (Redux/Zustand)", "REST APIs", "Git"]
  },
  {
    title: "Backend Developer",
    category: "Technology",
    skills: ["Node.js", "Python", "Go", "Java", "Express.js", "PostgreSQL", "MongoDB", "Database Schema Design", "Redis", "Docker", "AWS", "RESTful APIs", "GraphQL", "Microservices", "Unit Testing (Jest/Mocha)"]
  },
  {
    title: "Full Stack Developer",
    category: "Technology",
    skills: ["React", "Node.js", "TypeScript", "Express.js", "PostgreSQL", "MongoDB", "HTML5/CSS3", "Git", "REST APIs", "Docker", "AWS", "Tailwind CSS", "Next.js", "Redux", "CI/CD"]
  },
  {
    title: "Data Scientist",
    category: "Data & Analytics",
    skills: ["Python", "SQL", "Machine Learning", "Statistics", "Pandas", "NumPy", "Scikit-Learn", "R", "Tableau", "Data Visualization", "Deep Learning", "TensorFlow", "A/B Testing", "Big Data", "Data Wrangling"]
  },
  {
    title: "Data Analyst",
    category: "Data & Analytics",
    skills: ["SQL", "Excel (Advanced)", "Tableau", "Power BI", "Python", "Data Visualization", "Data Cleansing", "Statistics", "Reporting", "Google Analytics", "Pandas", "Dashboard Design", "KPI Tracking"]
  },
  {
    title: "Product Manager",
    category: "Management",
    skills: ["Product Strategy", "Roadmapping", "Agile & Scrum", "User Research", "Market Analysis", "Feature Prioritization", "Stakeholder Management", "Jira", "A/B Testing", "Product Analytics", "Cross-functional Leadership", "SQL", "MVP Definition"]
  },
  {
    title: "Project Manager",
    category: "Management",
    skills: ["Project Planning", "Risk Management", "Scrum", "Budgeting", "Gantt Charts", "Stakeholder Communication", "Resource Allocation", "Jira / Asana", "Agile Methodology", "Scope Management", "Team Leadership", "Conflict Resolution"]
  },
  {
    title: "UX/UI Designer",
    category: "Design & Creative",
    skills: ["Figma", "Design Systems", "Wireframing", "Interactive Prototyping", "User Research", "Information Architecture", "Visual Design", "User Testing", "Adobe Creative Suite", "Typography", "Responsive Design", "Heuristic Evaluation"]
  },
  {
    title: "Graphic Designer",
    category: "Design & Creative",
    skills: ["Adobe Illustrator", "Adobe Photoshop", "Adobe InDesign", "Branding & Identity", "Typography", "Layout Design", "Vector Illustration", "Print Production", "Color Theory", "Logo Design", "Digital Illustration", "Motion Graphics"]
  },
  {
    title: "Digital Marketer",
    category: "Marketing",
    skills: ["SEO (Search Engine Optimization)", "Google Analytics", "SEM / Google Ads", "Content Strategy", "Email Marketing", "Social Media Marketing", "Copywriting", "A/B Testing", "Meta Ads Manager", "HubSpot", "Marketing Automation", "Lead Generation"]
  },
  {
    title: "Content Writer / Marketer",
    category: "Marketing",
    skills: ["Content Strategy", "SEO Writing", "Copywriting", "WordPress", "Editing & Proofreading", "Keyword Research", "Email Campaigns", "Social Media Copy", "Brand Storytelling", "Blogging", "Technical Writing"]
  },
  {
    title: "Financial Analyst",
    category: "Business & Finance",
    skills: ["Financial Modeling", "Valuation", "Excel (Advanced/VBA)", "Forecasting & Budgeting", "Reporting & Dashboards", "Corporate Finance", "SQL", "Data Analysis", "QuickBooks", "GAAP", "Risk Analysis"]
  },
  {
    title: "Business Analyst",
    category: "Business & Finance",
    skills: ["Business Process Modeling", "Requirements Gathering", "SQL", "Stakeholder Interviews", "UML Diagrams", "Data Analysis", "As-Is & To-Be Analysis", "Jira / Confluence", "Agile Methodology", "GAP Analysis", "Tableau"]
  },
  {
    title: "Sales Development Representative (SDR)",
    category: "Sales & Success",
    skills: ["Cold Outbound", "Lead Qualification", "Salesforce / CRM", "HubSpot", "Email Prospecting", "Active Listening", "Negotiation", "Pipeline Management", "Product Demo Delivery", "Sales Loft", "B2B Sales"]
  },
  {
    title: "Customer Success Manager",
    category: "Sales & Success",
    skills: ["Customer Retention", "Client Onboarding", "CRM / Gainsight", "Zendesk", "Account Management", "SLA Compliance", "Conflict Resolution", "Product Adoption Tracking", "Upselling", "Chur Minimization"]
  },
  {
    title: "HR Specialist / Recruiter",
    category: "Operations & HR",
    skills: ["Applicant Tracking Systems (ATS)", "Talent Acquisition", "Technical Sourcing", "Interviewing", "Onboarding", "Employee Relations", "HR Policies", "LinkedIn Recruiter", "Performance Management", "Benefits Administration"]
  },
  {
    title: "DevOps Engineer",
    category: "Technology",
    skills: ["Docker", "Kubernetes", "AWS", "Terraform (IaC)", "CI/CD (Jenkins/GitHub Actions)", "Linux Administration", "Bash/Python Scripting", "Monitoring (Prometheus/Grafana)", "Nginx", "Git", "Cloud Security", "Infrastructure Scaling"]
  },
  {
    title: "QA Engineer / Software Tester",
    category: "Technology",
    skills: ["Manual Testing", "Test Automation (Selenium/Cypress)", "API Testing (Postman)", "Bug Tracking (Jira)", "Regression Testing", "Writing Test Cases", "SQL", "Git", "CI/CD Integration", "Performance Testing"]
  }
];

// Helper to find recommendations by job title keyword match
export function getRecommendedSkillsByTitle(jobTitle: string): JobRoleSkills[] {
  if (!jobTitle) return [];
  const normalizedTitle = jobTitle.toLowerCase();
  
  // Find roles that match the job title
  const matches = skillsDatabase.filter(role => {
    const roleTitle = role.title.toLowerCase();
    return roleTitle.includes(normalizedTitle) || normalizedTitle.includes(roleTitle) ||
      roleTitle.split(" ").some(word => word.length > 3 && normalizedTitle.includes(word));
  });

  return matches;
}

// Helper to search job titles in the database
export function searchJobRoles(query: string): JobRoleSkills[] {
  if (!query) return skillsDatabase;
  const normalizedQuery = query.toLowerCase();
  return skillsDatabase.filter(role => 
    role.title.toLowerCase().includes(normalizedQuery) || 
    role.category.toLowerCase().includes(normalizedQuery) ||
    role.skills.some(skill => skill.toLowerCase().includes(normalizedQuery))
  );
}

// Combined lists of some universally applicable soft/hard skills
export const universalSkills = {
  "Soft Skills": ["Emotional Intelligence", "Public Speaking", "Problem Solving", "Time Management", "Critical Thinking", "Adaptability", "Collaboration", "Active Listening", "Work Ethic", "Interpersonal Communication"],
  "Administrative / Tooling": ["Microsoft Suite (Excel, Word, PowerPoint)", "Google Workspace", "Slack", "Asana", "Trello", "Notion", "Zoom", "Miro"]
};
