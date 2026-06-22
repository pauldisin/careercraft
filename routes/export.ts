import { Router } from "express";
import HTMLtoDOCX from "html-to-docx";
import { queuePdfGeneration } from "../src/lib/pdfQueue.ts";
import { requireAuth, type AuthRequest } from "../middleware/auth.ts";
import { marked } from "marked";
import { getPdfStyles } from "./pdf-styles.ts";
import { parseMarkdownToResumeData } from "../src/lib/resumeParser.ts";
import { renderTemplateToHTML } from "./resume-templates-html.ts";
import rateLimit from "express-rate-limit";
import { config } from "../config.ts";
import { getRedisRateLimitStore } from "../src/lib/redis.ts";
import { correctSpellingTypos } from "../src/lib/spellingCorrection.ts";

const router = Router();

const exportRateLimiter = rateLimit({
  windowMs: config.export.rateLimitWindowMs,
  max: config.export.rateLimitMaxRequests,
  message: { error: "Too many export requests, please try again later." },
  keyGenerator: (req) => {
    return (req as AuthRequest).user?.id || req['ip'] || "anonymous";
  },
  validate: false,
  standardHeaders: true,
  legacyHeaders: false,
  store: getRedisRateLimitStore(),
});

const generateDraftMarkdown = (data: any) => {
  let md = '';
  const { personalInfo, experiences, educations, skills, certifications, referees } = data;
  
  if (personalInfo?.fullName) md += `# ${personalInfo.fullName}\n`;
  
  const contact = [];
  if (personalInfo?.email) contact.push(personalInfo.email);
  if (personalInfo?.phone) contact.push(personalInfo.phone);
  if (personalInfo?.location) contact.push(personalInfo.location);
  if (personalInfo?.linkedin) contact.push(personalInfo.linkedin);
  
  if (contact.length > 0) md += `${contact.join(' | ')}\n\n`;
  
  if (personalInfo?.jobTitle) md += `**${personalInfo.jobTitle}**\n\n`;
  
  if (data.summary) {
    md += `## Summary\n\n${data.summary}\n\n`;
  }
  
  if (experiences && experiences.length > 0) {
    md += `## Experience\n\n`;
    experiences.forEach((exp: any) => {
      if (exp.role || exp.company) {
        md += `### ${exp.role || 'Role'} at ${exp.company || 'Company'}\n`;
        md += `*${exp.startDate || 'Start'} - ${exp.endDate || 'End'}*\n\n`;
        if (exp.description) md += `${exp.description}\n\n`;
        if (exp.bulletPoints && exp.bulletPoints.length > 0) {
          exp.bulletPoints.forEach((bp: string) => {
            if (bp.trim()) md += `- ${bp}\n`;
          });
          md += `\n`;
        }
      }
    });
  }
  
  if (educations && educations.length > 0) {
    md += `## Education\n\n`;
    educations.forEach((edu: any) => {
      if (edu.degree || edu.institution) {
        md += `### ${edu.degree || 'Degree'} - ${edu.institution || 'Institution'}\n`;
        if (edu.graduationYear) md += `*Class of ${edu.graduationYear}*\n\n`;
      }
    });
  }
  
  if (skills) {
    md += `## Skills\n\n${skills}\n\n`;
  }
  
  if (certifications) {
    md += `## Certifications\n\n`;
    if (typeof certifications === 'string') {
      md += `${certifications}\n\n`;
    } else if (Array.isArray(certifications) && certifications.length > 0) {
      certifications.forEach((cert: any) => {
        if (cert.name) {
          md += `### ${cert.name}\n`;
          if (cert.issuer || cert.date) {
            md += `*${cert.issuer ? cert.issuer : ''}${cert.issuer && cert.date ? ' - ' : ''}${cert.date ? cert.date : ''}*\n\n`;
          } else {
            md += `\n`;
          }
        }
      });
    }
  }

  if (data.projects && Array.isArray(data.projects) && data.projects.length > 0) {
    md += `## Projects\n\n`;
    data.projects.forEach((proj: any) => {
      if (proj.name) {
        md += `### ${proj.name}\n`;
        if (proj.url) md += `*${proj.url}*\n`;
        if (proj.technologies) md += `Technologies: ${proj.technologies}\n`;
        if (proj.description) md += `\n${proj.description}\n`;
        md += `\n`;
      }
    });
  }

  if (data.achievements && Array.isArray(data.achievements) && data.achievements.length > 0) {
    md += `## Achievements\n\n`;
    data.achievements.forEach((ach: any) => {
      if (ach.title) {
        md += `### ${ach.title}\n`;
        if (ach.description) md += `${ach.description}\n`;
        md += `\n`;
      }
    });
  }
  
  if (referees && Array.isArray(referees) && referees.length > 0) {
    md += `## Referees\n\n`;
    referees.forEach((ref: any) => {
      if (ref.name) {
        md += `### ${ref.name}\n`;
        if (ref.relationship || ref.company) {
          md += `*${ref.relationship ? ref.relationship : ''}${ref.relationship && ref.company ? ' - ' : ''}${ref.company ? ref.company : ''}*\n\n`;
        }
        if (ref.phone) md += `Phone: ${ref.phone}\n`;
        if (ref.email) md += `Email: ${ref.email}\n`;
        md += `\n`;
      }
    });
  }
  
  return md || '*No content provided.*';
};

