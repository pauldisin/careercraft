import { Router } from "express";
import fs from "fs";
import path from "path";
import { getAppConfig } from "../src/lib/app-config.ts";
import { env } from "../src/lib/env.ts";
import { blogPosts } from "../src/data/blogPosts.ts";
import { careerAdvicePosts } from "../src/data/careerAdvicePosts.ts";

const router = Router();

interface PublicPage {
  path: string;
  file: string;
  changefreq: string;
  priority: string;
}

const PUBLIC_PAGES: PublicPage[] = [
  { path: "", file: "LandingPage.tsx", changefreq: "daily", priority: "1.0" },
  { path: "auth", file: "Auth.tsx", changefreq: "monthly", priority: "0.5" },
  { path: "reset-password", file: "ResetPassword.tsx", changefreq: "monthly", priority: "0.4" },
  { path: "resume-builder", file: "ResumeBuilder.tsx", changefreq: "weekly", priority: "0.9" },
  { path: "templates", file: "Templates.tsx", changefreq: "weekly", priority: "0.9" },
  { path: "pricing", file: "Pricing.tsx", changefreq: "weekly", priority: "0.8" },
  { path: "about", file: "About.tsx", changefreq: "monthly", priority: "0.7" },
  { path: "privacy", file: "PrivacyPolicy.tsx", changefreq: "monthly", priority: "0.5" },
  { path: "terms", file: "TermsOfService.tsx", changefreq: "monthly", priority: "0.5" },
  { path: "cookies", file: "CookiePolicy.tsx", changefreq: "monthly", priority: "0.5" },
  { path: "blog", file: "Blog.tsx", changefreq: "daily", priority: "0.8" },
  { path: "career-advice", file: "CareerAdvice.tsx", changefreq: "weekly", priority: "0.8" },
  { path: "interview-prep", file: "InterviewPrep.tsx", changefreq: "weekly", priority: "0.8" },
  { path: "help", file: "HelpCenter.tsx", changefreq: "weekly", priority: "0.7" },
  { path: "contact", file: "Contact.tsx", changefreq: "monthly", priority: "0.7" },
];

/**
 * Endpoint to serve a dynamic sitemap.xml
 */
router.get("/sitemap.xml", async (req, res, next) => {
  try {
    const rawAppUrl = (await getAppConfig("APP_URL")) || env.APP_URL || "http://localhost:3000";
    const baseUrl = rawAppUrl.replace(/\/+$/, "");

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    for (const page of PUBLIC_PAGES) {
      const filePath = path.join(process.cwd(), "src", "pages", page.file);
      let lastmod = new Date().toISOString().split("T")[0];
      
      if (fs.existsSync(filePath)) {
        try {
          const stats = fs.statSync(filePath);
          lastmod = stats.mtime.toISOString().split("T")[0];
        } catch (fileErr) {
          // Fallback to current date silently on read stats error
        }
      }

      const urlLoc = `${baseUrl}${page.path ? `/${page.path}` : ""}`;
      xml += `  <url>\n`;
      xml += `    <loc>${urlLoc}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    // Dynamic additions for individual blog articles
    for (const post of blogPosts) {
      const urlLoc = `${baseUrl}/blog?id=${post.id}`;
      const lastmod = post.date || new Date().toISOString().split("T")[0];
      xml += `  <url>\n`;
      xml += `    <loc>${urlLoc}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.85</priority>\n`;
      xml += `  </url>\n`;
    }

    // Dynamic additions for individual career advice guides
    for (const post of careerAdvicePosts) {
      const urlLoc = `${baseUrl}/career-advice?id=${post.id}`;
      const lastmod = new Date().toISOString().split("T")[0];
      xml += `  <url>\n`;
      xml += `    <loc>${urlLoc}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.82</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>\n`;

    res.header("Content-Type", "application/xml; charset=utf-8");
    res.status(200).send(xml);
  } catch (err) {
    next(err);
  }
});

/**
 * Endpoint to serve a dynamic robots.txt aligning with config APP_URL sitemap
 */
router.get("/robots.txt", async (req, res, next) => {
  try {
    const rawAppUrl = (await getAppConfig("APP_URL")) || env.APP_URL || "http://localhost:3000";
    const baseUrl = rawAppUrl.replace(/\/+$/, "");

    let plainText = `User-agent: *\n`;
    plainText += `Allow: /\n\n`;
    plainText += `Sitemap: ${baseUrl}/sitemap.xml\n`;

    res.header("Content-Type", "text/plain; charset=utf-8");
    res.status(200).send(plainText);
  } catch (err) {
    next(err);
  }
});

export default router;
