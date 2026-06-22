import { ResumeData } from "../src/types";

function cleanHtmlContent(html: string): string {
  if (!html) return '';
  return html
    .replace(/&nbsp;/g, ' ')
    .replace(/\u00A0/g, ' ');
}

// Dynamic selection of template HTML structure
export function renderTemplateToHTML(
  template: 'modern' | 'corporate' | 'minimal' | 'executive' | 'creative' | string,
  data: ResumeData,
  accentColor: string,
  fontFamily: string
): string {
  const primaryColor = accentColor || '#4f46e5';
  const fontStyle = fontFamily ? `font-family: ${fontFamily}, sans-serif;` : "font-family: 'Inter', sans-serif;";
  const profilePic = data.personalInfo.profilePicture;

  // Helpers for SVG icons
  const mailIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4.5px; display: inline-block; opacity: 0.75;"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`;
  const phoneIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4.5px; display: inline-block; opacity: 0.75;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;
  const pinIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4.5px; display: inline-block; opacity: 0.75;"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
  const linkedinIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4.5px; display: inline-block; opacity: 0.75;"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>`;

  const parseSkills = (skillsRaw: string) => {
    if (!skillsRaw) return [];
    const lines = skillsRaw.split('\n').map(line => line.trim()).filter(Boolean);
    const parsed: { category?: string; items: string[] }[] = [];
    
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

  // Helpers for common structures
  const renderSkillsList = (skillsRaw: string, styleType: 'badges' | 'bullets' | 'comma' | 'outline') => {
    const groups = parseSkills(skillsRaw);
    if (groups.length === 0) return '';

    return groups.map(group => {
      const categoryHeader = group.category ? `
        <div style="font-size: 8.5px; font-weight: 900; text-transform: uppercase; color: #94a3b8; margin-top: 6px; margin-bottom: 4px; letter-spacing: 0.05em; width: 100%;">
          ${group.category}
        </div>
      ` : '';

      let itemsHtml = '';
      if (styleType === 'badges') {
        itemsHtml = group.items.map(sk => `
          <span style="
            display: inline-block;
            font-size: 10px;
            font-weight: 700;
            padding: 3px 8px;
            margin: 2px;
            border-radius: 6px;
            background-color: #ffffff;
            border: 1px solid #e2e8f0;
            border-left: 3px solid ${primaryColor};
            color: #334155;
          ">${sk}</span>
        `).join('');
      } else if (styleType === 'outline') {
        itemsHtml = group.items.map(sk => `
          <span style="
            display: inline-block;
            font-size: 10px;
            font-weight: 700;
            padding: 3px 8px;
            margin: 2px;
            border-radius: 4px;
            border: 1px solid #cbd5e1;
            background-color: #fafafa;
            color: #475569;
          ">${sk}</span>
        `).join('');
      } else if (styleType === 'bullets') {
        itemsHtml = group.items.map(sk => `
          <span style="
            display: inline-flex;
            align-items: center;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-right: 15px;
            margin-bottom: 6px;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 4px 8px;
            border-radius: 4px;
            color: #334155;
          ">
            <span style="color: ${primaryColor}; margin-right: 6px;">■</span>${sk}
          </span>
        `).join('');
      } else {
        itemsHtml = group.items.join('  •  ');
      }

      if (group.category) {
        if (styleType === 'comma') {
          return `
            <div style="font-size: 11px; color: #1e293b; margin-bottom: 6px; line-height: 1.5;">
              <strong style="color: #0f172a; text-transform: uppercase; font-size: 9.5px; letter-spacing: 0.05em;">${group.category}: </strong>
              <span>${group.items.join(', ')}</span>
            </div>
          `;
        } else {
          return `
            <div style="margin-bottom: 8px; width: 100%;">
              ${categoryHeader}
              <div style="line-height: 1.8;">${itemsHtml}</div>
            </div>
          `;
        }
      } else {
        return `
          <div style="margin-bottom: 8px; line-height: 1.8; width: 100%;">
            ${itemsHtml}
          </div>
        `;
      }
    }).join('');
  };

  const renderExperiences = (exper: any[], highlightTimeline: boolean) => {
    if (!exper || exper.length === 0) return '';
    return exper.map(exp => {
      const bulletLines = (exp.bulletPoints || []).map((bp: string) => bp.trim() ? `
        <li style="margin-bottom: 5px; line-height: 1.5;">${bp}</li>
      ` : '').join('');
      
      const timelineBorder = highlightTimeline ? `border-left: 2px solid ${primaryColor}20; padding-left: 15px; margin-left: 6px;` : '';
      
      return `
        <div style="margin-bottom: 20px; position: relative; ${timelineBorder}">
          ${highlightTimeline ? `
            <div style="
              position: absolute;
              left: -5px;
              top: 4px;
              width: 8px;
              height: 8px;
              border-radius: 50%;
              border: 2px solid #ffffff;
              background-color: ${primaryColor};
              box-shadow: 0 0 0 2px ${primaryColor}20;
            "></div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3px; gap: 10px;">
            <div>
              <h4 style="margin: 0; font-size: 13.5px; font-weight: 850; color: #0f172a;">${exp.role || 'Role'}</h4>
              <div style="font-size: 11px; font-weight: 700; color: #64748b; margin-top: 2px;">${exp.company || 'Company'}</div>
            </div>
            <span style="
              font-size: 9.5px; 
              font-weight: bold; 
              color: #475569; 
              background-color: #f8fafc; 
              border: 1px solid #e2e8f0;
              padding: 3px 8px;
              border-radius: 6px;
              white-space: nowrap;
            ">${exp.startDate} – ${exp.endDate}</span>
          </div>
          ${exp.description ? `<div style="margin: 6px 0 6px 0; font-size: 11.5px; line-height: 1.5; color: #475569; text-align: justify;">${cleanHtmlContent(exp.description)}</div>` : ''}
          ${bulletLines ? `<ul style="margin: 6px 0 0 0; padding-left: 18px; font-size: 11.5px; color: #475569; list-style-type: disc;">${bulletLines}</ul>` : ''}
        </div>
      `;
    }).join('');
  };

  const renderEducations = (edus: any[]) => {
    if (!edus || edus.length === 0) return '';
    return edus.map(edu => `
      <div style="
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 10px;
        margin-bottom: 10px;
        font-size: 11px;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="
            font-size: 9px;
            font-weight: bold;
            color: ${primaryColor};
            background-color: ${primaryColor}12;
            padding: 2px 6px;
            border-radius: 4px;
          ">${edu.graduationYear ? `Class of ${edu.graduationYear}` : 'Ongoing'}</span>
        </div>
        <div style="font-weight: 855; color: #0f172a; font-size: 11.5px; margin-top: 6px;">${edu.degree || 'Degree'}</div>
        <div style="color: #64748b; font-weight: 600; font-size: 10.5px; margin-top: 1px;">${edu.institution || 'Institution'}</div>
      </div>
    `).join('');
  };

  const renderCertifications = (certs: any[]) => {
    if (!certs || certs.length === 0) return '';
    return certs.map(cert => `
      <div style="
        padding: 6px 10px;
        background-color: #ffffff;
        border: 1px solid #f1f5f9;
        border-radius: 6px;
        margin-bottom: 6px;
        font-size: 10.5px;
      ">
        <strong style="color: #0f172a;">${cert.name}</strong>
        ${cert.issuer ? `<span style="color: #64748b; font-weight: 600;"> • ${cert.issuer}</span>` : ''}
        ${cert.date ? `<span style="color: #94a3b8; font-size: 9.5px;"> (${cert.date})</span>` : ''}
      </div>
    `).join('');
  };

  const renderReferees = (refs: any[]) => {
    if (!refs || refs.length === 0) return '';
    return refs.map(ref => `
      <div style="
        padding: 8px 10px;
        background-color: #ffffff;
        border: 1px solid #f1f5f9;
        border-radius: 6px;
        margin-bottom: 8px;
        font-size: 10.5px;
        text-align: left;
      ">
        <strong style="color: #0f172a; font-size: 11px;">${ref.name}</strong>
        ${ref.relationship || ref.company ? `
          <div style="color: #64748b; font-weight: 600; font-size: 9.5px; margin: 2px 0;">
            ${ref.relationship ? ref.relationship : ''}${ref.relationship && ref.company ? ' at ' : ''}${ref.company ? ref.company : ''}
          </div>
        ` : ''}
        <div style="color: #475569; font-size: 9.5px; margin-top: 2.5px; font-family: sans-serif;">
          ${ref.phone ? `<div>${phoneIcon}${ref.phone}</div>` : ''}
          ${ref.email ? `<div style="margin-top: 2.5px; word-break: break-all;">${mailIcon}${ref.email}</div>` : ''}
        </div>
      </div>
    `).join('');
  };

  // Switch statement on template layout types
  switch (template) {
    case 'modern':
      return `
        <div style="${fontStyle} color: #334155; line-height: 1.5; background: #ffffff; padding: 0px;">
          <!-- Header block -->
          <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
            <div>
              <h1 style="font-size: 28px; font-weight: 900; color: #0f172a; margin: 0; letter-spacing: -0.02em; line-height: 1.1;">${data.personalInfo.fullName}</h1>
              <div style="
                font-size: 11px; 
                font-weight: 800; 
                color: ${primaryColor}; 
                text-transform: uppercase; 
                letter-spacing: 0.1em; 
                margin-top: 6px;
                padding: 3px 8px;
                background-color: #f8fafc;
                border: 1px solid #e2e8f0;
                display: inline-block;
                border-radius: 4px;
              ">${data.personalInfo.jobTitle}</div>
            </div>
            ${profilePic ? `
              <div>
                <img src="${profilePic}" style="width: 75px; height: 75px; border-radius: 50%; object-fit: cover; border: 3px solid ${primaryColor};" />
              </div>
            ` : ''}
          </div>
          
          <!-- Outer Grid Table (compatible with Puppeteer print constraints) -->
          <table style="width: 100%; border-collapse: collapse; border: none;">
            <tr style="vertical-align: top;">
              <!-- Left Column (Sidebar) -->
              <td width="32%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px 12px; border-radius: 12px;">
                <!-- Contact Details -->
                <div style="margin-bottom: 20px;">
                  <h3 style="font-size: 10px; font-weight: 900; color: #94a3b8; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.08em;">Contact</h3>
                  <div style="font-size: 10px; color: #475569; line-height: 1.6; font-family: sans-serif;">
                    ${data.personalInfo.email ? `<div style="margin-bottom: 6px; word-break: break-all;">${mailIcon}${data.personalInfo.email}</div>` : ''}
                    ${data.personalInfo.phone ? `<div style="margin-bottom: 6px;">${phoneIcon}${data.personalInfo.phone}</div>` : ''}
                    ${data.personalInfo.location ? `<div style="margin-bottom: 6px;">${pinIcon}${data.personalInfo.location}</div>` : ''}
                    ${data.personalInfo.linkedin ? `<div style="word-break: break-all;">${linkedinIcon}${data.personalInfo.linkedin}</div>` : ''}
                  </div>
                </div>
                
                <!-- Skills -->
                <div style="margin-bottom: 20px;">
                  <h3 style="font-size: 10px; font-weight: 900; color: #94a3b8; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.08em;">Skills</h3>
                  <div style="line-height: 1.8;">
                    ${renderSkillsList(data.skills, 'badges')}
                  </div>
                </div>
                
                <!-- Certifications -->
                ${data.certifications && data.certifications.length > 0 ? `
                  <div>
                    <h3 style="font-size: 10px; font-weight: 900; color: #94a3b8; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.08em;">Credentials</h3>
                    ${renderCertifications(data.certifications)}
                  </div>
                ` : ''}
              </td>
              
              <!-- Divider Space -->
              <td width="4%"></td>
              
              <!-- Right Main Content Panel -->
              <td width="64%" style="padding: 0 5px;">
          <!-- Summary -->
                ${data.summary ? `
                  <div style="margin-bottom: 20px;">
                    <h2 style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: #94a3b8; margin: 0 0 8px 0; letter-spacing: 0.1em;">Professional Profile</h2>
                    <div style="font-size: 11.5px; line-height: 1.5; color: #475569; margin: 0; text-align: justify;">${cleanHtmlContent(data.summary)}</div>
                  </div>
                ` : ''}
                
                <!-- Work Experience -->
                ${data.experiences && data.experiences.length > 0 ? `
                  <div style="margin-bottom: 20px;">
                    <h2 style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: #94a3b8; margin: 0 0 12px 0; letter-spacing: 0.1em;">Work Experience</h2>
                    ${renderExperiences(data.experiences, true)}
                  </div>
                ` : ''}
                
                <!-- Education -->
                ${data.educations && data.educations.length > 0 ? `
                  <div>
                    <h2 style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: #94a3b8; margin: 0 0 12px 0; letter-spacing: 0.1em;">Academic History</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        ${data.educations.map((edu, index) => {
                          const borderStyle = index % 2 === 0 ? 'padding-right: 5px;' : 'padding-left: 5px;';
                          return `
                            <td width="50%" style="vertical-align: top; ${borderStyle}">
                              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; font-size: 11px;">
                                <div style="font-weight: bold; color: ${primaryColor}; font-size: 9px; uppercase; letter-spacing: 0.05em;">${edu.graduationYear ? `Class of ${edu.graduationYear}` : 'Ongoing'}</div>
                                <div style="font-weight: bold; color: #0f172a; font-size: 11px; margin-top: 4px;">${edu.degree}</div>
                                <div style="color: #64748b; font-size: 10px; margin-top: 1px;">${edu.institution}</div>
                              </div>
                            </td>
                          `;
                        }).join('')}
                      </tr>
                    </table>
                  </div>
                ` : ''}
                
                <!-- Projects -->
                ${data.projects && data.projects.length > 0 ? `
                  <div style="margin-top: 20px;">
                    <h2 style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: #94a3b8; margin: 0 0 12px 0; letter-spacing: 0.1em;">Projects</h2>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                      ${data.projects.map(proj => `
                        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; box-sizing: border-box;">
                          <div style="display: flex; justify-content: space-between; align-items: baseline;">
                            <div style="font-weight: bold; color: #0f172a; font-size: 11px;">${proj.name}</div>
                            ${proj.url ? `<a href="${proj.url}" target="_blank" style="color: #4f46e5; text-decoration: none; font-size: 10px; font-weight: bold;">Link</a>` : ''}
                          </div>
                          ${proj.technologies ? `
                            <div style="margin-top: 4px; display: flex; flex-wrap: wrap; gap: 4px;">
                              ${proj.technologies.split(',').map(tech => tech.trim()).filter(Boolean).map(tech => `
                                <span style="font-size: 8px; font-weight: bold; text-transform: uppercase; background-color: #ffffff; border: 1px solid #cbd5e1; padding: 1px 4px; border-radius: 3px; color: #475569;">${tech}</span>
                              `).join('')}
                            </div>
                          ` : ''}
                          ${proj.description ? `
                            <div style="font-size: 10px; color: #475569; margin-top: 6px; line-height: 1.4;">${cleanHtmlContent(proj.description)}</div>
                          ` : ''}
                        </div>
                      `).join('')}
                    </div>
                  </div>
                ` : ''}

                <!-- Achievements -->
                ${data.achievements && data.achievements.length > 0 ? `
                  <div style="margin-top: 20px;">
                    <h2 style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: #94a3b8; margin: 0 0 12px 0; letter-spacing: 0.1em;">Achievements</h2>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                      ${data.achievements.map(ach => `
                        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; display: flex; gap: 8px; box-sizing: border-box;">
                          <div style="font-size: 14px; color: #f59e0b;">🏆</div>
                          <div>
                            <div style="font-weight: bold; color: #0f172a; font-size: 11px;">${ach.title}</div>
                            <div style="font-size: 10px; color: #475569; margin-top: 2px; line-height: 1.4;">${ach.description}</div>
                          </div>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                ` : ''}

                <!-- Referees -->
                ${data.referees && data.referees.length > 0 ? `
                  <div style="margin-top: 20px;">
                    <h2 style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: #94a3b8; margin: 0 0 12px 0; letter-spacing: 0.1em;">References</h2>
                    <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                      ${data.referees.map(ref => `
                        <div style="flex: 1 1 45%; min-width: 200px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; box-sizing: border-box;">
                          <div style="font-weight: bold; color: #0f172a; font-size: 11px;">${ref.name}</div>
                          ${ref.relationship || ref.company ? `
                            <div style="font-weight: bold; color: ${primaryColor}; font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 3px;">
                              ${ref.relationship ? ref.relationship : ''}${ref.relationship && ref.company ? ' • ' : ''}${ref.company ? ref.company : ''}
                            </div>
                          ` : ''}
                          ${ref.phone ? `<div style="color: #475569; font-size: 9.5px; margin-top: 4px;">📞 ${ref.phone}</div>` : ''}
                          ${ref.email ? `<div style="color: #475569; font-size: 9.5px; margin-top: 1px;">📧 ${ref.email}</div>` : ''}
                        </div>
                      `).join('')}
                    </div>
                  </div>
                ` : ''}
              </td>
            </tr>
          </table>
        </div>
      `;

    case 'corporate':
      return `
        <div style="${fontStyle} color: #0f172a; line-height: 1.5; background: #ffffff; padding: 0;">
          <!-- Centered structured header -->
          <div style="text-align: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 15px;">
              <div style="flex-grow: 1; text-align: center;">
                <h1 style="font-size: 26px; font-weight: 850; margin: 0; text-transform: uppercase; letter-spacing: 0.05em; color: #000000;">${data.personalInfo.fullName}</h1>
                <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: ${primaryColor}; margin-top: 4px; letter-spacing: 0.15em;">${data.personalInfo.jobTitle}</div>
              </div>
              ${profilePic ? `
                <img src="${profilePic}" style="width: 70px; height: 70px; border-radius: 6px; object-fit: cover; border: 1px solid #cbd5e1;" />
              ` : ''}
            </div>
            
            <div style="font-size: 10px; color: #475569; margin-top: 10px; font-weight: 500; font-family: sans-serif;">
              ${data.personalInfo.email ? `<span>${mailIcon}${data.personalInfo.email}</span>` : ''} 
              ${data.personalInfo.phone ? `&bull; <span>${phoneIcon}${data.personalInfo.phone}</span>` : ''} 
              ${data.personalInfo.location ? `&bull; <span>${pinIcon}${data.personalInfo.location}</span>` : ''}
              ${data.personalInfo.linkedin ? `&bull; <span>${linkedinIcon}${data.personalInfo.linkedin}</span>` : ''}
            </div>
          </div>
          
          <!-- Summary -->
          ${data.summary ? `
            <div style="margin-bottom: 18px;">
              <h2 style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: ${primaryColor}; margin: 0 0 6px 0; border-bottom: 1px solid #111111; padding-bottom: 2px; letter-spacing: 0.12em;">Executive Profile</h2>
              <div style="font-size: 11.5px; line-height: 1.5; color: #1e293b; margin: 0; text-align: justify;">${cleanHtmlContent(data.summary)}</div>
            </div>
          ` : ''}
          
          <!-- Experience -->
          ${data.experiences && data.experiences.length > 0 ? `
            <div style="margin-bottom: 18px;">
              <h2 style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: ${primaryColor}; margin: 0 0 10px 0; border-bottom: 1px solid #111111; padding-bottom: 2px; letter-spacing: 0.12em;">Professional History</h2>
              ${renderExperiences(data.experiences, false)}
            </div>
          ` : ''}
          
          <!-- Education -->
          ${data.educations && data.educations.length > 0 ? `
            <div style="margin-bottom: 18px;">
              <h2 style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: ${primaryColor}; margin: 0 0 8px 0; border-bottom: 1px solid #111111; padding-bottom: 2px; letter-spacing: 0.12em;">Academic Preparation</h2>
              ${renderEducations(data.educations)}
            </div>
          ` : ''}
          
          <!-- Skills -->
          <div style="margin-bottom: 18px;">
            <h2 style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: ${primaryColor}; margin: 0 0 6px 0; border-bottom: 1px solid #111111; padding-bottom: 2px; letter-spacing: 0.12em;">Core Competencies</h2>
            <p style="font-size: 11px; color: #1e293b; margin: 0; line-height: 1.5; font-weight: bold;">
              ${renderSkillsList(data.skills, 'comma')}
            </p>
          </div>
          
          <!-- Certifications -->
          ${data.certifications && data.certifications.length > 0 ? `
            <div>
              <h2 style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: ${primaryColor}; margin: 0 0 6px 0; border-bottom: 1px solid #111111; padding-bottom: 2px; letter-spacing: 0.12em;">Professional Credentials</h2>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${data.certifications.map(cert => `
                  <div style="font-size: 10.5px; border-left: 2px solid ${primaryColor}; padding-left: 8px; margin-bottom: 4px; width: 48%; box-sizing: border-box;">
                    <strong style="color: #000;">${cert.name}</strong>
                    ${cert.issuer ? `<span style="color: #475569;"> (${cert.issuer})</span>` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          <!-- Projects -->
          ${data.projects && data.projects.length > 0 ? `
            <div style="margin-top: 18px;">
              <h2 style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: ${primaryColor}; margin: 0 0 6px 0; border-bottom: 1px solid #111111; padding-bottom: 2px; letter-spacing: 0.12em;">Key Projects</h2>
              <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 8px;">
                ${data.projects.map(proj => `
                  <div style="font-size: 10.5px;">
                    <div style="display: flex; justify-content: space-between; align-items: baseline;">
                      <strong style="color: #000; font-size: 11px;">${proj.name}</strong>
                      ${proj.url ? `<a href="${proj.url}" target="_blank" style="color: ${primaryColor}; text-decoration: none; font-size: 10px; font-weight: bold;">Project Link</a>` : ''}
                    </div>
                    ${proj.technologies ? `<div style="font-size: 9px; color: #64748b; font-weight: bold; text-transform: uppercase; margin-top: 2px;">Technologies: ${proj.technologies}</div>` : ''}
                    ${proj.description ? `<div style="color: #475569; font-size: 10px; margin-top: 4px; text-align: justify;">${cleanHtmlContent(proj.description)}</div>` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Achievements -->
          ${data.achievements && data.achievements.length > 0 ? `
            <div style="margin-top: 18px;">
              <h2 style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: ${primaryColor}; margin: 0 0 6px 0; border-bottom: 1px solid #111111; padding-bottom: 2px; letter-spacing: 0.12em;">Key Accomplishments</h2>
              <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
                ${data.achievements.map(ach => `
                  <div style="font-size: 10.5px; display: flex; gap: 6px; align-items: start;">
                    <div style="font-size: 12px; color: #475569; line-height: 1;">★</div>
                    <div>
                      <strong style="color: #000;">${ach.title}</strong>
                      <div style="color: #475569; font-size: 10px; margin-top: 2px;">${ach.description}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Referees -->
          ${data.referees && data.referees.length > 0 ? `
            <div style="margin-top: 18px;">
              <h2 style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: ${primaryColor}; margin: 0 0 6px 0; border-bottom: 1px solid #111111; padding-bottom: 2px; letter-spacing: 0.12em;">References</h2>
              <div style="display: flex; flex-wrap: wrap; gap: 15px;">
                ${data.referees.map(ref => `
                  <div style="width: 48%; margin-bottom: 8px; box-sizing: border-box; font-size: 10.5px;">
                    <strong style="color: #000; font-size: 11px;">${ref.name}</strong>
                    ${ref.relationship || ref.company ? `
                      <div style="color: #475569; font-size: 9.5px; margin: 1px 0;">
                        ${ref.relationship ? ref.relationship : ''}${ref.relationship && ref.company ? ' – ' : ''}${ref.company ? ref.company : ''}
                      </div>
                    ` : ''}
                    ${ref.phone ? `<div style="color: #64748b; font-size: 9.5px;">📞 ${ref.phone}</div>` : ''}
                    ${ref.email ? `<div style="color: #64748b; font-size: 9.5px;">📧 ${ref.email}</div>` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;

    case 'minimal':
      return `
        <div style="${fontStyle} color: #171717; line-height: 1.5; background: #ffffff; padding: 0;">
          <!-- Top Borderless slim line Header -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 12px; margin-bottom: 18px; border-bottom: 1px solid #f1f5f9;">
            <div>
              <h1 style="font-size: 26px; font-weight: 300; color: #000; margin: 0; letter-spacing: -0.01em;">${data.personalInfo.fullName}</h1>
              <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #737373; margin-top: 3px;">${data.personalInfo.jobTitle}</div>
            </div>
            <div style="font-size: 10px; color: #525252; text-align: right; line-height: 1.5; font-family: sans-serif;">
              ${data.personalInfo.email ? `<div style="margin-bottom: 4px;">${mailIcon}${data.personalInfo.email}</div>` : ''}
              ${data.personalInfo.phone ? `<div style="margin-bottom: 4px;">${phoneIcon}${data.personalInfo.phone}</div>` : ''}
              ${data.personalInfo.location ? `<div style="margin-bottom: 4px;">${pinIcon}${data.personalInfo.location}</div>` : ''}
              ${data.personalInfo.linkedin ? `<div>${linkedinIcon}${data.personalInfo.linkedin}</div>` : ''}
            </div>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; border: none; margin-top: 10px;">
            <!-- Summary row -->
            ${data.summary ? `
              <tr style="vertical-align: top;">
                <td width="25%" style="font-size: 9.5px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; color: ${primaryColor}; padding: 6px 0;">Profile</td>
                <td width="75%" style="font-size: 11px; color: #404040; padding: 6px 0 12px 0; text-align: justify;">${cleanHtmlContent(data.summary)}</td>
              </tr>
            ` : ''}
            
            <!-- Experience Row -->
            ${data.experiences && data.experiences.length > 0 ? `
              <tr style="vertical-align: top;">
                <td width="25%" style="font-size: 9.5px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; color: ${primaryColor}; padding: 6px 0;">Experience</td>
                <td width="75%" style="padding: 6px 0 12px 0;">
                  ${renderExperiences(data.experiences, false)}
                </td>
              </tr>
            ` : ''}
            
            <!-- Education Row -->
            ${data.educations && data.educations.length > 0 ? `
              <tr style="vertical-align: top;">
                <td width="25%" style="font-size: 9.5px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; color: ${primaryColor}; padding: 6px 0;">Education</td>
                <td width="75%" style="padding: 6px 0 12px 0;">
                  ${renderEducations(data.educations)}
                </td>
              </tr>
            ` : ''}
            
            <!-- Skills Row -->
            <tr style="vertical-align: top;">
              <td width="25%" style="font-size: 9.5px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; color: ${primaryColor}; padding: 6px 0;">Expertise</td>
              <td width="75%" style="padding: 6px 0 12px 0; font-size: 11px; color: #404040;">
                <div style="line-height: 1.8;">
                  ${renderSkillsList(data.skills, 'outline')}
                </div>
              </td>
            </tr>
            
            <!-- Certifications Row -->
            ${data.certifications && data.certifications.length > 0 ? `
              <tr style="vertical-align: top;">
                <td width="25%" style="font-size: 9.5px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; color: ${primaryColor}; padding: 6px 0;">Credentials</td>
                <td width="75%" style="padding: 6px 0 12px 0;">
                  ${renderCertifications(data.certifications)}
                </td>
              </tr>
            ` : ''}
            
            <!-- Projects Row -->
            ${data.projects && data.projects.length > 0 ? `
              <tr style="vertical-align: top;">
                <td width="25%" style="font-size: 9.5px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; color: ${primaryColor}; padding: 6px 0;">Projects</td>
                <td width="75%" style="padding: 6px 0 12px 0;">
                  <div style="display: flex; flex-direction: column; gap: 12px;">
                    ${data.projects.map(proj => `
                      <div style="font-size: 10.5px; line-height: 1.4;">
                        <div style="display: flex; justify-content: space-between; align-items: baseline;">
                          <strong style="color: #000; font-size: 11px;">${proj.name}</strong>
                          ${proj.url ? `<a href="${proj.url}" target="_blank" style="color: #525252; text-decoration: underline; font-size: 9.5px;">Link</a>` : ''}
                        </div>
                        ${proj.technologies ? `<div style="font-size: 9px; color: #64748b; margin-top: 1px;">Technologies: ${proj.technologies}</div>` : ''}
                        ${proj.description ? `<div style="color: #404040; font-size: 10px; margin-top: 4px; text-align: justify;">${cleanHtmlContent(proj.description)}</div>` : ''}
                      </div>
                    `).join('')}
                  </div>
                </td>
              </tr>
            ` : ''}

            <!-- Achievements Row -->
            ${data.achievements && data.achievements.length > 0 ? `
              <tr style="vertical-align: top;">
                <td width="25%" style="font-size: 9.5px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; color: ${primaryColor}; padding: 6px 0;">Achievements</td>
                <td width="75%" style="padding: 6px 0 12px 0;">
                  <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${data.achievements.map(ach => `
                      <div style="font-size: 10.5px; line-height: 1.4;">
                        <strong style="color: #000; font-size: 11px;">${ach.title}</strong>
                        <div style="color: #404040; font-size: 10px; margin-top: 2px; text-align: justify;">${ach.description}</div>
                      </div>
                    `).join('')}
                  </div>
                </td>
              </tr>
            ` : ''}

            <!-- Referees Row -->
            ${data.referees && data.referees.length > 0 ? `
              <tr style="vertical-align: top;">
                <td width="25%" style="font-size: 9.5px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; color: ${primaryColor}; padding: 6px 0;">References</td>
                <td width="75%" style="padding: 6px 0 12px 0;">
                  <div style="display: flex; flex-wrap: wrap; gap: 15px;">
                    ${data.referees.map(ref => `
                      <div style="width: 48%; margin-bottom: 8px; box-sizing: border-box; font-size: 10.5px; line-height: 1.4;">
                        <strong style="color: #000; font-size: 11px;">${ref.name}</strong>
                        ${ref.relationship || ref.company ? `
                          <div style="color: #64748b; font-size: 9px; margin-top: 1px;">
                            ${ref.relationship ? ref.relationship : ''}${ref.relationship && ref.company ? ' – ' : ''}${ref.company ? ref.company : ''}
                          </div>
                        ` : ''}
                        ${ref.phone ? `<div style="color: #525252; font-size: 9.5px; margin-top: 2px;">Phone: ${ref.phone}</div>` : ''}
                        ${ref.email ? `<div style="color: #525252; font-size: 9.5px;">Email: ${ref.email}</div>` : ''}
                      </div>
                    `).join('')}
                  </div>
                </td>
              </tr>
            ` : ''}
          </table>
        </div>
      `;

    case 'executive':
      return `
        <div style="${fontStyle} color: #1e293b; line-height: 1.5; background: #ffffff; padding: 0;">
          <!-- Left accent-bordered brand panel -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 10px; margin-bottom: 18px; border-bottom: 1px solid #e2e8f0;">
            <div style="border-left: 4px solid ${primaryColor}; padding-left: 12px;">
              <h1 style="font-size: 26px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.1;">${data.personalInfo.fullName}</h1>
              <div style="font-size: 10px; font-weight: 700; uppercase; letter-spacing: 0.12em; color: #64748b; margin-top: 4px; text-transform: uppercase;">${data.personalInfo.jobTitle}</div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="font-size: 10px; color: #64748b; line-height: 1.4; text-align: right; font-family: sans-serif;">
                ${data.personalInfo.email ? `<div style="margin-bottom: 4px;">${mailIcon}${data.personalInfo.email}</div>` : ''}
                ${data.personalInfo.phone ? `<div style="margin-bottom: 4px;">${phoneIcon}${data.personalInfo.phone}</div>` : ''}
                ${data.personalInfo.location ? `<div style="margin-bottom: 4px;">${pinIcon}${data.personalInfo.location}</div>` : ''}
                ${data.personalInfo.linkedin ? `<div>${linkedinIcon}${data.personalInfo.linkedin}</div>` : ''}
              </div>
              ${profilePic ? `
                <img src="${profilePic}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 1px solid ${primaryColor};" />
              ` : ''}
            </div>
          </div>
          
          <!-- Summary in boxed italic frame -->
          ${data.summary ? `
            <div style="background-color: #f8fafc; border-left: 3px solid #0f172a; padding: 12px; margin-bottom: 18px; border-radius: 4px;">
              <h2 style="font-size: 9px; font-weight: 900; text-transform: uppercase; color: ${primaryColor}; margin: 0 0 6px 0; letter-spacing: 0.1em;">Executive Narrative</h2>
              <div style="font-size: 11px; font-style: italic; color: #334155; margin: 0; line-height: 1.5; text-align: justify;">${cleanHtmlContent(data.summary)}</div>
            </div>
          ` : ''}
          
          <!-- Work Experience -->
          ${data.experiences && data.experiences.length > 0 ? `
            <div style="margin-bottom: 18px;">
              <h2 style="font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.12em; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; margin: 0 0 10px 0;">Leadership Experience</h2>
              ${renderExperiences(data.experiences, false)}
            </div>
          ` : ''}
          
          <!-- Education -->
          ${data.educations && data.educations.length > 0 ? `
            <div style="margin-bottom: 18px;">
              <h2 style="font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.12em; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; margin: 0 0 10px 0;">Academic Accomplishments</h2>
              ${renderEducations(data.educations)}
            </div>
          ` : ''}
          
          <!-- Skills -->
          <div style="margin-bottom: 18px;">
            <h2 style="font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.12em; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; margin: 0 0 6px 0;">Signature Competencies</h2>
            <div style="margin-top: 8px;">
              ${renderSkillsList(data.skills, 'bullets')}
            </div>
          </div>
          
          <!-- Certifications -->
          ${data.certifications && data.certifications.length > 0 ? `
            <div>
              <h2 style="font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.12em; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; margin: 0 0 6px 0;">Professional Credentials</h2>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${data.certifications.map(cert => `
                  <div style="font-size: 10.5px; border: 1px solid #e2e8f0; background-color: #f8fafc; padding: 6px 10px; border-radius: 6px; margin-bottom: 4px; width: 48%; box-sizing: border-box;">
                    <div style="font-weight: bold; color: #0f172a;">${cert.name}</div>
                    ${cert.issuer ? `<div style="font-size: 9.5px; color: #64748b; font-weight: 600; margin-top: 1px;">${cert.issuer}</div>` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          <!-- Projects -->
          ${data.projects && data.projects.length > 0 ? `
            <div style="margin-top: 18px; margin-bottom: 18px;">
              <h2 style="font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.12em; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; margin: 0 0 10px 0;">Select Projects</h2>
              <div style="display: flex; flex-direction: column; gap: 12px;">
                ${data.projects.map(proj => `
                  <div style="font-size: 10.5px;">
                    <div style="display: flex; justify-content: space-between; align-items: baseline;">
                      <strong style="color: #0d1527; font-size: 11px; font-style: italic; font-family: Georgia, serif;">${proj.name}</strong>
                      ${proj.url ? `<a href="${proj.url}" target="_blank" style="color: #475569; text-decoration: underline; font-size: 9.5px;">Link</a>` : ''}
                    </div>
                    ${proj.technologies ? `<div style="font-size: 9px; color: #64748b; font-weight: bold; text-transform: uppercase; margin-top: 2px;">Technologies: ${proj.technologies}</div>` : ''}
                    ${proj.description ? `<div style="color: #334155; font-size: 10px; margin-top: 4px; font-family: Georgia, serif; font-style: italic; text-align: justify; line-height: 1.45;">${cleanHtmlContent(proj.description)}</div>` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Achievements -->
          ${data.achievements && data.achievements.length > 0 ? `
            <div style="margin-top: 18px; margin-bottom: 18px;">
              <h2 style="font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.12em; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; margin: 0 0 10px 0;">Key Accomplishments</h2>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                ${data.achievements.map(ach => `
                  <div style="font-size: 10.5px; display: flex; gap: 6px; align-items: start;">
                    <div style="font-size: 12px; color: #b45309; line-height: 1;">🏆</div>
                    <div>
                      <strong style="color: #0d1527; font-family: Georgia, serif; font-style: italic;">${ach.title}</strong>
                      <div style="color: #334155; font-size: 10px; margin-top: 2px;">${ach.description}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Referees -->
          ${data.referees && data.referees.length > 0 ? `
            <div style="margin-top: 18px;">
              <h2 style="font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.12em; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; margin: 0 0 10px 0;">Professional References</h2>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${data.referees.map(ref => `
                  <div style="font-size: 10.5px; border: 1px solid #e2e8f0; background-color: #f8fafc; padding: 8px 10px; border-radius: 6px; margin-bottom: 4px; width: 48%; box-sizing: border-box;">
                    <strong style="color: #0f172a; font-size: 11px;">${ref.name}</strong>
                    ${ref.relationship || ref.company ? `
                      <div style="color: ${primaryColor}; font-weight: bold; font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 3px;">
                        ${ref.relationship ? ref.relationship : ''}${ref.relationship && ref.company ? ' / ' : ''}${ref.company ? ref.company : ''}
                      </div>
                    ` : ''}
                    ${ref.phone ? `<div style="color: #475569; font-size: 9.5px; margin-top: 4px;">Phone: ${ref.phone}</div>` : ''}
                    ${ref.email ? `<div style="color: #475569; font-size: 9.5px;">Email: ${ref.email}</div>` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;

    case 'creative':
      return `
        <div style="${fontStyle} color: #1e293b; line-height: 1.5; background: #ffffff; padding: 0;">
          <table style="width: 100%; border-collapse: collapse; border: none;">
            <tr style="vertical-align: top;">
              <!-- Deep colored side-bar representation -->
              <td width="38%" style="background-color: ${primaryColor}; color: #ffffff; padding: 25px 15px; border-radius: 12px;">
                ${profilePic ? `
                  <div style="text-align: center; margin-bottom: 15px;">
                    <img src="${profilePic}" style="width: 110px; height: 110px; border-radius: 16px; object-fit: cover; border: 3px solid rgba(255,255,255,0.2);" />
                  </div>
                ` : ''}
                
                <h1 style="font-size: 24px; font-weight: 900; color: #ffffff; margin: 0; text-transform: uppercase; letter-spacing: -0.01em; line-height: 1.1;">${data.personalInfo.fullName}</h1>
                <div style="font-size: 9.5px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; background-color: rgba(255,255,255,0.18); padding: 4px 8px; border-radius: 6px; width: fit-content; margin-top: 6px; margin-bottom: 20px;">${data.personalInfo.jobTitle}</div>
                
                <!-- Connect details -->
                <div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 15px; margin-bottom: 20px;">
                  <h3 style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: rgba(255,255,255,0.7); margin: 0 0 8px 0; letter-spacing: 0.1em;">Connect</h3>
                  <div style="font-size: 10.5px; line-height: 1.6; font-family: sans-serif;">
                    ${data.personalInfo.email ? `<div style="margin-bottom: 6px;">${mailIcon}${data.personalInfo.email}</div>` : ''}
                    ${data.personalInfo.phone ? `<div style="margin-bottom: 6px;">${phoneIcon}${data.personalInfo.phone}</div>` : ''}
                    ${data.personalInfo.location ? `<div style="margin-bottom: 6px;">${pinIcon}${data.personalInfo.location}</div>` : ''}
                    ${data.personalInfo.linkedin ? `<div style="word-break: break-all;">${linkedinIcon}${data.personalInfo.linkedin}</div>` : ''}
                  </div>
                </div>
                
                <!-- Skills -->
                <div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 15px;">
                  <h3 style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: rgba(255,255,255,0.7); margin: 0 0 8px 0; letter-spacing: 0.1em;">Signature Skills</h3>
                  <div style="line-height: 1.8;">
                    ${parseSkills(data.skills).map(group => `
                      ${group.category ? `<div style="font-size: 8px; font-weight: 900; text-transform: uppercase; color: rgba(255,255,255,0.6); margin-top: 6px; margin-bottom: 4px; letter-spacing: 0.05em;">${group.category}</div>` : ''}
                      <div style="margin-bottom: 6px;">
                        ${group.items.map(sk => `
                          <span style="display: inline-block; font-size: 9px; font-weight: bold; background-color: rgba(255,255,255,0.15); padding: 2.5px 6.5px; margin: 2px; border-radius: 4px; text-transform: uppercase; color: #ffffff;">${sk}</span>
                        `).join('')}
                      </div>
                    `).join('')}
                  </div>
                </div>
              </td>
              
              <!-- Spacing column -->
              <td width="4%"></td>
              
              <!-- Main Content Body -->
              <td width="58%" style="padding: 0;">
                <!-- Summary -->
                ${data.summary ? `
                  <div style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9; padding: 15px; margin-bottom: 15px;">
                    <h2 style="font-size: 9px; font-weight: 900; text-transform: uppercase; color: #a1a1aa; margin: 0 0 6px 0; letter-spacing: 0.1em;">Narrative Pitch</h2>
                    <div style="font-size: 11.5px; line-height: 1.5; color: #475569; margin: 0; text-align: justify;">${cleanHtmlContent(data.summary)}</div>
                  </div>
                ` : ''}
                
                <!-- Experience -->
                ${data.experiences && data.experiences.length > 0 ? `
                  <div style="background-color: #ffffff; border-radius: 12px; border: 1px solid #f1f5f9; padding: 15px; margin-bottom: 15px;">
                    <h2 style="font-size: 9px; font-weight: 900; text-transform: uppercase; color: #a1a1aa; margin: 0 0 10px 0; letter-spacing: 0.1em;">Milestones & History</h2>
                    ${renderExperiences(data.experiences, false)}
                  </div>
                ` : ''}
                
                <!-- Education -->
                ${data.educations && data.educations.length > 0 ? `
                  <div style="background-color: #ffffff; border-radius: 12px; border: 1px solid #f1f5f9; padding: 15px; margin-bottom: 15px;">
                    <h2 style="font-size: 9px; font-weight: 900; text-transform: uppercase; color: #a1a1aa; margin: 0 0 10px 0; letter-spacing: 0.1em;">Education Journey</h2>
                    ${renderEducations(data.educations)}
                  </div>
                ` : ''}
                
                <!-- Certifications -->
                ${data.certifications && data.certifications.length > 0 ? `
                  <div style="background-color: #ffffff; border-radius: 12px; border: 1px solid #f1f5f9; padding: 15px; margin-bottom: 15px;">
                    <h2 style="font-size: 9px; font-weight: 900; text-transform: uppercase; color: #a1a1aa; margin: 0 0 10px 0; letter-spacing: 0.1em;">Accreditations</h2>
                    ${renderCertifications(data.certifications)}
                  </div>
                ` : ''}
                
                <!-- Projects -->
                ${data.projects && data.projects.length > 0 ? `
                  <div style="background-color: #ffffff; border-radius: 12px; border: 1px solid #f1f5f9; padding: 15px; margin-bottom: 15px;">
                    <h2 style="font-size: 9px; font-weight: 900; text-transform: uppercase; color: #a1a1aa; margin: 0 0 10px 0; letter-spacing: 0.1em;">Featured Projects</h2>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                      ${data.projects.map(proj => `
                        <div style="font-size: 10.5px; border-bottom: 1px solid #f8fafc; padding-bottom: 8px; margin-bottom: 4px;">
                          <div style="display: flex; justify-content: space-between; align-items: baseline;">
                            <strong style="color: #0f172a; font-size: 11px;">${proj.name}</strong>
                            ${proj.url ? `<a href="${proj.url}" target="_blank" style="color: ${primaryColor}; text-decoration: none; font-size: 9.5px; font-weight: bold;">Link</a>` : ''}
                          </div>
                          ${proj.technologies ? `
                            <div style="margin-top: 4px; display: flex; flex-wrap: wrap; gap: 4px;">
                              ${proj.technologies.split(',').map(tech => tech.trim()).filter(Boolean).map(tech => `
                                <span style="font-size: 8px; font-weight: bold; text-transform: uppercase; background-color: #f1f5f9; border: 1px solid #e2e8f0; padding: 1px 4.5px; border-radius: 3.5px; color: #475569; display: inline-block; margin-right: 4px;">${tech}</span>
                              `).join('')}
                            </div>
                          ` : ''}
                          ${proj.description ? `<div style="color: #64748b; font-size: 10px; margin-top: 5px; text-align: justify; line-height: 1.4;">${cleanHtmlContent(proj.description)}</div>` : ''}
                        </div>
                      `).join('')}
                    </div>
                  </div>
                ` : ''}

                <!-- Achievements -->
                ${data.achievements && data.achievements.length > 0 ? `
                  <div style="background-color: #ffffff; border-radius: 12px; border: 1px solid #f1f5f9; padding: 15px; margin-bottom: 15px;">
                    <h2 style="font-size: 9px; font-weight: 900; text-transform: uppercase; color: #a1a1aa; margin: 0 0 10px 0; letter-spacing: 0.1em;">Key Achievements</h2>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                      ${data.achievements.map(ach => `
                        <div style="font-size: 10.5px; display: flex; gap: 6px; align-items: start;">
                          <div style="font-size: 12px; color: #f59e0b; line-height: 1;">★</div>
                          <div>
                            <strong style="color: #0f172a;">${ach.title}</strong>
                            <div style="color: #64748b; font-size: 10px; margin-top: 2px;">${ach.description}</div>
                          </div>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                ` : ''}

                <!-- Referees -->
                ${data.referees && data.referees.length > 0 ? `
                  <div style="background-color: #ffffff; border-radius: 12px; border: 1px solid #f1f5f9; padding: 15px; margin-bottom: 15px;">
                    <h2 style="font-size: 9px; font-weight: 900; text-transform: uppercase; color: #a1a1aa; margin: 0 0 10px 0; letter-spacing: 0.1em;">Professional Referees</h2>
                    <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                      ${data.referees.map(ref => `
                        <div style="flex: 1 1 45%; min-width: 180px; font-size: 10.5px; border-left: 2px solid ${primaryColor}; padding-left: 8px; margin-bottom: 6px; box-sizing: border-box;">
                          <strong style="color: #000; font-size: 11px;">${ref.name}</strong>
                          ${ref.relationship || ref.company ? `
                            <div style="color: #64748b; font-size: 9px; margin-top: 1px;">
                              ${ref.relationship ? ref.relationship : ''}${ref.relationship && ref.company ? ' at ' : ''}${ref.company ? ref.company : ''}
                            </div>
                          ` : ''}
                          ${ref.phone ? `<div style="color: #475569; font-size: 9.5px; margin-top: 2px;">📞 ${ref.phone}</div>` : ''}
                          ${ref.email ? `<div style="color: #475569; font-size: 9.5px;">📧 ${ref.email}</div>` : ''}
                        </div>
                      `).join('')}
                    </div>
                  </div>
                ` : ''}
              </td>
            </tr>
          </table>
        </div>
      `;

    case 'professional':
      const themeColor = accentColor || '#15C3D4';
      const parsedGrps = parseSkills(data.skills);
      
      return `
        <div class="professional-template-wrapper" style="${fontStyle} color: #1e293b; background: #ffffff; padding: 0px; box-sizing: border-box;">
          <style>
            .professional-template-wrapper {
              font-family: ${fontFamily ? `'${fontFamily}'` : "'Inter'"}, -apple-system, BlinkMacSystemFont, 'Segoe UI', helvetica, arial, sans-serif;
            }
            .heading-primary {
              color: #0A1929;
              font-size: 28px;
              font-weight: bold;
              letter-spacing: -0.5px;
              text-transform: uppercase;
              margin: 0;
              line-height: 1.1;
            }
            .title-secondary {
              color: ${themeColor};
              font-size: 16px;
              font-weight: 500;
              letter-spacing: 0.5px;
              text-transform: uppercase;
              margin-top: 4px;
              margin-bottom: 0;
            }
            .section-title {
              color: #0A1929;
              font-size: 16px;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin: 0 0 4px 0;
            }
            .section-divider {
              height: 2px;
              width: 40px;
              background-color: ${themeColor};
              margin-bottom: 16px;
            }
            .body-text {
              font-size: 11.5px;
              font-weight: 400;
              line-height: 1.5;
              color: #1e293b;
              text-align: justify;
            }
            .subtext {
              font-size: 10.5px;
              font-weight: 500;
              color: #5A6874;
            }
            .pipe-divider {
              color: #DCE3E9;
              margin: 0 8px;
            }
            .icon-box {
              display: inline-block;
              border: 1px solid ${themeColor};
              border-radius: 2px;
              background-color: rgba(21, 195, 212, 0.05);
              padding: 2px;
              line-height: 1;
              vertical-align: middle;
              margin-right: 4px;
            }
            .skills-badge {
              display: inline-block;
              font-size: 10px;
              font-weight: 600;
              padding: 3px 8px;
              margin-right: 4px;
              margin-bottom: 6px;
              border-radius: 2px;
              border: 1px solid rgba(21, 195, 212, 0.2);
              background-color: rgba(21, 195, 212, 0.05);
              color: ${themeColor};
            }
            .bullet-item {
              position: relative;
              padding-left: 14px;
              margin-bottom: 8px;
              line-height: 1.5;
              list-style-type: none;
            }
            .bullet-dot {
              position: absolute;
              left: 0;
              top: 0px;
              color: ${themeColor};
              font-size: 10px;
            }
            /* Print style regulations */
            @media print {
              body, .professional-template-wrapper {
                background: white !important;
                color: #000000 !important;
              }
              .professional-template-wrapper * {
                background-color: transparent !important;
                color: #000000 !important;
                border-color: #DCE3E9 !important;
              }
              .heading-primary, .section-title {
                color: #0A1929 !important;
              }
              .title-secondary, .skills-badge, .bullet-dot {
                color: ${themeColor} !important;
              }
              .icon-box {
                border-color: ${themeColor} !important;
                background-color: transparent !important;
              }
              .skills-badge {
                border-color: #DCE3E9 !important;
              }
              a {
                text-decoration: none !important;
                color: #000000 !important;
              }
            }
          </style>

          <!-- Top Header Info -->
          <div style="border-bottom: 1px solid #DCE3E9; padding-bottom: 15px; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse; border: none;">
              <tr>
                <td style="vertical-align: top;">
                  <h1 class="heading-primary">${data.personalInfo.fullName}</h1>
                  <p class="title-secondary">${data.personalInfo.jobTitle}</p>
                </td>
                ${profilePic ? `
                  <td style="vertical-align: top; text-align: right; width: 70px;">
                    <img src="${profilePic}" style="width: 64px; height: 64px; border-radius: 2px; object-fit: cover; border: 2px solid ${themeColor};" />
                  </td>
                ` : ''}
              </tr>
            </table>

            <!-- Horizontal single-line Contact details with pipes -->
            <div style="font-size: 11px; color: #5A6874; margin-top: 15px; line-height: 1.5; font-family: sans-serif;">
              ${data.personalInfo.email ? `
                <span style="display: inline-block; white-space: nowrap;">
                  <span class="icon-box">${mailIcon}</span>
                  <a href="mailto:${data.personalInfo.email}" style="color: inherit; text-decoration: none;">${data.personalInfo.email}</a>
                </span>
              ` : ''} 
              
              ${data.personalInfo.email && data.personalInfo.phone ? `<span class="pipe-divider">|</span>` : ''}
              
              ${data.personalInfo.phone ? `
                <span style="display: inline-block; white-space: nowrap;">
                  <span class="icon-box">${phoneIcon}</span>
                  <a href="tel:${data.personalInfo.phone}" style="color: inherit; text-decoration: none;">${data.personalInfo.phone}</a>
                </span>
              ` : ''} 
              
              ${data.personalInfo.phone && data.personalInfo.location ? `<span class="pipe-divider">|</span>` : ''}
              
              ${data.personalInfo.location ? `
                <span style="display: inline-block; white-space: nowrap;">
                  <span class="icon-box">${pinIcon}</span>
                  <span>${data.personalInfo.location}</span>
                </span>
              ` : ''} 
              
              ${data.personalInfo.location && data.personalInfo.linkedin ? `<span class="pipe-divider">|</span>` : ''}
              
              ${data.personalInfo.linkedin ? `
                <span style="display: inline-block; white-space: nowrap; word-break: break-all;">
                  <span class="icon-box">${linkedinIcon}</span>
                  <span>${data.personalInfo.linkedin}</span>
                </span>
              ` : ''}
            </div>
          </div>

          <!-- Two-Column Grid Representation using HTML Table for flawless Puppeteer PDF column layouts -->
          <table style="width: 100%; border-collapse: collapse; border: none;">
            <tr style="vertical-align: top;">
              <!-- Left Column (4/12 or ~33% width) -->
              <td width="33%" style="padding-right: 15px;">
                <!-- Skills Category list -->
                <div style="margin-bottom: 24px;">
                  <h3 class="section-title">Skills</h3>
                  <div class="section-divider"></div>
                  
                  ${parsedGrps.map(grp => `
                    <div style="margin-bottom: 12px;">
                      ${grp.category ? `<div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #0A1929; margin-bottom: 4px; letter-spacing: 0.05em;">${grp.category}</div>` : ''}
                      <div>
                        ${grp.items.map(item => `<span class="skills-badge">${item}</span>`).join('')}
                      </div>
                    </div>
                  `).join('')}
                </div>

                <!-- Academic Journey -->
                ${data.educations && data.educations.length > 0 ? `
                  <div style="margin-bottom: 24px;">
                    <h3 class="section-title">Education</h3>
                    <div class="section-divider"></div>
                    
                    ${data.educations.map(edu => `
                      <div style="margin-bottom: 12px; font-size: 11.5px;">
                        <strong style="color: #0A1929;">${edu.degree}</strong>
                        <div class="subtext" style="margin-top: 2px;">${edu.institution}</div>
                        ${edu.graduationYear ? `<div style="font-size: 10px; color: #94a3b8; margin-top: 1px;">Class of ${edu.graduationYear}</div>` : ''}
                      </div>
                    `).join('')}
                  </div>
                ` : ''}

                <!-- Certifications -->
                ${data.certifications && data.certifications.length > 0 ? `
                  <div style="margin-bottom: 24px;">
                    <h3 class="section-title">Credentials</h3>
                    <div class="section-divider"></div>
                    
                    ${data.certifications.map(cert => `
                      <div style="margin-bottom: 10px; font-size: 11px;">
                        <strong style="color: #0A1929;">${cert.name}</strong>
                        <div class="subtext" style="margin-top: 1px;">${cert.issuer} ${cert.date ? `• ${cert.date}` : ''}</div>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}

                <!-- Referees -->
                ${data.referees && data.referees.length > 0 ? `
                  <div style="margin-bottom: 24px;">
                    <h3 class="section-title">References</h3>
                    <div class="section-divider"></div>
                    
                    ${data.referees.map(ref => `
                      <div style="margin-bottom: 12px; font-size: 11px;">
                        <strong style="color: #0A1929;">${ref.name}</strong>
                        ${ref.relationship || ref.company ? `<div class="subtext" style="font-weight: 600; font-size: 9.5px; margin-top: 1px;">${ref.relationship ? ref.relationship : ''}${ref.relationship && ref.company ? ' / ' : ''}${ref.company ? ref.company : ''}</div>` : ''}
                        <div style="font-size: 10px; color: #5A6874; margin-top: 3.5px; font-family: sans-serif;">
                          ${ref.phone ? `<div style="margin-bottom: 1px;">📞 ${ref.phone}</div>` : ''}
                          ${ref.email ? `<div style="word-break: break-all;">📧 ${ref.email}</div>` : ''}
                        </div>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
              </td>

              <!-- Subtle visual column divider space -->
              <td width="2%" style="border-left: 1px solid #E2E8F0; padding-left: 15px;"></td>

              <!-- Right Column (65% width) -->
              <td width="65%" style="padding-left: 5px;">
                <!-- Summary Pitch -->
                ${data.summary ? `
                  <div style="margin-bottom: 24px;">
                    <h3 class="section-title">Profile</h3>
                    <div class="section-divider"></div>
                    <div class="body-text">${cleanHtmlContent(data.summary)}</div>
                  </div>
                ` : ''}

                <!-- Experience History -->
                ${data.experiences && data.experiences.length > 0 ? `
                  <div style="margin-bottom: 24px;">
                    <h3 class="section-title">Work Experience</h3>
                    <div class="section-divider"></div>
                    
                    ${data.experiences.map(exp => {
                      const bullets = (exp.bulletPoints || []).filter((bp: string) => bp.trim()).map((bp: string) => `
                        <li class="bullet-item"><span class="bullet-dot">▪</span>${bp}</li>
                      `).join('');
                      
                      return `
                        <div style="margin-bottom: 18px;">
                          <table style="width: 100%; border-collapse: collapse; border: none; margin-bottom: 4px;">
                            <tr>
                              <td style="vertical-align: top;">
                                <strong style="font-size: 13px; color: #0A1929;">${exp.role}</strong>
                                <div class="subtext" style="font-weight: bold; font-size: 11.5px; margin-top: 1px;">${exp.company}</div>
                              </td>
                              <td style="vertical-align: top; text-align: right; white-space: nowrap;" class="subtext">
                                ${exp.startDate} – ${exp.endDate}
                              </td>
                            </tr>
                          </table>
                          ${exp.description ? `<div class="body-text" style="margin-bottom: 6px;">${cleanHtmlContent(exp.description)}</div>` : ''}
                          ${bullets ? `<ul style="margin: 4px 0 0 0; padding-left: 0;">${bullets}</ul>` : ''}
                        </div>
                      `;
                    }).join('')}
                  </div>
                ` : ''}

                <!-- Featured Projects -->
                ${data.projects && data.projects.length > 0 ? `
                  <div style="margin-bottom: 24px;">
                    <h3 class="section-title">Featured Projects</h3>
                    <div class="section-divider"></div>
                    
                    ${data.projects.map(proj => `
                      <div style="margin-bottom: 14px;">
                        <table style="width: 100%; border-collapse: collapse; border: none; margin-bottom: 2px;">
                          <tr>
                            <td style="vertical-align: top;">
                              <strong style="font-size: 12px; color: #0A1929;">${proj.name}</strong>
                            </td>
                            ${proj.url ? `<td style="vertical-align: top; text-align: right; white-space: nowrap;"><a href="${proj.url}" target="_blank" style="color: ${themeColor}; font-size: 10.5px; font-weight: bold; text-decoration: none;">Link</a></td>` : ''}
                          </tr>
                        </table>
                        
                        ${proj.technologies ? `
                          <div style="margin-top: 2px; margin-bottom: 4px;">
                            ${proj.technologies.split(',').map(tech => tech.trim()).filter(Boolean).map(tech => `
                              <span style="font-size: 8.5px; font-weight: bold; text-transform: uppercase; background-color: #f1f5f9; border: 1px solid #e2e8f0; padding: 1.5px 4px; border-radius: 2px; color: #475569; display: inline-block; margin-right: 4px; margin-bottom: 3px;">${tech}</span>
                            `).join('')}
                          </div>
                        ` : ''}
                        
                        ${proj.description ? `<div class="body-text" style="margin-top: 4px;">${cleanHtmlContent(proj.description)}</div>` : ''}
                      </div>
                    `).join('')}
                  </div>
                ` : ''}

                <!-- Achievements -->
                ${data.achievements && data.achievements.length > 0 ? `
                  <div style="margin-bottom: 24px;">
                    <h3 class="section-title">Key Achievements</h3>
                    <div class="section-divider"></div>
                    
                    ${data.achievements.map(ach => `
                      <div style="margin-bottom: 12px; font-size: 11px;">
                        <span style="color: ${themeColor}; margin-right: 4px;">★</span>
                        <strong style="color: #0A1929; font-size: 11.5px;">${ach.title}</strong>
                        <div style="color: #1e293b; margin-top: 2px; padding-left: 14px;">${ach.description}</div>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
              </td>
            </tr>
          </table>
        </div>
      `;

    default:
      return renderTemplateToHTML('modern', data, accentColor, fontFamily);
  }
}
