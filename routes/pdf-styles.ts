export function getPdfStyles(template: string, accentColor: string, fontFamily: string): string {
  const fontLink = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Cormorant+Garamond:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Merriweather:wght@300;400;700&family=Playfair+Display:wght@400;500;600;700&family=Roboto:wght@300;400;500;700&family=Open+Sans:wght@300;400;500;600;700&display=swap');`;

  let baseFont = fontFamily || "'Inter', sans-serif";

  const rootStyles = `
    :root {
      --resume-accent: ${accentColor || '#4f46e5'};
    }
    
    * {
      box-sizing: border-box;
      max-width: 100%;
      word-break: break-word;
      overflow-wrap: break-word;
    }

    body {
      margin: 0;
      padding: 0;
      background-color: white;
    }

    .document-wrapper {
      width: 100%;
    }

    h1, h2, h3, h4, h5, h6, p, ul, ol, li {
      margin: 0;
      padding: 0;
    }
  `;

  let templateStyles = '';

  switch(template) {
    case 'modern':
      templateStyles = `
        .document-wrapper {
          font-family: ${baseFont}, 'Inter', sans-serif;
          color: #334155;
        }
        h1 {
          font-size: 28px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 8px;
          letter-spacing: -0.02em;
        }
        h2 {
          font-size: 18px;
          font-weight: 700;
          color: var(--resume-accent);
          border-bottom: 2px solid #e0e7ff;
          padding-bottom: 4px;
          margin-top: 20px;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        h3 {
          font-size: 16px;
          font-weight: 600;
          color: #0f172a;
          margin-top: 12px;
          margin-bottom: 4px;
        }
        p, li {
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 6px;
        }
        ul {
          padding-left: 20px;
          margin-bottom: 15px;
        }
      `;
      break;

    case 'corporate':
      templateStyles = `
        .document-wrapper {
          font-family: ${baseFont}, 'Times New Roman', Times, serif;
          color: #000;
        }
        h1 {
          font-size: 24pt;
          text-align: center;
          font-weight: bold;
          margin-bottom: 8px;
          text-transform: uppercase;
        }
        h2 {
          font-size: 14pt;
          border-bottom: 1px solid #000;
          margin-top: 16px;
          margin-bottom: 10px;
          text-transform: uppercase;
          font-weight: bold;
          color: var(--resume-accent);
        }
        h3 {
          font-size: 12pt;
          font-weight: bold;
          margin-top: 10px;
          margin-bottom: 4px;
        }
        p, li {
          font-size: 11pt;
          line-height: 1.4;
          margin-bottom: 6px;
        }
        ul {
          padding-left: 20px;
          margin-bottom: 15px;
        }
      `;
      break;

    case 'minimal':
      templateStyles = `
        .document-wrapper {
          font-family: ${baseFont}, 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #171717;
          font-weight: 300;
        }
        h1 {
          font-size: 24px;
          font-weight: 400;
          margin-bottom: 8px;
          letter-spacing: 0.02em;
          color: var(--resume-accent);
        }
        h2 {
          font-size: 12px;
          font-weight: 600;
          color: #737373;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-top: 20px;
          margin-bottom: 10px;
        }
        h3 {
          font-size: 14px;
          font-weight: 500;
          margin-top: 10px;
          margin-bottom: 4px;
        }
        p, li {
          font-size: 13px;
          line-height: 1.5;
          color: #404040;
          margin-bottom: 6px;
        }
        ul {
          padding-left: 0;
          margin-bottom: 15px;
        }
        li {
          padding-left: 15px;
        }
        li::before {
          content: "—";
          position: absolute;
          left: 0;
          color: #a3a3a3;
        }
      `;
      break;

    case 'executive':
      templateStyles = `
        .document-wrapper {
          font-family: ${baseFont}, 'Cormorant Garamond', serif;
          color: #1e293b;
        }
        h1 {
          font-size: 36px;
          font-weight: 300;
          color: #0f172a;
          margin-bottom: 8px;
          text-align: center;
          letter-spacing: 0.05em;
        }
        h2 {
          font-size: 14px;
          font-weight: 600;
          color: var(--resume-accent);
          border-top: 1px solid #e2e8f0;
          border-bottom: 1px solid #e2e8f0;
          padding: 6px 0;
          margin-top: 24px;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          text-align: center;
        }
        h3 {
          font-size: 18px;
          font-weight: 600;
          color: #0f172a;
          margin-top: 16px;
          margin-bottom: 4px;
        }
        p, li {
          font-size: 15px;
          line-height: 1.6;
          margin-bottom: 6px;
        }
        ul {
          padding-left: 0;
          margin-bottom: 15px;
        }
        li {
          padding-left: 20px;
        }
        li::before {
          content: "•";
          position: absolute;
          left: 0;
          color: var(--resume-accent);
        }
      `;
      break;

    case 'creative':
      templateStyles = `
        .document-wrapper {
          font-family: ${baseFont}, 'Inter', sans-serif;
          color: #1e293b;
        }
        h1 {
          font-size: 48px;
          font-weight: 900;
          color: #0f172a;
          margin-bottom: 12px;
          letter-spacing: -0.05em;
          line-height: 0.9;
        }
        h2 {
          font-size: 24px;
          font-weight: 800;
          color: var(--resume-accent);
          margin-top: 30px;
          margin-bottom: 12px;
          position: relative;
          display: inline-block;
          border-bottom: 4px solid var(--resume-accent);
        }
        h3 {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          margin-top: 20px;
          margin-bottom: 4px;
        }
        p, li {
          font-size: 15px;
          line-height: 1.6;
          margin-bottom: 8px;
        }
        ul {
          padding-left: 25px;
          margin-bottom: 15px;
        }
      `;
      break;

    default: // fallback modern
      templateStyles = `
        .document-wrapper {
          font-family: ${baseFont}, 'Arial', sans-serif;
          color: #333;
        }
        h1 { font-size: 24pt; border-bottom: 1px solid #ccc; padding-bottom: 5px; } 
        h2 { font-size: 18pt; margin-top: 20px; color: var(--resume-accent); } 
        h3 { font-size: 14pt; } 
        p, li { font-size: 12pt; margin-bottom: 10px; line-height: 1.5; } 
        ul { margin-bottom: 15px; padding-left: 20px; }
      `;
      break;
  }

  return `${fontLink} ${rootStyles} ${templateStyles}`;
}
