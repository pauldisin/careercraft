import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import { db, resumes, resumeVersions } from "../db/schema.ts";
import { eq, and, desc, inArray } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middleware/auth.ts";
import { config } from "../config.ts";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  try {
    const userResumes = await db.select({
      id: resumes.id,
      title: resumes.title,
      template: resumes.template,
      data: resumes.data,
      created_at: resumes.created_at,
      updated_at: resumes.updated_at
    }).from(resumes).where(eq(resumes.user_id, userId)).orderBy(desc(resumes.updated_at));
    res.json(userResumes);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch resumes" });
  }
});

router.get("/:id", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  try {
    const userResumes = await db.select().from(resumes).where(and(eq(resumes.id, req.params.id), eq(resumes.user_id, userId)));
    const resume = userResumes[0];
    if (!resume) return res.status(404).json({ error: "Resume not found" });
    
    // Parse data JSON
    const parsedData = JSON.parse(resume.data);
    res.json({
      ...resume,
      data: parsedData,
      accentColor: resume.accent_color,
      fontFamily: resume.font_family
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch resume" });
  }
});

const PostResumeSchema = z.object({
  id: z.string().max(100).optional(),
  title: z.string().min(1).max(200),
  data: z.any(),
  template: z.string().max(100),
  accentColor: z.string().max(50).optional(),
  fontFamily: z.string().max(100).optional()
});

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  try {
    const { id, title, data, template, accentColor, fontFamily } = PostResumeSchema.parse(req.body);
    const resumeId = id || `res_${crypto.randomUUID()}`;
    const dataStr = JSON.stringify(data);
    
    const existingResumes = await db.select({ id: resumes.id }).from(resumes).where(and(eq(resumes.id, resumeId), eq(resumes.user_id, userId)));
    const existing = existingResumes[0];
    
    if (existing) {
      await db.update(resumes).set({
        title,
        data: dataStr,
        template,
        accent_color: accentColor || null,
        font_family: fontFamily || null,
        updated_at: new Date()
      }).where(and(eq(resumes.id, resumeId), eq(resumes.user_id, userId)));
    } else {
      await db.insert(resumes).values({
        id: resumeId,
        user_id: userId,
        title,
        data: dataStr,
        template,
        accent_color: accentColor || null,
        font_family: fontFamily || null,
      });
    }

    // Save version
    const versionId = `ver_${crypto.randomUUID()}`;
    await db.insert(resumeVersions).values({
      id: versionId,
      resume_id: resumeId,
      data: dataStr,
      template,
      accent_color: accentColor || null,
      font_family: fontFamily || null,
    });
      
    // Limit versions per resume
    const versions = await db.select({ id: resumeVersions.id }).from(resumeVersions).where(eq(resumeVersions.resume_id, resumeId)).orderBy(desc(resumeVersions.created_at)).offset(config.resume.maxVersions);
    if (versions.length > 0) {
      const idsToDelete = versions.map(v => v.id);
      await db.delete(resumeVersions).where(inArray(resumeVersions.id, idsToDelete));
    }
    
    const savedResumes = await db.select().from(resumes).where(eq(resumes.id, resumeId));
    const saved = savedResumes[0];
    if (saved) {
      const parsedData = JSON.parse(saved.data);
      res.json({
        ...saved,
        data: parsedData,
        accentColor: saved.accent_color,
        fontFamily: saved.font_family
      });
    } else {
      res.json(saved);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.issues });
    }
    console.error("Save resume error:", error);
    res.status(500).json({ error: "Failed to save resume" });
  }
});

router.delete("/:id", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  try {
    await db.delete(resumes).where(and(eq(resumes.id, req.params.id), eq(resumes.user_id, userId)));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete resume" });
  }
});

