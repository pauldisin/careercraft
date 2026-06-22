import React from 'react';
import { ResumeData } from '../types';
import { motion } from 'motion/react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Linkedin, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Code,
  User,
  Globe,
  Calendar,
  CheckCircle2,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

export const CollapseContext = React.createContext<{
  collapsedSections: Record<string, boolean>;
  toggleSection: (sectionKey: string) => void;
}>({
  collapsedSections: {},
  toggleSection: () => {},
});

export const CollapsibleSection: React.FC<{
  sectionKey: string;
  headerElement: React.ReactElement<any>;
  children: React.ReactNode;
  isRow?: boolean;
  rowClass?: string;
  contentSpan?: string;
}> = ({ sectionKey, headerElement, children, isRow = false, rowClass = "", contentSpan = "" }) => {
  const { collapsedSections, toggleSection } = React.useContext(CollapseContext);
  const isCollapsed = !!collapsedSections[sectionKey];

  const button = (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleSection(sectionKey);
      }}
      className={`ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50/90 dark:bg-slate-850 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-650 text-[10px] font-extrabold text-indigo-700 dark:text-indigo-400 border border-indigo-200/40 dark:border-slate-800 cursor-pointer shadow-2xs transition-all duration-150 select-none print:hidden uppercase tracking-wider ${
        isRow ? 'mt-1.5 md:mt-2 block w-max ml-0 md:ml-auto' : ''
      }`}
      title={isCollapsed ? "Expand Section to calculate on page height" : "Collapse Section to hide from page calculations"}
    >
      {isCollapsed ? (
        <>
          <span>Expand</span>
          <ChevronDown className="w-3 h-3 text-indigo-500 hover:text-white shrink-0" />
        </>
      ) : (
        <>
          <span>Collapse</span>
          <ChevronUp className="w-3 h-3 text-indigo-500 hover:text-white shrink-0" />
        </>
      )}
    </button>
  );

  if (isRow) {
    const styledHeader = React.cloneElement(headerElement, {
      className: `${headerElement.props.className || ''} flex flex-col md:flex-row md:items-start w-full cursor-pointer group/header hover:opacity-90`.trim(),
      onClick: (e: any) => {
        if (e.target.tagName !== 'BUTTON' && e.target.parentElement?.tagName !== 'BUTTON') {
          toggleSection(sectionKey);
        }
      }
    }, ...(React.Children.toArray(headerElement.props.children)), button);

    return (
      <div className={`transition-all duration-200 ${rowClass} ${isCollapsed ? 'opacity-60 mb-2' : ''}`} data-section-key={sectionKey}>
        {styledHeader}
        {!isCollapsed ? (
          children
        ) : (
          <div className={`${contentSpan} text-slate-400 dark:text-slate-500 italic text-[11px] pt-0.5 print:hidden`}>
            Section collapsed (hidden from page height calculations)
          </div>
        )}
      </div>
    );
  }

  const styledHeader = React.cloneElement(headerElement, {
    className: `${headerElement.props.className || ''} flex items-center w-full cursor-pointer group/header hover:opacity-90`.trim(),
    onClick: (e: any) => {
      if (e.target.tagName !== 'BUTTON' && e.target.parentElement?.tagName !== 'BUTTON') {
        toggleSection(sectionKey);
      }
    }
  }, ...(React.Children.toArray(headerElement.props.children)), button);

  return (
    <div className={`transition-all duration-200 ${isCollapsed ? 'mb-2 opacity-60 pb-1' : ''}`} data-section-key={sectionKey}>
      {styledHeader}
      {!isCollapsed ? (
        <div className="mt-2 transition-all duration-300">{children}</div>
      ) : (
        <div className="text-slate-400 dark:text-slate-500 italic text-[11px] pl-1 pt-1 print:hidden">
          Section collapsed (hidden from page height calculations)
        </div>
      )}
    </div>
  );
};

interface TemplateProps {
  data: ResumeData;
  accentColor: string;
  fontFamily: string;
}

const SafeHTML: React.FC<{ htmlContent: string; className?: string }> = ({ htmlContent, className = "" }) => {
  if (!htmlContent) return null;
  const isEssentiallyEmpty = htmlContent.replace(/<[^>]*>/g, '').trim() === '';
  if (isEssentiallyEmpty) return null;

  // Replace non-breaking spaces with standard spaces to ensure proper word wrapping
  const cleanedContent = htmlContent
    .replace(/&nbsp;/g, ' ')
    .replace(/\u00A0/g, ' ');

  return (
    <div 
      className={`${className} [&_p]:leading-relaxed [&_p]:mb-1 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4`}
      style={{ padding: 0, margin: 0, background: 'transparent' }}
      dangerouslySetInnerHTML={{ __html: cleanedContent }}
    />
  );
};

interface ParsedSkill {
  category?: string;
  items: string[];
}

const parseSkills = (skillsRaw: string): ParsedSkill[] => {
  if (!skillsRaw) return [];
  const lines = skillsRaw.split('\n').map(line => line.trim()).filter(Boolean);
  const parsed: ParsedSkill[] = [];
  
  lines.forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0 && colonIndex < line.length - 1) {
      const category = line.slice(0, colonIndex).trim();
      const itemsRaw = line.slice(colonIndex + 1);
      const items = itemsRaw.split(',').map(item => item.trim()).filter(Boolean);
      parsed.push({ category, items });
    } else {
      const items = line.split(',').map(item => item.trim()).filter(Boolean);
      if (items.length > 0) {
        parsed.push({ items });
      }
    }
  });
  return parsed;
};