const generateHTML = async (body: any) => {
  const { type, data, markdown, template, accentColor, fontFamily } = body;
  
  if (type === 'resume') {
    let mdContent = '';
    if (markdown) {
      mdContent = markdown;
    } else if (data) {
      mdContent = generateDraftMarkdown(data);
    } else {
      throw new Error("Missing content data");
    }

    // Auto-correct spelling typos to polish document quality (using centralized utility)
    mdContent = correctSpellingTypos(mdContent);

    const defaultData = data || {
      personalInfo: { fullName: '', email: '', phone: '', location: '', jobTitle: '', linkedin: '' },
      summary: '',
      experiences: [],
      educations: [],
      skills: '',
      certifications: []
    };
    
    const structuredData = parseMarkdownToResumeData(mdContent, defaultData);
    const styles = getPdfStyles(template || 'modern', accentColor, fontFamily);
    const bodyHTML = renderTemplateToHTML(template || 'modern', structuredData, accentColor, fontFamily);

    return `
      <!DOCTYPE html>
      <html lang='en'>
        <head>
          <meta charset='utf-8'>
          <title>Resume</title>
          <style>
            ${styles}
          </style>
        </head>
        <body style="margin: 0; padding: 0;">
          <div class="document-wrapper resume-template-${template || 'modern'}">
            ${bodyHTML}
          </div>
        </body>
      </html>
    `;
  }

  // Cover letter fallback
  let mdContent = '';
  if (markdown) {
    mdContent = markdown;
  } else {
    throw new Error("Missing content data");
  }

  // Auto-correct spelling typos to polish document quality (using centralized utility)
  mdContent = correctSpellingTypos(mdContent);

  const parsedHTML = await marked.parse(mdContent);
  const styles = getPdfStyles(template || 'modern', accentColor, fontFamily);

  const header = `
    <!DOCTYPE html>
    <html lang='en'>
      <head>
        <meta charset='utf-8'>
        <title>Document</title>
        <style>
          ${styles}
        </style>
      </head>
      <body>
        <div class="document-wrapper cover-letter-template-${template || 'modern'}">
  `;
  const footer = "</div></body></html>";
  
  return header + parsedHTML + footer;
};

router.post("/pdf", requireAuth, exportRateLimiter, async (req, res) => {
  try {
    const html = await generateHTML(req.body);
    const pdfBuffer = await queuePdfGeneration(html);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="document.pdf"');
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

const cleanHtmlForDocx = (html: string): string => {
  // 1. Remove comments which might be parsed as children of table rows
  let cleaned = html.replace(/<!--[\s\S]*?-->/g, "");
  
  // 2. Remove whitespace between structural table tags to prevent the parser from injecting empty child text nodes
  cleaned = cleaned
    .replace(/(<\/tr>|<tr[^>]*>|<thead>|<\/thead>|<tbody>|<\/tbody>|<table[^>]*>|<\/table>)\s+(<tr[^>]*>|<\/tr>|<td[^>]*>|<\/td>|<tbody>|<\/tbody>|<thead>|<\/thead>|<\/table>)/gi, '$1$2')
    .replace(/(<\/td>)\s+(<td[^>]*>)/gi, '$1$2')
    .replace(/(<\/td>)\s+(<\/tr>)/gi, '$1$2')
    .replace(/(<tr[^>]*>)\s+(<td[^>]*>)/gi, '$1$2');
    
  return cleaned;
};

router.post("/docx", requireAuth, exportRateLimiter, async (req, res) => {
  try {
    const html = await generateHTML(req.body);
    const cleanedHtml = cleanHtmlForDocx(html);

    const fileBuffer = await HTMLtoDOCX(cleanedHtml, null, {
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: true,
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename="document.docx"');
    res.send(fileBuffer);
  } catch (error) {
    console.error("Error generating DOCX:", error);
    res.status(500).json({ error: "Failed to generate DOCX" });
  }
});

router.post("/txt", requireAuth, exportRateLimiter, async (req, res) => {
  try {
    const { markdown } = req.body;
    // Basic markdown to plain text conversion
    const plainText = markdown
      .replace(/#+\s/g, '') // remove headings
      .replace(/\*\*/g, '') // remove bold
      .replace(/-\s/g, ''); // remove bullet points
    
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename="document.txt"');
    res.send(plainText);
  } catch (error) {
    console.error("Error generating TXT:", error);
    res.status(500).json({ error: "Failed to generate TXT" });
  }
});

router.post("/rtf", requireAuth, exportRateLimiter, async (req, res) => {
  try {
    const { markdown } = req.body;
    // Very simple markdown to RTF conversion
    const rtfContent = markdown
      .replace(/#+\s(.+)/g, '\\b\\fs32 $1\\par\\par')
      .replace(/\*\*(.+)\*\*/g, '\\b $1\\b0')
      .replace(/-\s(.+)/g, '\\bullet $1\\par')
      .replace(/\n/g, '\\par\n');
    
    const rtf = `{\\rtf1\\ansi\\deff0 { \\fonttbl {\\f0 Arial;} } \\f0\\fs24 ${rtfContent} }`;
    
    res.setHeader('Content-Type', 'application/rtf');
    res.setHeader('Content-Disposition', 'attachment; filename="document.rtf"');
    res.send(rtf);
  } catch (error) {
    console.error("Error generating RTF:", error);
    res.status(500).json({ error: "Failed to generate RTF" });
  }
});

export default router;