router.get("/:id/versions", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  try {
    // Verify ownership
    const userResumes = await db.select({ id: resumes.id }).from(resumes).where(and(eq(resumes.id, req.params.id), eq(resumes.user_id, userId)));
    if (userResumes.length === 0) {
      return res.status(404).json({ error: "Resume not found" });
    }

    const versions = await db.select({
      id: resumeVersions.id,
      created_at: resumeVersions.created_at,
      template: resumeVersions.template
    }).from(resumeVersions).where(eq(resumeVersions.resume_id, req.params.id)).orderBy(desc(resumeVersions.created_at));
    res.json(versions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch versions" });
  }
});

router.get("/:id/versions/:versionId", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  try {
    // Verify ownership
    const userResumes = await db.select({ id: resumes.id }).from(resumes).where(and(eq(resumes.id, req.params.id), eq(resumes.user_id, userId)));
    if (userResumes.length === 0) {
      return res.status(404).json({ error: "Resume not found" });
    }

    const versions = await db.select().from(resumeVersions).where(and(eq(resumeVersions.id, req.params.versionId), eq(resumeVersions.resume_id, req.params.id)));
    const version = versions[0];
    if (!version) {
      return res.status(404).json({ error: "Version not found" });
    }

    const parsedData = JSON.parse(version.data);
    res.json({
      ...version,
      data: parsedData,
      accentColor: version.accent_color,
      fontFamily: version.font_family
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch version details" });
  }
});

router.delete("/:id/versions/:versionId", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  try {
    // First verify the user owns the resume
    const userResumes = await db.select({ id: resumes.id }).from(resumes).where(and(eq(resumes.id, req.params.id), eq(resumes.user_id, userId)));
    const resume = userResumes[0];
    if (!resume) {
      return res.status(404).json({ error: "Resume not found" });
    }

    await db.delete(resumeVersions).where(and(eq(resumeVersions.id, req.params.versionId), eq(resumeVersions.resume_id, req.params.id)));
    res.json({ success: true });
  } catch (error) {
    console.error("Delete version error:", error);
    res.status(500).json({ error: "Failed to delete version" });
  }
});

const PostRevertResumeSchema = z.object({
  versionId: z.string().max(100)
});

router.post("/:id/revert", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  try {
    const { versionId } = PostRevertResumeSchema.parse(req.body);
    const versions = await db.select().from(resumeVersions).where(and(eq(resumeVersions.id, versionId), eq(resumeVersions.resume_id, req.params.id)));
    const version = versions[0];
    
    if (!version) {
      return res.status(404).json({ error: "Version not found" });
    }

    await db.update(resumes).set({
      data: version.data,
      template: version.template,
      accent_color: version.accent_color,
      font_family: version.font_family,
      updated_at: new Date()
    }).where(and(eq(resumes.id, req.params.id), eq(resumes.user_id, userId)));

    // Save the reverted state as a new version
    const newVersionId = `ver_${crypto.randomUUID()}`;
    await db.insert(resumeVersions).values({
      id: newVersionId,
      resume_id: req.params.id,
      data: version.data,
      template: version.template,
      accent_color: version.accent_color,
      font_family: version.font_family,
    });

    // Limit versions per resume
    const oldVersions = await db.select({ id: resumeVersions.id }).from(resumeVersions).where(eq(resumeVersions.resume_id, req.params.id)).orderBy(desc(resumeVersions.created_at)).offset(config.resume.maxVersions);
    if (oldVersions.length > 0) {
      const idsToDelete = oldVersions.map(v => v.id);
      await db.delete(resumeVersions).where(inArray(resumeVersions.id, idsToDelete));
    }

    const updatedResumes = await db.select().from(resumes).where(eq(resumes.id, req.params.id));
    const updated = updatedResumes[0];
    if (updated) {
      const parsedData = JSON.parse(updated.data);
      res.json({
        ...updated,
        data: parsedData,
        accentColor: updated.accent_color,
        fontFamily: updated.font_family
      });
    } else {
      res.json(updated);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.issues });
    }
    console.error("Revert resume error:", error);
    res.status(500).json({ error: "Failed to revert resume" });
  }
});

export default router;