const SkillsRenderer: React.FC<{
  data: ResumeData;
  primaryColor: string;
  isLightBg?: boolean;
}> = ({ data, primaryColor, isLightBg = true }) => {
  const showProficiency = data.skillDisplayMode === 'proficiency' && data.skillsWithLevels && data.skillsWithLevels.length > 0;
  
  if (!showProficiency) {
    return null;
  }

  const list = data.skillsWithLevels || [];
  const displayType = data.skillDisplayType || 'dots';

  return (
    <div className="space-y-2.5 w-full pt-1">
      {list.map((sk) => {
        const percent = Math.min(100, Math.max(0, (sk.level / 5) * 100));
        return (
          <div key={sk.id} className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-[10px] font-bold tracking-wide uppercase">
              <span className={isLightBg ? 'text-slate-700 dark:text-slate-300' : 'text-white/90'}>
                {sk.name}
              </span>
              {displayType === 'bars' && (
                <span className={isLightBg ? 'text-slate-400 dark:text-slate-500 text-[9px]' : 'text-white/60 text-[9px]'}>
                  {sk.level}/5
                </span>
              )}
            </div>
            
            {displayType === 'dots' ? (
              <div className="flex gap-1.5 items-center h-2.5">
                {[1, 2, 3, 4, 5].map((dot) => {
                  const isActive = dot <= sk.level;
                  let dotBg = 'rgba(226, 232, 240, 1)';
                  if (isActive) {
                    dotBg = primaryColor;
                  } else {
                    dotBg = isLightBg ? 'rgba(226, 232, 240, 1)' : 'rgba(255, 255, 255, 0.2)';
                  }
                  return (
                    <span
                      key={dot}
                      className="w-2 h-2 rounded-full transition-all duration-300"
                      style={{ backgroundColor: dotBg }}
                    />
                  );
                })}
              </div>
            ) : (
              <div 
                className="h-1.5 w-full rounded-full overflow-hidden"
                style={{ backgroundColor: isLightBg ? 'rgba(226, 232, 240, 0.8)' : 'rgba(255, 255, 255, 0.25)' }}
              >
                <div 
                  className="h-full rounded-full transition-all duration-500 ease-out" 
                  style={{ 
                    width: `${percent}%`,
                    backgroundColor: primaryColor
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export const ModernTemplate: React.FC<TemplateProps> = ({ data, accentColor, fontFamily }) => {
  const profilePic = data.personalInfo.profilePicture;
  const primaryColor = accentColor || '#4f46e5';
  
  return (
    <div 
      className="w-full bg-white text-slate-700 rounded-lg select-none shadow-sm max-w-full overflow-hidden"
      style={{ fontFamily: fontFamily || "'Inter', sans-serif" }}
    >
      {/* Decorative top accent line */}
      <div className="h-2 w-full" style={{ backgroundColor: primaryColor }} />

      <div className="p-8 md:p-10 space-y-8">
        {/* Top Banner Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-100 pb-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">
              {data.personalInfo.fullName}
            </h1>
            <p 
              className="text-xs font-semibold tracking-wider uppercase px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full inline-block mt-1"
              style={{ color: primaryColor }}
            >
              {data.personalInfo.jobTitle}
            </p>
          </div>
          
          {profilePic && (
            <div className="flex-shrink-0">
              <img 
                src={profilePic} 
                alt={data.personalInfo.fullName} 
                className="w-24 h-24 rounded-full object-cover border-4 shadow-sm ring-4 ring-slate-50"
                style={{ borderColor: primaryColor }}
              />
            </div>
          )}
        </div>

        {/* Two-Column Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Sidebar Info */}
          <div className="md:col-span-4 space-y-6">
            {/* Contact Card */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-md transition duration-200 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" style={{ color: primaryColor }} /> Contact Details
              </h3>
              <ul className="space-y-3 text-xs text-slate-600 font-medium">
                <li className="flex items-start gap-2.5">
                  <Mail className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-slate-400" />
                  <span className="break-all">{data.personalInfo.email}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Phone className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-slate-400" />
                  <span>{data.personalInfo.phone}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-slate-400" />
                  <span>{data.personalInfo.location}</span>
                </li>
                {data.personalInfo.linkedin && (
                  <li className="flex items-start gap-2.5">
                    <Linkedin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-slate-400" />
                    <span className="break-all">{data.personalInfo.linkedin}</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Core Skills */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-md transition duration-200 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5" style={{ color: primaryColor }} /> Skills
              </h3>
              <div className="space-y-3 pt-1">
                {data.skillDisplayMode === 'proficiency' && data.skillsWithLevels && data.skillsWithLevels.length > 0 ? (
                  <SkillsRenderer data={data} primaryColor={primaryColor} isLightBg={true} />
                ) : (
                  parseSkills(data.skills).map((group, gIdx) => (
                    <div key={gIdx} className="space-y-1.5">
                      {group.category && (
                        <h4 className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400/95 ml-0.5">
                          {group.category}
                        </h4>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        {group.items.map((sk, idx) => (
                          <span 
                            key={idx} 
                            className="text-[10px] font-semibold px-2.5 py-1 rounded-full transition duration-150 hover:opacity-90"
                            style={{ 
                              backgroundColor: primaryColor.startsWith('#') && primaryColor.length === 7 ? `${primaryColor}14` : 'rgba(79, 70, 229, 0.08)', 
                              color: primaryColor 
                            }}
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Certifications Section */}
            {data.certifications && data.certifications.length > 0 && (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-md transition duration-200 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" style={{ color: primaryColor }} /> Credentials
                </h3>
                <div className="space-y-3.5">
                  {data.certifications.map((cert) => (
                    <div key={cert.id} className="text-xs group">
                      <div className="font-bold text-slate-800 flex items-start gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-500 flex-shrink-0" />
                        <span>{cert.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-semibold pl-4.5 mt-0.5">
                        {cert.issuer} {cert.date ? `• ${cert.date}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Main Panel */}
          <div className="md:col-span-8 space-y-8">
            {/* Profile Summary */}
            {data.summary && (
              <CollapsibleSection
                sectionKey="summary"
                headerElement={
                  <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} /> Professional Profile
                  </h2>
                }
              >
                <SafeHTML 
                  htmlContent={data.summary} 
                  className="text-xs md:text-[13px] leading-relaxed text-slate-700 text-justify"
                />
              </CollapsibleSection>
            )}

            {/* Work History */}
            {data.experiences && data.experiences.length > 0 && (
              <CollapsibleSection
                sectionKey="experience"
                headerElement={
                  <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} /> Work Experience
                  </h2>
                }
              >
                <div className="relative pl-1 border-l-2 border-slate-10 ml-1.5 pt-1">
                  {data.experiences.map((exp, idx) => {
                    const isSameCompany = idx > 0 && exp.company && data.experiences[idx - 1]?.company?.toLowerCase().trim() === exp.company.toLowerCase().trim();
                    return (
                      <div 
                        key={exp.id} 
                        className={`relative pl-6 space-y-2 group ${isSameCompany ? 'mt-4 pt-1' : idx > 0 ? 'mt-8 pt-2' : ''}`}
                      >
                        {/* Timeline Dot Accent */}
                        <span 
                          className={`absolute rounded-full border-2 border-white shadow-xs group-hover:scale-110 transition-transform duration-150 ${
                            isSameCompany 
                              ? '-left-[5px] w-2.5 h-2.5 mt-1' 
                              : '-left-[7px] w-3.5 h-3.5'
                          }`}
                          style={{ backgroundColor: primaryColor }}
                        />
                        
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                          <div>
                            <h4 className="font-bold text-[14px] text-slate-900 group-hover:text-indigo-950 transition-colors duration-150">
                              {exp.role}
                            </h4>
                            {!isSameCompany && (
                              <span className="text-xs inline-flex items-center gap-1.5 text-slate-500 font-semibold mt-0.5">
                                <Briefcase className="w-3.5 h-3.5" /> {exp.company}
                              </span>
                            )}
                          </div>
                          <span 
                            className="text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-150 px-2.5 py-1 rounded-lg shadow-2xs whitespace-nowrap"
                          >
                            {exp.startDate} – {exp.endDate}
                          </span>
                        </div>
                        
                        {exp.description && (
                          <SafeHTML 
                            htmlContent={exp.description} 
                            className="text-xs md:text-[12.5px] leading-relaxed text-slate-600 text-justify"
                          />
                        )}
                        
                        {exp.bulletPoints && exp.bulletPoints.length > 0 && (
                          <ul className="list-disc pl-4.5 space-y-1.5 text-xs text-slate-600">
                            {exp.bulletPoints.map((bp, i) => bp.trim() ? (
                              <li key={i} className="leading-relaxed marker:text-indigo-400">{bp}</li>
                            ) : null)}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CollapsibleSection>
            )}

            {/* Education History */}
            {data.educations && data.educations.length > 0 && (
              <CollapsibleSection
                sectionKey="education"
                headerElement={
                  <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} /> Academic History
                  </h2>
                }
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.educations.map((edu) => (
                    <div key={edu.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.02)] hover:shadow-sm transition duration-200 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-slate-100 rounded-full -mr-6 -mt-6 flex items-center justify-center grayscale opacity-15">
                        <GraduationCap className="w-10 h-10" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-indigo-600 tracking-wide bg-indigo-50 border border-indigo-10/10 px-2 py-0.5 rounded-md inline-block">
                          {edu.graduationYear ? `Class of ${edu.graduationYear}` : 'Ongoing'}
                        </span>
                        <h4 className="font-extrabold text-[#0f172a] text-xs pt-1">
                          {edu.degree}
                        </h4>
                        <div className="text-[11px] text-slate-500 font-semibold">{edu.institution}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Projects Section */}
            {data.projects && data.projects.length > 0 && (
              <CollapsibleSection
                sectionKey="projects"
                headerElement={
                  <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} /> Projects
                  </h2>
                }
              >
                <div className="space-y-4">
                  {data.projects.map((proj) => (
                    <div key={proj.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.02)] hover:shadow-sm transition duration-200 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1">
                        <h4 className="font-extrabold text-[13.5px] text-[#0f172a]">{proj.name}</h4>
                        {proj.url && (
                          <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1">
                            <Globe className="w-3 h-3" /> Link
                          </a>
                        )}
                      </div>
                      {proj.technologies && (
                        <div className="flex flex-wrap gap-1">
                          {proj.technologies.split(',').map((tech) => tech.trim()).filter(Boolean).map((tech, i) => (
                            <span key={i} className="text-[9px] font-bold uppercase tracking-wider bg-white border border-slate-250 text-slate-600 px-2 py-0.5 rounded-md">
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                      {proj.description && (
                        <SafeHTML 
                          htmlContent={proj.description} 
                          className="text-xs leading-relaxed text-slate-650 text-justify"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Achievements Section */}
            {data.achievements && data.achievements.length > 0 && (
              <CollapsibleSection
                sectionKey="achievements"
                headerElement={
                  <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} /> Achievements
                  </h2>
                }
              >
                <div className="grid grid-cols-1 gap-3">
                  {data.achievements.map((ach) => (
                    <div key={ach.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.02)] hover:shadow-sm transition duration-200 flex gap-3">
                      <Award className="w-4 h-4 flex-shrink-0 text-amber-500 mt-0.5" />
                      <div>
                        <h4 className="font-extrabold text-[#0f172a] text-xs mb-0.5">{ach.title}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">{ach.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Referees Section */}
            {data.referees && data.referees.length > 0 && (
              <CollapsibleSection
                sectionKey="referees"
                headerElement={
                  <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} /> References
                  </h2>
                }
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.referees.map((ref) => (
                    <div key={ref.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.02)] hover:shadow-sm transition duration-200 space-y-2">
                      <div className="font-extrabold text-[#0f172a] text-xs">
                        {ref.name}
                      </div>
                      {(ref.relationship || ref.company) && (
                        <div className="text-[10px] font-bold tracking-wide uppercase" style={{ color: primaryColor }}>
                          {ref.relationship}{ref.relationship && ref.company ? ' at ' : ''}{ref.company}
                        </div>
                      )}
                      <div className="text-[11px] text-slate-500 font-semibold space-y-1">
                        {ref.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span>{ref.phone}</span>
                          </div>
                        )}
                        {ref.email && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span className="break-all">{ref.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const CorporateTemplate: React.FC<TemplateProps> = ({ data, accentColor, fontFamily }) => {
  const primaryColor = accentColor || '#1e3a8a';
  const profilePic = data.personalInfo.profilePicture;

  return (
    <div 
      className="w-full bg-white text-slate-900 leading-relaxed shadow-sm rounded-lg overflow-hidden border border-slate-100 select-none"
      style={{ fontFamily: fontFamily || "'Lora', 'Merriweather', 'Georgia', serif" }}
    >
      <div className="p-8 md:p-11 space-y-8">
        {/* Centered Sophisticated Corporate Header */}
        <div className="text-center space-y-3 pb-6" style={{ borderBottomColor: primaryColor.startsWith('#') && primaryColor.length === 7 ? `${primaryColor}20` : 'rgba(30, 41, 59, 0.12)', borderBottomWidth: '1px' }}>
          <div className="flex justify-between items-center gap-4">
            <div className="flex-1 text-center">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-wide text-slate-950 font-serif">
                {data.personalInfo.fullName}
              </h1>
              <div 
                className="text-xs md:text-sm font-bold tracking-widest uppercase mt-2 font-serif" 
                style={{ color: primaryColor }}
              >
                {data.personalInfo.jobTitle}
              </div>
            </div>
            
            {profilePic && (
              <img 
                src={profilePic} 
                alt="Profile" 
                className="w-20 h-20 rounded-md object-cover border-2 shadow-xs ml-4"
                style={{ borderColor: primaryColor }}
              />
            )}
          </div>

          <div className="text-xs text-slate-500 space-x-4 flex justify-center flex-wrap items-center pt-3 font-sans">
            {data.personalInfo.email && (
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 opacity-80" style={{ color: primaryColor }} /> {data.personalInfo.email}
              </span>
            )}
            {data.personalInfo.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 opacity-80" style={{ color: primaryColor }} /> {data.personalInfo.phone}
              </span>
            )}
            {data.personalInfo.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 opacity-80" style={{ color: primaryColor }} /> {data.personalInfo.location}
              </span>
            )}
            {data.personalInfo.linkedin && (
              <span className="flex items-center gap-1">
                <Linkedin className="w-3.5 h-3.5 opacity-80" style={{ color: primaryColor }} /> <span className="break-all">{data.personalInfo.linkedin}</span>
              </span>
            )}
          </div>
        </div>

        {/* Executive Summary */}
        {data.summary && (
          <CollapsibleSection
            sectionKey="summary"
            headerElement={
              <h2 className="text-sm md:text-base font-bold tracking-widest border-b pb-1 text-slate-900" style={{ color: primaryColor, borderBottomColor: primaryColor.startsWith('#') && primaryColor.length === 7 ? `${primaryColor}30` : 'rgba(30, 41, 59, 0.15)', fontVariant: 'small-caps' }}>
                Executive Profile
              </h2>
            }
          >
            <SafeHTML 
              htmlContent={data.summary} 
              className="text-xs md:text-[13px] text-justify text-slate-800 leading-relaxed pt-1"
            />
          </CollapsibleSection>
        )}

        {/* Professional Work History */}
        {data.experiences && data.experiences.length > 0 && (
          <CollapsibleSection
            sectionKey="experience"
            headerElement={
              <h2 className="text-sm md:text-base font-bold tracking-widest border-b pb-1 text-slate-900" style={{ color: primaryColor, borderBottomColor: primaryColor.startsWith('#') && primaryColor.length === 7 ? `${primaryColor}30` : 'rgba(30, 41, 59, 0.15)', fontVariant: 'small-caps' }}>
                Professional History
              </h2>
            }
          >
            <div className="space-y-5">
              {data.experiences.map((exp) => (
                <div key={exp.id} className="space-y-1.5">
                  <div className="flex justify-between items-baseline gap-4 text-slate-950">
                    <div>
                      <span className="text-[13.5px] font-extrabold text-slate-900">{exp.role}</span>
                      <span className="text-xs font-semibold text-slate-500 block italic mt-0.5">{exp.company}</span>
                    </div>
                    <span className="text-xs italic text-slate-600 font-semibold text-right whitespace-nowrap self-start">{exp.startDate} – {exp.endDate}</span>
                  </div>
                  
                  {exp.description && (
                    <SafeHTML 
                      htmlContent={exp.description} 
                      className="text-xs md:text-[12.5px] leading-relaxed text-justify text-slate-800"
                    />
                  )}
                  
                  {exp.bulletPoints && exp.bulletPoints.length > 0 && (
                    <ul className="list-disc pl-5 space-y-1 text-xs text-slate-800">
                      {exp.bulletPoints.map((bp, i) => bp.trim() ? (
                        <li key={i} className="leading-relaxed">{bp}</li>
                      ) : null)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Academic Accomplishments */}
        {data.educations && data.educations.length > 0 && (
          <CollapsibleSection
            sectionKey="education"
            headerElement={
              <h2 className="text-sm md:text-base font-bold tracking-widest border-b pb-1 text-[#0f172a] dark:text-[#E2E8F0] uppercase tracking-[1px] font-sans" style={{ color: primaryColor, borderBottomColor: primaryColor.startsWith('#') && primaryColor.length === 7 ? `${primaryColor}30` : 'rgba(30, 41, 59, 0.15)', fontVariant: 'small-caps' }}>
                Academic Preparation
              </h2>
            }
          >
            <div className="space-y-3">
              {data.educations.map((edu) => (
                <div key={edu.id} className="flex justify-between items-baseline text-xs gap-4">
                  <div>
                    <span className="font-extrabold text-[#0f172a]">{edu.degree}</span>
                    <span className="text-slate-600 font-semibold">, {edu.institution}</span>
                  </div>
                  <span className="italic font-bold text-slate-900 whitespace-nowrap text-right">
                    {edu.graduationYear ? `Class of ${edu.graduationYear}` : ''}
                  </span>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Core Competencies */}
        <div className="space-y-3">
          <h2 className="text-sm md:text-base font-bold tracking-widest border-b pb-1 text-slate-900" style={{ color: primaryColor, borderBottomColor: primaryColor.startsWith('#') && primaryColor.length === 7 ? `${primaryColor}30` : 'rgba(30, 41, 59, 0.15)', fontVariant: 'small-caps' }}>
            Core Competencies
          </h2>
          <div className="space-y-2 pt-1">
            {data.skillDisplayMode === 'proficiency' && data.skillsWithLevels && data.skillsWithLevels.length > 0 ? (
              <SkillsRenderer data={data} primaryColor={primaryColor} isLightBg={true} />
            ) : (
              parseSkills(data.skills).map((group, idx) => (
                <div key={idx} className="text-xs leading-relaxed text-slate-800">
                  {group.category ? (
                    <p>
                      <span className="font-extrabold text-slate-950 uppercase tracking-wider text-[10px]">{group.category}: </span>
                      <span className="font-medium text-slate-800">{group.items.join(', ')}</span>
                    </p>
                  ) : (
                    <p className="font-medium text-slate-800">
                      {group.items.join('  •  ')}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Licenses and Accreditations */}
        {data.certifications && data.certifications.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm md:text-base font-bold tracking-widest border-b pb-1 text-slate-900" style={{ color: primaryColor, borderBottomColor: primaryColor.startsWith('#') && primaryColor.length === 7 ? `${primaryColor}30` : 'rgba(30, 41, 59, 0.15)', fontVariant: 'small-caps' }}>
              Professional Credentials
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {data.certifications.map((cert) => (
                <div key={cert.id} className="text-xs border-l-2 pl-2.5 py-0.5 border-slate-300">
                  <span className="font-bold text-slate-900">{cert.name}</span>
                  {cert.issuer && <span className="text-slate-600 font-medium"> ({cert.issuer})</span>}
                  {cert.date && <span className="text-slate-500 font-medium text-[10px]"> — {cert.date}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects Section */}
        {data.projects && data.projects.length > 0 && (
          <CollapsibleSection
            sectionKey="projects"
            headerElement={
              <h2 className="text-sm md:text-base font-bold tracking-widest border-b pb-1 text-slate-900" style={{ color: primaryColor, borderBottomColor: primaryColor.startsWith('#') && primaryColor.length === 7 ? `${primaryColor}30` : 'rgba(30, 41, 59, 0.15)', fontVariant: 'small-caps' }}>
                Key Projects
              </h2>
            }
          >
            <div className="space-y-4 pt-1">
              {data.projects.map((proj) => (
                <div key={proj.id} className="text-xs space-y-1">
                   <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1">
                    <span className="font-extrabold text-slate-900 text-[13px]">{proj.name}</span>
                    {proj.url && (
                      <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold text-indigo-700 hover:underline flex items-center gap-1">
                        <Globe className="w-3 h-3" /> Project URL
                      </a>
                    )}
                  </div>
                  {proj.technologies && (
                    <div className="text-[10px] text-slate-500 font-bold tracking-wide uppercase">
                      Technologies: {proj.technologies}
                    </div>
                  )}
                  {proj.description && (
                    <SafeHTML 
                      htmlContent={proj.description} 
                      className="text-xs text-slate-700 leading-relaxed text-justify mt-1"
                    />
                  )}
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Achievements Section */}
        {data.achievements && data.achievements.length > 0 && (
          <CollapsibleSection
            sectionKey="achievements"
            headerElement={
              <h2 className="text-sm md:text-base font-bold tracking-widest border-b pb-1 text-slate-900" style={{ color: primaryColor, borderBottomColor: primaryColor.startsWith('#') && primaryColor.length === 7 ? `${primaryColor}30` : 'rgba(30, 41, 59, 0.15)', fontVariant: 'small-caps' }}>
                Key Accomplishments
              </h2>
            }
          >
            <div className="space-y-3 pt-1">
              {data.achievements.map((ach) => (
                <div key={ach.id} className="text-xs flex gap-2.5 items-start">
                  <Award className="w-4 h-4 flex-shrink-0 text-slate-600 mt-0.5" />
                  <div>
                    <span className="font-extrabold text-slate-900">{ach.title}</span>
                    <p className="text-slate-650 leading-relaxed mt-0.5">{ach.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Referees */}
        {data.referees && data.referees.length > 0 && (
          <CollapsibleSection
            sectionKey="referees"
            headerElement={
              <h2 className="text-sm md:text-base font-bold tracking-widest border-b pb-1 text-slate-900" style={{ color: primaryColor, borderBottomColor: primaryColor.startsWith('#') && primaryColor.length === 7 ? `${primaryColor}30` : 'rgba(30, 41, 59, 0.15)', fontVariant: 'small-caps' }}>
                Professional References
              </h2>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {data.referees.map((ref) => (
                <div key={ref.id} className="text-xs space-y-1 font-sans">
                  <div className="font-extrabold text-[#0f172a]">{ref.name}</div>
                  {(ref.relationship || ref.company) && (
                    <div className="text-slate-500 font-bold text-[9px] tracking-wider uppercase">
                      {ref.relationship}{ref.relationship && ref.company ? ' – ' : ''}{ref.company}
                    </div>
                  )}
                  <div className="text-[#334155] space-y-1 font-sans text-[11px] mt-1">
                    {ref.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span>{ref.phone}</span>
                      </div>
                    )}
                    {ref.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="break-all">{ref.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
};

export const MinimalTemplate: React.FC<TemplateProps> = ({ data, accentColor, fontFamily }) => {
  const primaryColor = accentColor || '#171717';
  
  // Dynamic smart layout split based on maximum section label length for clean alignment
  const sectionTitles = [
    data.summary ? 'Profile' : '',
    data.experiences?.length ? 'Experience' : '',
    data.educations?.length ? 'Education' : '',
    'Expertise', // Skills
    data.certifications?.length ? 'Credentials' : '',
    data.projects?.length ? 'Projects' : '',
    data.achievements?.length ? 'Achievements' : '',
    data.referees?.length ? 'References' : ''
  ].filter(Boolean);
  const maxTitleLength = Math.max(...sectionTitles.map(t => t.length), 0);
  const titleSpan = maxTitleLength > 11 ? 'md:col-span-4' : 'md:col-span-3';
  const contentSpan = maxTitleLength > 11 ? 'md:col-span-8' : 'md:col-span-9';

  return (
    <div 
      className="w-full bg-white text-neutral-800 select-none shadow-sm rounded-lg overflow-hidden border border-neutral-100"
      style={{ fontFamily: fontFamily || "'Inter', system-ui, sans-serif" }}
    >
      <div className="p-8 md:p-10 space-y-8">
        {/* Crisp Header Row */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-neutral-100">
          <div className="space-y-1">
            <h1 
              className="text-3xl font-bold text-neutral-900 tracking-tight"
              style={{ fontFamily: "'Space Grotesk', 'Outfit', sans-serif" }}
            >
              {data.personalInfo.fullName}
            </h1>
            <p 
              className="text-xs font-semibold uppercase tracking-widest text-neutral-500"
              style={{ fontFamily: "'Space Grotesk', 'Outfit', sans-serif" }}
            >
              {data.personalInfo.jobTitle}
            </p>
          </div>
          
          <div className="text-xs text-neutral-600 space-y-1.5 text-left sm:text-right font-medium">
            {data.personalInfo.email && (
              <div className="flex items-center gap-1.5 sm:justify-end">
                <Mail className="w-3.5 h-3.5 text-neutral-400" /> <span>{data.personalInfo.email}</span>
              </div>
            )}
            {data.personalInfo.phone && (
              <div className="flex items-center gap-1.5 sm:justify-end">
                <Phone className="w-3.5 h-3.5 text-neutral-400" /> <span>{data.personalInfo.phone}</span>
              </div>
            )}
            {data.personalInfo.location && (
              <div className="flex items-center gap-1.5 sm:justify-end">
                <MapPin className="w-3.5 h-3.5 text-neutral-400" /> <span>{data.personalInfo.location}</span>
              </div>
            )}
            {data.personalInfo.linkedin && (
              <div className="flex items-center gap-1.5 sm:justify-end break-all">
                <Linkedin className="w-3.5 h-3.5 text-neutral-400" /> <span>{data.personalInfo.linkedin}</span>
              </div>
            )}
          </div>
        </div>

        {/* Structured clean rows */}
        <div className="space-y-8 text-xs leading-relaxed">
          {/* Summary Row */}
          {data.summary && (
            <CollapsibleSection
              sectionKey="summary"
              isRow={true}
              rowClass="grid grid-cols-1 md:grid-cols-12 gap-4"
              contentSpan={contentSpan}
              headerElement={
                <div 
                  className={`${titleSpan} text-[10px] font-bold uppercase tracking-widest pt-0.5`}
                  style={{ color: primaryColor, fontFamily: "'Space Grotesk', 'Outfit', sans-serif" }}
                >
                  Profile
                </div>
              }
            >
              <SafeHTML 
                htmlContent={data.summary} 
                className={`${contentSpan} text-neutral-800 font-normal leading-relaxed text-justify`}
              />
            </CollapsibleSection>
          )}

          {/* Experience Row */}
          {data.experiences && data.experiences.length > 0 && (
            <CollapsibleSection
              sectionKey="experience"
              isRow={true}
              rowClass="grid grid-cols-1 md:grid-cols-12 gap-4"
              contentSpan={contentSpan}
              headerElement={
                <div 
                  className={`${titleSpan} text-[10px] font-bold uppercase tracking-widest pt-0.5`}
                  style={{ color: primaryColor, fontFamily: "'Space Grotesk', 'Outfit', sans-serif" }}
                >
                  Experience
                </div>
              }
            >
              <div className={`${contentSpan} space-y-6`}>
                {data.experiences.map((exp) => (
                  <div key={exp.id} className="space-y-1.5 p-2 -m-2 rounded-xl transition duration-300 hover:bg-neutral-50/70 hover:translate-x-0.5">
                    <div className="flex flex-col sm:flex-row justify-between items-baseline gap-1">
                      <span className="font-bold text-neutral-900 text-xs">{exp.role}</span>
                      <span className="text-[10px] text-neutral-500 font-semibold">{exp.startDate} – {exp.endDate}</span>
                    </div>
                    <div className="text-[11px] text-neutral-500 font-bold">{exp.company}</div>
                    
                    {exp.description && (
                      <SafeHTML 
                        htmlContent={exp.description} 
                        className="text-neutral-700 font-normal mt-1 leading-relaxed text-justify"
                      />
                    )}
                    
                    {exp.bulletPoints && exp.bulletPoints.length > 0 && (
                      <ul className="list-inside list-disc pl-1 space-y-1 text-neutral-700 font-normal mt-1.5">
                        {exp.bulletPoints.map((bp, i) => bp.trim() ? (
                          <li key={i} className="leading-relaxed">{bp}</li>
                        ) : null)}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Education Row */}
          {data.educations && data.educations.length > 0 && (
            <CollapsibleSection
              sectionKey="education"
              isRow={true}
              rowClass="grid grid-cols-1 md:grid-cols-12 gap-4"
              contentSpan={contentSpan}
              headerElement={
                <div 
                  className={`${titleSpan} text-[10px] font-bold uppercase tracking-widest pt-0.5`}
                  style={{ color: primaryColor, fontFamily: "'Space Grotesk', 'Outfit', sans-serif" }}
                >
                  Education
                </div>
              }
            >
              <div className={`${contentSpan} space-y-3.5`}>
                {data.educations.map((edu) => (
                  <div key={edu.id} className="flex justify-between items-baseline gap-2 p-2 -m-2 rounded-xl transition duration-300 hover:bg-neutral-50/70 hover:translate-x-0.5">
                    <div>
                      <span className="font-bold text-neutral-905">{edu.degree}</span>
                      <span className="text-neutral-500 text-[11px] font-semibold">, {edu.institution}</span>
                    </div>
                    <span className="text-[10px] text-neutral-500 font-semibold whitespace-nowrap">
                      {edu.graduationYear ? `Class of ${edu.graduationYear}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Skills Row */}
          <CollapsibleSection
            sectionKey="skills"
            isRow={true}
            rowClass="grid grid-cols-1 md:grid-cols-12 gap-4"
            contentSpan={contentSpan}
            headerElement={
              <div 
                className={`${titleSpan} text-[10px] font-bold uppercase tracking-widest pt-0.5`}
                style={{ color: primaryColor, fontFamily: "'Space Grotesk', 'Outfit', sans-serif" }}
              >
                Expertise
              </div>
            }
          >
            <div className={`${contentSpan} space-y-3 pt-0.5`}>
              {data.skillDisplayMode === 'proficiency' && data.skillsWithLevels && data.skillsWithLevels.length > 0 ? (
                <div className="max-w-md">
                  <SkillsRenderer data={data} primaryColor={primaryColor} isLightBg={true} />
                </div>
              ) : (
                parseSkills(data.skills).map((group, groupIdx) => (
                  <div key={groupIdx} className="space-y-1.5">
                    {group.category && (
                      <div className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">
                        {group.category}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {group.items.map((sk, idx) => (
                        <span 
                          key={idx} 
                          className="px-2.5 py-0.5 rounded-full text-[10px] text-neutral-800 transition duration-150 font-semibold"
                          style={{
                            backgroundColor: primaryColor.startsWith('#') && primaryColor.length === 7 ? `${primaryColor}0f` : 'rgba(38, 38, 38, 0.08)',
                            color: primaryColor.startsWith('#') && primaryColor.length === 7 ? primaryColor : undefined
                          }}
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CollapsibleSection>

          {/* Credentials Row */}
          {data.certifications && data.certifications.length > 0 && (
            <CollapsibleSection
              sectionKey="certifications"
              isRow={true}
              rowClass="grid grid-cols-1 md:grid-cols-12 gap-4"
              contentSpan={contentSpan}
              headerElement={
                <div 
                  className={`${titleSpan} text-[10px] font-bold uppercase tracking-widest pt-0.5`}
                  style={{ color: primaryColor, fontFamily: "'Space Grotesk', 'Outfit', sans-serif" }}
                >
                  Credentials
                </div>
              }
            >
              <div className={`${contentSpan} space-y-2.5 pt-0.5 font-normal text-neutral-750`}>
                {data.certifications.map((cert) => (
                  <div key={cert.id} className="text-neutral-800 p-2 -m-2 rounded-xl transition duration-300 hover:bg-neutral-50/70 hover:translate-x-0.5">
                    <span className="font-bold text-neutral-900">{cert.name}</span>
                    {cert.issuer && <span className="text-neutral-500 font-semibold text-[11px]"> • {cert.issuer}</span>}
                    {cert.date && <span className="text-neutral-400 text-[10px]"> ({cert.date})</span>}
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Projects Row */}
          {data.projects && data.projects.length > 0 && (
            <CollapsibleSection
              sectionKey="projects"
              isRow={true}
              rowClass="grid grid-cols-1 md:grid-cols-12 gap-4"
              contentSpan={contentSpan}
              headerElement={
                <div 
                  className={`${titleSpan} text-[10px] font-bold uppercase tracking-widest pt-0.5`}
                  style={{ color: primaryColor, fontFamily: "'Space Grotesk', 'Outfit', sans-serif" }}
                >
                  Projects
                </div>
              }
            >
              <div className={`${contentSpan} space-y-4 pt-0.5 text-neutral-800`}>
                {data.projects.map((proj) => (
                  <div key={proj.id} className="space-y-1 font-normal p-2.5 -m-2.5 rounded-xl transition duration-300 hover:bg-neutral-50/70 hover:translate-x-0.5">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1">
                      <span className="font-bold text-neutral-900 text-xs">{proj.name}</span>
                      {proj.url && (
                        <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-semibold text-neutral-500 hover:text-neutral-950 underline flex items-center gap-1">
                          <Globe className="w-3 h-3" /> Project Link
                        </a>
                      )}
                    </div>
                    {proj.technologies && (
                      <div className="text-[10.5px] text-neutral-500 font-semibold">
                        Technologies: {proj.technologies}
                      </div>
                    )}
                    {proj.description && (
                      <SafeHTML 
                        htmlContent={proj.description} 
                        className="text-xs leading-relaxed text-neutral-700 text-justify mt-1.5"
                      />
                    )}
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Achievements Row */}
          {data.achievements && data.achievements.length > 0 && (
            <CollapsibleSection
              sectionKey="achievements"
              isRow={true}
              rowClass="grid grid-cols-1 md:grid-cols-12 gap-4"
              contentSpan={contentSpan}
              headerElement={
                <div 
                  className={`${titleSpan} text-[10px] font-bold uppercase tracking-widest pt-0.5`}
                  style={{ color: primaryColor, fontFamily: "'Space Grotesk', 'Outfit', sans-serif" }}
                >
                  Achievements
                </div>
              }
            >
              <div className={`${contentSpan} space-y-3 pt-0.5 text-neutral-800 font-normal`}>
                {data.achievements.map((ach) => (
                  <div key={ach.id} className="space-y-1.5 p-2 -m-2 rounded-xl transition duration-300 hover:bg-neutral-50/70 hover:translate-x-0.5">
                    <div className="font-bold text-neutral-900 text-xs">{ach.title}</div>
                    <p className="text-xs text-neutral-700 leading-relaxed text-justify">{ach.description}</p>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Referees Row */}
          {data.referees && data.referees.length > 0 && (
            <CollapsibleSection
              sectionKey="referees"
              isRow={true}
              rowClass="grid grid-cols-1 md:grid-cols-12 gap-4"
              contentSpan={contentSpan}
              headerElement={
                <div 
                  className={`${titleSpan} text-[10px] font-bold uppercase tracking-widest pt-0.5`}
                  style={{ color: primaryColor, fontFamily: "'Space Grotesk', 'Outfit', sans-serif" }}
                >
                  References
                </div>
              }
            >
              <div className={`${contentSpan} grid grid-cols-1 sm:grid-cols-2 gap-4 pt-0.5 font-normal text-neutral-700`}>
                {data.referees.map((ref) => (
                   <div key={ref.id} className="text-neutral-800 space-y-1 p-2.5 -m-2.5 rounded-xl transition duration-300 hover:bg-neutral-50/70 hover:translate-x-0.5">
                    <div className="font-extrabold text-neutral-900">{ref.name}</div>
                    {(ref.relationship || ref.company) && (
                      <div className="text-neutral-500 font-semibold text-[10px]">
                        {ref.relationship}{ref.relationship && ref.company ? ' – ' : ''}{ref.company}
                      </div>
                    )}
                    <div className="text-[11px] text-neutral-600 space-y-1 font-sans mt-1">
                      {ref.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                          <span>{ref.phone}</span>
                        </div>
                      )}
                      {ref.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                          <span className="break-all">{ref.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}
        </div>
      </div>
    </div>
  );
};

export const ExecutiveTemplate: React.FC<TemplateProps> = ({ data, accentColor, fontFamily }) => {
  const primaryColor = accentColor || '#1e293b';
  const profilePic = data.personalInfo.profilePicture;

  return (
    <div 
      className="w-full bg-white text-[#1e293b] leading-relaxed shadow-sm rounded-lg overflow-hidden border border-slate-100 select-none"
      style={{ fontFamily: fontFamily || "'Cormorant Garamond', serif" }}
    >
      <div className="p-8 md:p-11 space-y-8">
        {/* Prestige Styled Leader Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-[#e2e8f0]">
          <div className="border-l-4 pl-4" style={{ borderColor: primaryColor }}>
            <h1 
              className="text-4xl md:text-5xl font-extrabold uppercase tracking-wide leading-none"
              style={{ color: primaryColor }}
            >
              {data.personalInfo.fullName}
            </h1>
            <p className="text-xs font-bold tracking-widest text-slate-500 uppercase mt-2.5 font-sans">{data.personalInfo.jobTitle}</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-xs text-slate-600 space-y-1 font-sans leading-[1.3] text-left sm:text-right">
              {data.personalInfo.email && (
                <div className="flex items-center gap-1.5 sm:justify-end">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> <span>{data.personalInfo.email}</span>
                </div>
              )}
              {data.personalInfo.phone && (
                <div className="flex items-center gap-1.5 sm:justify-end">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> <span>{data.personalInfo.phone}</span>
                </div>
              )}
              {data.personalInfo.location && (
                <div className="flex items-center gap-1.5 sm:justify-end">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> <span>{data.personalInfo.location}</span>
                </div>
              )}
              {data.personalInfo.linkedin && (
                <div className="flex items-center gap-1.5 sm:justify-end break-all">
                  <Linkedin className="w-3.5 h-3.5 text-slate-400" /> <span>{data.personalInfo.linkedin}</span>
                </div>
              )}
            </div>
            
            {profilePic && (
              <img 
                src={profilePic} 
                alt="Profile photo" 
                className="w-16 h-16 rounded-full object-cover border-2 shadow-inner ring-2 ring-slate-100" 
                style={{ borderColor: primaryColor }}
              />
            )}
          </div>
        </div>

        {/* Executive Summary in transparent tint italic frame */}
        {data.summary && (
          <div 
            className="py-5 px-6 border-y" 
            style={{ 
              backgroundColor: primaryColor.startsWith('#') && primaryColor.length === 7 ? `${primaryColor}05` : 'rgba(30, 41, 59, 0.02)',
              borderColor: primaryColor.startsWith('#') && primaryColor.length === 7 ? `${primaryColor}1a` : 'rgba(30, 41, 59, 0.1)'
            }}
          >
            <h2 className="text-[10px] font-black uppercase tracking-widest mb-2 font-sans" style={{ color: primaryColor }}>
              Executive narrative
            </h2>
            <SafeHTML 
              htmlContent={data.summary} 
              className="italic text-slate-800 leading-relaxed md:leading-loose text-[12.5px] md:text-[14px] text-justify font-serif"
            />
          </div>
        )}

        {/* Experience Timeline */}
        {data.experiences && data.experiences.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest border-b border-slate-200 pb-1" style={{ color: primaryColor }}>
              Leadership Experience
            </h2>
            <div className="space-y-6">
              {data.experiences.map((exp) => (
                <div key={exp.id} className="space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1 text-[#0f172a]">
                    <span className="text-[15px] font-bold text-slate-900">{exp.role}</span>
                    <span className="text-xs font-sans italic text-slate-500 whitespace-nowrap">{exp.startDate} – {exp.endDate}</span>
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#475569] font-sans">{exp.company}</div>
                  
                  {exp.description && (
                    <SafeHTML 
                      htmlContent={exp.description} 
                      className="text-xs md:text-[13.5px] leading-relaxed md:leading-loose text-slate-850 text-justify font-serif"
                    />
                  )}
                  
                  {exp.bulletPoints && exp.bulletPoints.length > 0 && (
                    <ul className="list-disc pl-5 space-y-1.5 text-xs md:text-[12.5px] text-slate-800 font-serif mt-1">
                      {exp.bulletPoints.map((bp, i) => bp.trim() ? (
                        <li key={i} className="leading-relaxed">{bp}</li>
                      ) : null)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education Record */}
        {data.educations && data.educations.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest border-b border-slate-200 pb-1" style={{ color: primaryColor }}>
              Academic Accomplishments
            </h2>
            <div className="space-y-3.5">
              {data.educations.map((edu) => (
                <div key={edu.id} className="flex justify-between items-baseline text-xs">
                  <div>
                    <span className="font-bold text-slate-900 text-[13px]">{edu.degree}</span>
                    <span className="text-slate-650 font-semibold font-serif">, {edu.institution}</span>
                  </div>
                  <span className="text-slate-500 font-sans font-bold whitespace-nowrap text-[11px]">
                    {edu.graduationYear ? `Class of ${edu.graduationYear}` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Executive Competencies */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest border-b border-slate-200 pb-1" style={{ color: primaryColor }}>
            Signature Competencies
          </h2>
          <div className="space-y-4 pt-1">
            {data.skillDisplayMode === 'proficiency' && data.skillsWithLevels && data.skillsWithLevels.length > 0 ? (
              <div className="max-w-md">
                <SkillsRenderer data={data} primaryColor={primaryColor} isLightBg={true} />
              </div>
            ) : (
              parseSkills(data.skills).map((group, groupIdx) => (
                <div key={groupIdx} className="space-y-1.5">
                  {group.category && (
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#475569] font-sans">
                      {group.category}
                    </h4>
                  )}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-slate-700">
                    {group.items.map((sk, idx) => (
                      <React.Fragment key={idx}>
                        {idx > 0 && (
                          <span className="text-slate-300 font-normal text-xs" style={{ color: primaryColor.startsWith('#') && primaryColor.length === 7 ? `${primaryColor}40` : undefined }}>·</span>
                        )}
                        <span className="text-[11.5px] md:text-[12px] tracking-wide font-medium text-slate-850 font-serif">
                          {sk}
                        </span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Qualifications / Certifications */}
        {data.certifications && data.certifications.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest border-b border-slate-200 pb-1" style={{ color: primaryColor }}>
              Professional Credentials
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {data.certifications.map((cert) => (
                <div key={cert.id} className="text-xs flex items-center gap-2 border border-slate-100 p-2.5 rounded-lg bg-slate-50/30">
                  <Award className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-slate-900 font-serif italic text-[12.5px]">{cert.name}</div>
                    {cert.issuer && <div className="text-slate-500 font-semibold font-sans text-[10px]">{cert.issuer} {cert.date ? `(${cert.date})` : ''}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects Section */}
        {data.projects && data.projects.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest border-b border-slate-200 pb-1" style={{ color: primaryColor }}>
              Select Projects
            </h2>
            <div className="space-y-4 pt-1">
              {data.projects.map((proj) => (
                <div key={proj.id} className="text-xs space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1">
                    <span className="font-bold text-slate-900 text-[13.5px] font-serif italic">{proj.name}</span>
                    {proj.url && (
                      <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold text-slate-500 hover:text-slate-850 underline flex items-center gap-1 font-sans">
                        <Globe className="w-3 h-3" /> Project Link
                      </a>
                    )}
                  </div>
                  {proj.technologies && (
                    <div className="text-[9.5px] text-slate-500 font-bold uppercase tracking-widest font-sans">
                      Tech Core: {proj.technologies}
                    </div>
                  )}
                  {proj.description && (
                    <SafeHTML 
                      htmlContent={proj.description} 
                      className="text-xs md:text-[13px] text-slate-800 leading-relaxed md:leading-loose text-justify italic font-serif"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Achievements Section */}
        {data.achievements && data.achievements.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest border-b border-slate-200 pb-1" style={{ color: primaryColor }}>
              Key Accomplishments
            </h2>
            <div className="space-y-3 pt-1">
              {data.achievements.map((ach) => (
                <div key={ach.id} className="text-xs flex gap-3 items-start">
                  <Award className="w-4 h-4 flex-shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 font-serif italic text-[13px]">{ach.title}</span>
                    <p className="text-slate-800 font-serif leading-relaxed md:leading-loose mt-0.5">{ach.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Referees */}
        {data.referees && data.referees.length > 0 && (
          <div className="space-y-4 pt-4">
            <h2 className="text-xs font-bold uppercase tracking-widest border-b border-slate-200 pb-1" style={{ color: primaryColor }}>
              Professional References
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {data.referees.map((ref) => (
                <div key={ref.id} className="text-xs border border-slate-100 p-3 rounded-lg space-y-1 bg-slate-50/20">
                  <div className="font-bold text-slate-900 text-[13px]">{ref.name}</div>
                  {(ref.relationship || ref.company) && (
                    <div className="text-slate-500 font-semibold font-sans text-[9px] tracking-wide uppercase">
                      {ref.relationship}{ref.relationship && ref.company ? ' / ' : ''}{ref.company}
                    </div>
                  )}
                  <div className="text-[11px] text-slate-600 font-medium space-y-1 font-sans mt-0.5">
                    {ref.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span>{ref.phone}</span>
                      </div>
                    )}
                    {ref.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="break-all">{ref.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const CreativeTemplate: React.FC<TemplateProps> = ({ data, accentColor, fontFamily }) => {
  const profilePic = data.personalInfo.profilePicture;
  const primaryColor = accentColor || '#ec4899';
  
  // Staggered stagger entrance animation values
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: 'spring' as const, 
        stiffness: 120, 
        damping: 18 
      } 
    }
  };

  return (
    <motion.div 
      className="w-full bg-white text-[#1e293b] select-none rounded-xl overflow-hidden shadow-sm max-w-full"
      style={{ fontFamily: fontFamily || "'Inter', system-ui, sans-serif" }}
      initial="hidden"
      animate="show"
      variants={containerVariants}
    >
      {/* Side-by-Side Bento Grid Block */}
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[960px] print:block print:min-h-0">
        {/* Artistic Sidebar Panel */}
        <motion.div 
          className="md:col-span-5 text-white p-7 md:p-8 flex flex-col justify-between space-y-8 print:!bg-slate-50 print:!text-slate-900 print:!bg-none print:border-r print:border-slate-200 print:shadow-none print:p-6"
          style={{ 
            background: `linear-gradient(135deg, ${primaryColor}f2, ${primaryColor})`, 
            backgroundColor: primaryColor,
          }}
          variants={itemVariants}
        >
          <div className="space-y-6">
            {profilePic && (
              <div className="flex justify-center mb-6">
                <img 
                  src={profilePic} 
                  alt={data.personalInfo.fullName} 
                  className="w-32 h-32 rounded-2xl object-cover border-4 border-white/20 shadow-md transform hover:rotate-1 hover:scale-105 transition duration-300 print:!border-slate-300 print:shadow-none" 
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            <div className="space-y-2">
              <h1 
                className="text-3xl font-black uppercase tracking-tight leading-none print:!text-slate-900"
                style={{ fontFamily: "'Space Grotesk', 'Outfit', sans-serif" }}
              >
                {data.personalInfo.fullName}
              </h1>
              <div className="text-[10px] font-bold tracking-widest uppercase bg-white/20 px-3 py-1.5 rounded-lg w-fit whitespace-nowrap print:!bg-slate-150 print:!text-slate-800">
                {data.personalInfo.jobTitle}
              </div>
            </div>

            {/* Connection Block */}
            <div className="space-y-3 pt-6 border-t border-white/20 print:border-slate-200">
              <h3 
                className="text-[10px] font-black uppercase tracking-widest text-white/70 print:!text-slate-500"
                style={{ fontFamily: "'Space Grotesk', 'Outfit', sans-serif" }}
              >
                Connect
              </h3>
              <ul className="space-y-3 text-xs text-white/95 font-sans">
                {data.personalInfo.email && (
                  <li className="flex items-center gap-2.5">
                    <span className="bg-white/10 p-1.5 rounded-lg flex items-center justify-center flex-shrink-0 print:!bg-slate-150 print:!border print:!border-slate-200">
                      <Mail className="w-3.5 h-3.5 text-white print:!text-slate-600" />
                    </span> 
                    <span className="break-all font-medium print:!text-slate-800">{data.personalInfo.email}</span>
                  </li>
                )}
                {data.personalInfo.phone && (
                  <li className="flex items-center gap-2.5">
                    <span className="bg-white/10 p-1.5 rounded-lg flex items-center justify-center flex-shrink-0 print:!bg-slate-150 print:!border print:!border-slate-200">
                      <Phone className="w-3.5 h-3.5 text-white print:!text-slate-600" />
                    </span> 
                    <span className="font-medium print:!text-slate-800">{data.personalInfo.phone}</span>
                  </li>
                )}
                {data.personalInfo.location && (
                  <li className="flex items-center gap-2.5">
                    <span className="bg-white/10 p-1.5 rounded-lg flex items-center justify-center flex-shrink-0 print:!bg-slate-150 print:!border print:!border-slate-200">
                      <MapPin className="w-3.5 h-3.5 text-white print:!text-slate-600" />
                    </span> 
                    <span className="font-medium print:!text-slate-800">{data.personalInfo.location}</span>
                  </li>
                )}
                {data.personalInfo.linkedin && (
                  <li className="flex items-center gap-2.5">
                    <span className="bg-white/10 p-1.5 rounded-lg flex items-center justify-center flex-shrink-0 print:!bg-slate-150 print:!border print:!border-slate-200">
                      <Linkedin className="w-3.5 h-3.5 text-white print:!text-slate-600" />
                    </span> 
                    <span className="break-all font-medium print:!text-slate-800">{data.personalInfo.linkedin}</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Skills chip list */}
            <div className="space-y-3.5 pt-6 border-t border-white/20 print:border-slate-200">
              <h3 
                className="text-[10px] font-black uppercase tracking-widest text-white/70 print:!text-slate-500"
                style={{ fontFamily: "'Space Grotesk', 'Outfit', sans-serif" }}
              >
                Signature Skills
              </h3>
              <div className="space-y-3.5">
                {data.skillDisplayMode === 'proficiency' && data.skillsWithLevels && data.skillsWithLevels.length > 0 ? (
                  <SkillsRenderer data={data} primaryColor="rgb(255, 255, 255)" isLightBg={false} />
                ) : (
                  parseSkills(data.skills).map((group, groupIdx) => (
                    <div key={groupIdx} className="space-y-1">
                      {group.category && (
                        <div className="text-[9px] font-bold uppercase tracking-wider text-white/60 print:!text-slate-400">
                          {group.category}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        {group.items.map((sk, idx) => (
                          <span 
                            key={idx} 
                            className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 bg-white/15 hover:bg-white/25 rounded-md transition-colors whitespace-nowrap print:!bg-slate-150 print:!text-slate-850 print:!border print:!border-slate-200"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="text-[9px] text-white/45 uppercase tracking-widest font-black pt-6 print:!text-slate-400">
            Creative Series Pro
          </div>
        </motion.div>

        {/* Right Fluid Panels in a dynamic bento-grid packed masonry */}
        <div className="md:col-span-7 p-6 md:p-8 bg-slate-50 print:bg-white print:p-0">
          <div className="columns-1 sm:columns-2 gap-6 [column-fill:balance] print:block print:columns-1">
            {/* Narrative summary card */}
            {data.summary && (
              <motion.div 
                className="break-inside-avoid inline-block w-full mb-6 bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs print:border-slate-200 print:shadow-none print:p-4"
                variants={itemVariants}
              >
                <h2 
                  className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] mb-2 print:text-slate-400"
                  style={{ fontFamily: "'Space Grotesk', 'Outfit', sans-serif" }}
                >
                  Narrative Pitch
                </h2>
                <SafeHTML 
                  htmlContent={data.summary} 
                  className="text-xs md:text-[12.5px] leading-relaxed text-[#475569] text-justify font-normal"
                />
              </motion.div>
            )}

            {/* Work Milestones */}
            {data.experiences && data.experiences.length > 0 && (
              <motion.div 
                className="break-inside-avoid inline-block w-full mb-6 bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs print:border-slate-200 print:shadow-none print:p-4"
                variants={itemVariants}
              >
                <h2 
                  className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] mb-4 print:text-slate-400"
                  style={{ fontFamily: "'Space Grotesk', 'Outfit', sans-serif" }}
                >
                  Milestones & Career Route
                </h2>
                <div className="space-y-5">
                  {data.experiences.map((exp) => (
                    <div key={exp.id} className="space-y-1.5 relative pl-4 border-l-2" style={{ borderColor: `${primaryColor}25` }}>
                      {/* Circle visual center */}
                      <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border border-white print:border-slate-200" style={{ backgroundColor: primaryColor }} />
                      
                      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-1">
                        <div>
                          <h4 className="font-extrabold text-xs text-[#0f172a]">{exp.role}</h4>
                          <div className="text-[10px] text-[#64748b] font-extrabold">{exp.company}</div>
                        </div>
                        <span 
                          className="text-[9px] font-extrabold px-2 py-0.5 rounded-md h-fit whitespace-nowrap self-start" 
                          style={{ backgroundColor: `${primaryColor}12`, color: primaryColor }}
                        >
                          {exp.startDate} – {exp.endDate}
                        </span>
                      </div>
                      
                      {exp.description && (
                        <SafeHTML 
                          htmlContent={exp.description} 
                          className="text-xs leading-relaxed text-[#475569] text-justify"
                        />
                      )}
                      
                      {exp.bulletPoints && exp.bulletPoints.length > 0 && (
                        <ul className="list-disc pl-4 space-y-1 text-xs text-[#475569]">
                          {exp.bulletPoints.map((bp, i) => bp.trim() ? (
                            <li key={i} className="leading-relaxed">{bp}</li>
                          ) : null)}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Educational Achievements */}
            {data.educations && data.educations.length > 0 && (
              <motion.div 
                className="break-inside-avoid inline-block w-full mb-6 bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs print:border-slate-200 print:shadow-none print:p-4"
                variants={itemVariants}
              >
                <h2 
                  className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] mb-3 print:text-slate-400"
                  style={{ fontFamily: "'Space Grotesk', 'Outfit', sans-serif" }}
                >
                  Education Journey
                </h2>
                <div className="space-y-3">
                  {data.educations.map((edu) => (
                    <div key={edu.id} className="flex justify-between items-center text-xs">
                      <div>
                        <h4 className="font-extrabold text-[#0f172a]">{edu.degree}</h4>
                        <span className="text-[#64748b] text-[10px] font-extrabold">{edu.institution}</span>
                      </div>
                      <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-[#64748b] whitespace-nowrap">
                        {edu.graduationYear ? `Class of ${edu.graduationYear}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Accreditations */}
            {data.certifications && data.certifications.length > 0 && (
              <motion.div 
                className="break-inside-avoid inline-block w-full mb-6 bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs print:border-slate-200 print:shadow-none print:p-4"
                variants={itemVariants}
              >
                <h2 
                  className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] mb-2 print:text-slate-400"
                  style={{ fontFamily: "'Space Grotesk', 'Outfit', sans-serif" }}
                >
                  Accreditations
                </h2>
                <div className="grid grid-cols-1 gap-2">
                  {data.certifications.map((cert) => (
                    <div key={cert.id} className="text-xs flex flex-col gap-0.5 bg-slate-50 border border-slate-100 p-2.5 rounded-lg hover:shadow-3xs transition duration-150 print:bg-white print:border-slate-200">
                      <span className="font-extrabold text-[#0f172a]">{cert.name}</span>
                      <span className="text-[10px] text-slate-400 font-extrabold">{cert.issuer} {cert.date ? `(${cert.date})` : ''}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Featured Projects */}
            {data.projects && data.projects.length > 0 && (
              <motion.div 
                className="break-inside-avoid inline-block w-full mb-6 bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs print:border-slate-200 print:shadow-none print:p-4"
                variants={itemVariants}
              >
                <h2 
                  className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] mb-3 print:text-slate-400"
                  style={{ fontFamily: "'Space Grotesk', 'Outfit', sans-serif" }}
                >
                  Featured Projects
                </h2>
                <div className="space-y-4">
                  {data.projects.map((proj) => (
                    <div key={proj.id} className="text-xs space-y-2 pb-3 last:pb-0 border-b border-slate-50 last:border-0 print:border-slate-100">
                      <div className="flex justify-between items-baseline gap-1">
                        <h4 className="font-extrabold text-[#0f172a]">{proj.name}</h4>
                        {proj.url && (
                          <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-slate-500 hover:text-slate-950 underline flex items-center gap-1 print:hidden">
                            <Globe className="w-3.5 h-3.5" /> Link
                          </a>
                        )}
                      </div>
                      {proj.technologies && (
                        <div className="flex flex-wrap gap-1">
                          {proj.technologies.split(',').map((tech) => tech.trim()).filter(Boolean).map((tech, i) => (
                            <span key={i} className="text-[9px] font-bold uppercase tracking-wider bg-slate-50 border border-slate-150 text-slate-600 px-2 py-0.5 rounded-md print:bg-white print:border-slate-200">
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                      {proj.description && (
                        <SafeHTML 
                          htmlContent={proj.description} 
                          className="text-xs text-slate-600 leading-relaxed text-justify mt-1"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Achievements */}
            {data.achievements && data.achievements.length > 0 && (
              <motion.div 
                className="break-inside-avoid inline-block w-full mb-6 bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs print:border-slate-200 print:shadow-none print:p-4"
                variants={itemVariants}
              >
                <h2 
                  className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] mb-2 print:text-slate-400"
                  style={{ fontFamily: "'Space Grotesk', 'Outfit', sans-serif" }}
                >
                  Milestones & Achievements
                </h2>
                <div className="grid grid-cols-1 gap-2">
                  {data.achievements.map((ach) => (
                    <div key={ach.id} className="text-xs bg-slate-50 border border-slate-100 p-3 rounded-lg hover:shadow-3xs transition duration-150 flex gap-2 print:bg-white print:border-slate-200">
                      <Award className="w-4 h-4 flex-shrink-0 text-amber-500 mt-0.5" />
                      <div>
                        <span className="font-extrabold text-[#0f172a]">{ach.title}</span>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{ach.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Referees */}
            {data.referees && data.referees.length > 0 && (
              <motion.div 
                className="break-inside-avoid inline-block w-full mb-6 bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs print:border-slate-200 print:shadow-none print:p-4"
                variants={itemVariants}
              >
                <h2 
                  className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] mb-2 print:text-slate-400"
                  style={{ fontFamily: "'Space Grotesk', 'Outfit', sans-serif" }}
                >
                  Professional Referees
                </h2>
                <div className="grid grid-cols-1 gap-2">
                  {data.referees.map((ref) => (
                    <div key={ref.id} className="text-xs bg-slate-50 border border-slate-100 p-3 rounded-lg hover:shadow-3xs transition duration-150 space-y-1 print:bg-white print:border-slate-200">
                      <div className="font-extrabold text-[#0f172a]">{ref.name}</div>
                      {(ref.relationship || ref.company) && (
                        <div className="text-[9px] font-extrabold uppercase" style={{ color: primaryColor }}>
                          {ref.relationship}{ref.relationship && ref.company ? ' at ' : ''}{ref.company}
                        </div>
                      )}
                      <div className="text-[11px] text-slate-500 font-medium space-y-1 mt-1 font-sans">
                        {ref.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span>{ref.phone}</span>
                          </div>
                        )}
                        {ref.email && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span className="break-all">{ref.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const ProfessionalTemplate: React.FC<TemplateProps> = ({ data, accentColor, fontFamily }) => {
  const [isSingleColumn, setIsSingleColumn] = React.useState(false);
  const profilePic = data.personalInfo.profilePicture;
  
  // Teal default accent color matching user specifications
  const themeAccent = accentColor || '#15C3D4';

  const groupedSkills = parseSkills(data.skills);

  return (
    <div 
      className="w-full bg-white dark:bg-[#11161D] text-slate-700 dark:text-[#EDF2F7] rounded-lg select-none shadow-sm max-w-full overflow-hidden transition-colors"
      style={{ fontFamily: fontFamily || "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      <style>{`
        @media print {
          .print-hidden {
            display: none !important;
          }
          body, .professional-container {
            background: white !important;
            color: #0A1929 !important;
          }
          .professional-container * {
            background-color: transparent !important;
            color: #0A1929 !important;
            border-color: #DCE3E9 !important;
          }
          .print-muted {
            color: #5A6874 !important;
          }
          .print-teal {
            color: #15C3D4 !important;
          }
          a {
            text-decoration: none !important;
            color: #0A1929 !important;
          }
        }
      `}</style>

      {/* Interactive controls - styled to blend elegantly and invisible on print */}
      <div className="print-hidden flex justify-between items-center px-6 py-3 bg-slate-50 dark:bg-[#19222c] border-b border-slate-100 dark:border-[#2A3742] no-select">
        <span className="text-[11px] font-bold uppercase tracking-[0.5px] text-slate-500 dark:text-[#8A9BB0]">Layout Engine</span>
        <button 
          onClick={() => setIsSingleColumn(!isSingleColumn)}
          className="text-xs font-semibold px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[4px] hover:border-[#15C3D4] dark:hover:border-[#15C3D4] transition-all cursor-pointer text-[#0A1929] dark:text-[#EDF2F7]"
        >
          {isSingleColumn ? "Switch to Two-Column" : "Switch to Single-Column (ATS)"}
        </button>
      </div>

      <div className="p-8 md:p-10 space-y-8 professional-container">
        {/* Header Block */}
        <div className="border-b border-[#DCE3E9] dark:border-[#2A3742] pb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-[28px] font-bold tracking-[-0.5px] text-[#0A1929] dark:text-[#E6EDF5] leading-tight">
                {data.personalInfo.fullName}
              </h1>
              <p 
                className="text-[16px] font-medium tracking-[0.5px] mt-1 uppercase"
                style={{ color: themeAccent }}
              >
                {data.personalInfo.jobTitle}
              </p>
            </div>

            {profilePic && (
              <div className="flex-shrink-0">
                <img 
                  src={profilePic} 
                  alt={data.personalInfo.fullName} 
                  className="w-16 h-16 rounded-[2px] object-cover border-2"
                  style={{ borderColor: themeAccent }}
                />
              </div>
            )}
          </div>

          {/* Contact Line with pipes */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-[11px] font-medium mt-4 text-[#5A6874] dark:text-[#8A9BB0]">
            {data.personalInfo.email && (
              <span className="flex items-center gap-1.5">
                <span className="rounded-[2px] p-0.5 border border-[#15C3D4] bg-teal-500/5 dark:bg-teal-500/10">
                  <Mail className="w-3.5 h-3.5 text-[#15C3D4]" strokeWidth={1.5} />
                </span>
                <a href={`mailto:${data.personalInfo.email}`} className="hover:opacity-80 transition-opacity">{data.personalInfo.email}</a>
              </span>
            )}
            {data.personalInfo.email && data.personalInfo.phone && <span className="text-[#DCE3E9] dark:text-[#2A3742] hidden md:inline">|</span>}
            
            {data.personalInfo.phone && (
              <span className="flex items-center gap-1.5">
                <span className="rounded-[2px] p-0.5 border border-[#15C3D4] bg-teal-500/5 dark:bg-teal-500/10">
                  <Phone className="w-3.5 h-3.5 text-[#15C3D4]" strokeWidth={1.5} />
                </span>
                <a href={`tel:${data.personalInfo.phone}`} className="hover:opacity-80 transition-opacity">{data.personalInfo.phone}</a>
              </span>
            )}
            {data.personalInfo.phone && data.personalInfo.location && <span className="text-[#DCE3E9] dark:text-[#2A3742] hidden md:inline">|</span>}

            {data.personalInfo.location && (
              <span className="flex items-center gap-1.5">
                <span className="rounded-[2px] p-0.5 border border-[#15C3D4] bg-teal-500/5 dark:bg-teal-500/10">
                  <MapPin className="w-3.5 h-3.5 text-[#15C3D4]" strokeWidth={1.5} />
                </span>
                <span>{data.personalInfo.location}</span>
              </span>
            )}
            {data.personalInfo.location && data.personalInfo.linkedin && <span className="text-[#DCE3E9] dark:text-[#2A3742] hidden md:inline">|</span>}

            {data.personalInfo.linkedin && (
              <span className="flex items-center gap-1.5">
                <span className="rounded-[2px] p-0.5 border border-[#15C3D4] bg-teal-500/5 dark:bg-teal-500/10">
                  <Linkedin className="w-3.5 h-3.5 text-[#15C3D4]" strokeWidth={1.5} />
                </span>
                <span className="break-all">{data.personalInfo.linkedin}</span>
              </span>
            )}
          </div>
        </div>

        {/* Dynamic Column Grid */}
        <div className={`grid grid-cols-1 ${isSingleColumn ? 'grid-cols-1 gap-y-8' : 'md:grid-cols-12 md:gap-x-8 gap-y-8'}`}>
          
          {/* Left Column (Skills, Education, Ref, Certs) */}
          <div className={`${isSingleColumn ? 'space-y-8' : 'md:col-span-4 space-y-8'}`}>
            {/* Skills */}
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-[16px] font-bold text-[#0A1929] dark:text-[#E6EDF5] uppercase tracking-[0.5px]">Skills</h3>
                <div className="h-[2px] w-10" style={{ backgroundColor: themeAccent }} />
              </div>

              <div className="space-y-4">
                {data.skillDisplayMode === 'proficiency' && data.skillsWithLevels && data.skillsWithLevels.length > 0 ? (
                  <SkillsRenderer data={data} primaryColor={themeAccent} isLightBg={true} />
                ) : (
                  groupedSkills.map((group, groupIdx) => (
                    <div key={groupIdx} className="space-y-2">
                      {group.category && (
                        <h4 className="text-[11px] font-semibold text-[#0A1929] dark:text-[#E6EDF5] uppercase tracking-wider">
                          {group.category}
                        </h4>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        {group.items.map((sk, skIdx) => (
                          <span 
                            key={skIdx} 
                            className="text-[10px] font-semibold px-2.5 py-1 rounded-[2px] border transition duration-150"
                            style={{ 
                              borderColor: `${themeAccent}30`,
                              backgroundColor: `${themeAccent}08`, 
                              color: themeAccent 
                            }}
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Academic Journey */}
            {data.educations && data.educations.length > 0 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-[16px] font-bold text-[#0A1929] dark:text-[#E6EDF5] uppercase tracking-[0.5px]">Education</h3>
                  <div className="h-[2px] w-10" style={{ backgroundColor: themeAccent }} />
                </div>

                <div className="space-y-4">
                  {data.educations.map((edu) => (
                    <div key={edu.id} className="space-y-1">
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-[11.5px] font-bold text-[#0A1929] dark:text-[#E6EDF5]">
                          {edu.degree}
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-[#5A6874] dark:text-[#8A9BB0]">
                        {edu.institution}
                      </p>
                      {edu.graduationYear && (
                        <p className="text-[10.5px] font-medium text-slate-400 dark:text-slate-500">
                          Class of {edu.graduationYear}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications & Accreditations (if available) */}
            {data.certifications && data.certifications.length > 0 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-[16px] font-bold text-[#0A1929] dark:text-[#E6EDF5] uppercase tracking-[0.5px]">Credentials</h3>
                  <div className="h-[2px] w-10" style={{ backgroundColor: themeAccent }} />
                </div>

                <div className="space-y-3">
                  {data.certifications.map((cert) => (
                    <div key={cert.id} className="text-[11px]">
                      <div className="font-bold text-[#0A1929] dark:text-[#E6EDF5] flex items-center gap-1">
                        <Award className="w-3 h-3 text-[#15C3D4] flex-shrink-0" />
                        <span>{cert.name}</span>
                      </div>
                      <div className="text-[10px] text-[#5A6874] dark:text-[#8A9BB0] pl-4 mt-0.5">
                        {cert.issuer} {cert.date ? `• ${cert.date}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Referees */}
            {data.referees && data.referees.length > 0 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-[16px] font-bold text-[#0A1929] dark:text-[#E6EDF5] uppercase tracking-[0.5px]">References</h3>
                  <div className="h-[2px] w-10" style={{ backgroundColor: themeAccent }} />
                </div>

                <div className="space-y-4">
                  {data.referees.map((ref) => (
                    <div key={ref.id} className="text-[11px] space-y-1">
                      <div className="font-bold text-[#0A1929] dark:text-[#E6EDF5]">{ref.name}</div>
                      {(ref.relationship || ref.company) && (
                        <div className="text-[10px] font-semibold text-[#5A6874] dark:text-[#8A9BB0]">
                          {ref.relationship ? ref.relationship : ''}{ref.relationship && ref.company ? ' / ' : ''}{ref.company ? ref.company : ''}
                        </div>
                      )}
                      <div className="text-[10.5px] text-slate-500 dark:text-slate-400 space-y-0.5">
                        {ref.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-[#15C3D4]" strokeWidth={1.5} />
                            <a href={`tel:${ref.phone}`} className="hover:underline">{ref.phone}</a>
                          </div>
                        )}
                        {ref.email && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-[#15C3D4]" strokeWidth={1.5} />
                            <a href={`mailto:${ref.email}`} className="break-all hover:underline">{ref.email}</a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Subtly Dividing Timeline line if in two-column */}
          {!isSingleColumn && (
            <div className="hidden md:block w-[1px] bg-[#E2E8F0] dark:bg-[#2D3A48] self-stretch col-span-1 -mx-4 justify-self-center" />
          )}

          {/* Right Main Column (Profile, Experience, Projects) */}
          <div className={`${isSingleColumn ? 'space-y-8' : 'md:col-span-7 space-y-8'}`}>
            
            {/* Executive Profile Section */}
            {data.summary && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <h3 className="text-[16px] font-bold text-[#0A1929] dark:text-[#E6EDF5] uppercase tracking-[0.5px]">Profile</h3>
                  <div className="h-[2px] w-10" style={{ backgroundColor: themeAccent }} />
                </div>
                <div className="text-[11.5px] font-normal leading-[1.5] text-slate-700 dark:text-[#EDF2F7] text-justify">
                  <SafeHTML htmlContent={data.summary} />
                </div>
              </div>
            )}

            {/* Milestones & Professional History */}
            {data.experiences && data.experiences.length > 0 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-[16px] font-bold text-[#0A1929] dark:text-[#E6EDF5] uppercase tracking-[0.5px]">Work Experience</h3>
                  <div className="h-[2px] w-10" style={{ backgroundColor: themeAccent }} />
                </div>

                <div className="space-y-6">
                  {data.experiences.map((exp) => {
                    const bulletsExist = exp.bulletPoints && exp.bulletPoints.some(bp => bp.trim() !== '');
                    return (
                      <div key={exp.id} className="space-y-2">
                        <div className="flex justify-between items-baseline gap-2">
                          <div>
                            <h4 className="text-[13px] font-bold text-[#0A1929] dark:text-[#E6EDF5]">
                              {exp.role}
                            </h4>
                            <p className="text-[11.5px] font-semibold text-[#5A6874] dark:text-[#8A9BB0]">
                              {exp.company}
                            </p>
                          </div>
                          <span className="text-[10.5px] font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap">
                            {exp.startDate} – {exp.endDate}
                          </span>
                        </div>

                        {exp.description && (
                          <div className="text-[11.5px] text-slate-600 dark:text-slate-300 leading-relaxed text-justify">
                            <SafeHTML htmlContent={exp.description} />
                          </div>
                        )}

                        {bulletsExist && (
                          <ul className="space-y-2 text-[11.5px] text-slate-600 dark:text-slate-350 list-none pl-0 mt-2">
                            {(exp.bulletPoints || []).filter(bp => bp.trim()).map((bp, bpIdx) => (
                              <li key={bpIdx} className="relative pl-4 flex items-start">
                                <span className="absolute left-0 top-1.5 text-[8px]" style={{ color: themeAccent }}>▪</span>
                                <span>{bp}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Featured Projects */}
            {data.projects && data.projects.length > 0 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-[16px] font-bold text-[#0A1929] dark:text-[#E6EDF5] uppercase tracking-[0.5px]">Featured Projects</h3>
                  <div className="h-[2px] w-10" style={{ backgroundColor: themeAccent }} />
                </div>

                <div className="space-y-4">
                  {data.projects.map((proj) => (
                    <div key={proj.id} className="space-y-1.5">
                      <div className="flex justify-between items-baseline gap-2">
                        <h4 className="text-[12px] font-bold text-[#0A1929] dark:text-[#E6EDF5]">
                          {proj.name}
                        </h4>
                        {proj.url && (
                          <a 
                            href={proj.url} 
                            target="_blank" 
                            rel="referrer"
                            className="text-[10px] font-semibold hover:underline"
                            style={{ color: themeAccent }}
                          >
                            Link
                          </a>
                        )}
                      </div>

                      {proj.technologies && (
                        <div className="flex flex-wrap gap-1">
                          {proj.technologies.split(',').map((tech) => tech.trim()).filter(Boolean).map((tech, techIdx) => (
                            <span 
                              key={techIdx}
                              className="text-[8.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[2px] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}

                      {proj.description && (
                        <div className="text-[11.5px] text-slate-600 dark:text-slate-350 leading-relaxed text-justify">
                          <SafeHTML htmlContent={proj.description} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Achievements */}
            {data.achievements && data.achievements.length > 0 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-[16px] font-bold text-[#0A1929] dark:text-[#E6EDF5] uppercase tracking-[0.5px]">Key Achievements</h3>
                  <div className="h-[2px] w-10" style={{ backgroundColor: themeAccent }} />
                </div>

                <div className="space-y-4">
                  {data.achievements.map((ach) => (
                    <div key={ach.id} className="text-[11px] leading-relaxed flex gap-2">
                      <div className="text-[12px] leading-none" style={{ color: themeAccent }}>★</div>
                      <div>
                        <strong className="text-[#0A1929] dark:text-[#E6EDF5] text-[11.5px]">{ach.title}</strong>
                        <p className="text-slate-600 dark:text-slate-350 mt-0.5">{ach.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ResumeTemplateRenderer: React.FC<TemplateProps & { template: string }> = ({ template, data, accentColor, fontFamily }) => {
  const isFriendly = !!data?.pdfFriendly;
  const [collapsedSections, setCollapsedSections] = React.useState<Record<string, boolean>>({});

  const toggleSection = (sectionKey: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const renderActiveTemplate = () => {
    switch (template) {
      case 'modern':
        return <ModernTemplate data={data} accentColor={accentColor} fontFamily={fontFamily} />;
      case 'corporate':
        return <CorporateTemplate data={data} accentColor={accentColor} fontFamily={fontFamily} />;
      case 'minimal':
        return <MinimalTemplate data={data} accentColor={accentColor} fontFamily={fontFamily} />;
      case 'executive':
        return <ExecutiveTemplate data={data} accentColor={accentColor} fontFamily={fontFamily} />;
      case 'creative':
        return <CreativeTemplate data={data} accentColor={accentColor} fontFamily={fontFamily} />;
      case 'professional':
        return <ProfessionalTemplate data={data} accentColor={accentColor} fontFamily={fontFamily} />;
      default:
        return <ModernTemplate data={data} accentColor={accentColor} fontFamily={fontFamily} />;
    }
  };

  return (
    <CollapseContext.Provider value={{ collapsedSections, toggleSection }}>
      <div className={isFriendly ? "pdf-friendly h-full w-full" : "h-full w-full"}>
        {renderActiveTemplate()}
      </div>
    </CollapseContext.Provider>
  );
};
