import { z } from "zod";

export const readinessCategorySchema = z.enum([
  "readable",
  "discoverable",
  "callable",
  "interactive",
  "secure",
  "payable",
]);
export type ReadinessCategory = z.infer<typeof readinessCategorySchema>;

export const readinessStatusSchema = z.enum([
  "pass",
  "partial",
  "fail",
  "not_applicable",
  "unknown",
]);
export type ReadinessStatus = z.infer<typeof readinessStatusSchema>;

export const readinessSeveritySchema = z.enum(["info", "low", "medium", "high", "critical"]);
export type ReadinessSeverity = z.infer<typeof readinessSeveritySchema>;

export const readinessEvidenceSchema = z.object({
  url: z.string().url().optional(),
  httpStatus: z.number().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  contentMetadata: z.record(z.string(), z.unknown()).optional(),
  snippet: z.string().optional(),
});
export type ReadinessEvidence = z.infer<typeof readinessEvidenceSchema>;

export const readinessCheckSchema = z.object({
  checkId: z.string(),
  name: z.string(),
  category: readinessCategorySchema,
  status: readinessStatusSchema,
  severity: readinessSeveritySchema,
  standard: z.string().optional(),
  version: z.string().optional(),
  evidence: z.array(readinessEvidenceSchema).default([]),
  observedAt: z.string().datetime(),
  recommendation: z.string().optional(),
  reason: z.string(),
});
export type ReadinessCheck = z.infer<typeof readinessCheckSchema>;

export const readinessReportSchema = z.object({
  targetUrl: z.string().url(),
  generatedAt: z.string().datetime(),
  checks: z.array(readinessCheckSchema),
});
export type ReadinessReport = z.infer<typeof readinessReportSchema>;
