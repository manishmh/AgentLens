import { z } from "zod";
import { findingSchema } from "./run";

export const competitorMetricsSchema = z.object({
  discoveryRate: z.number().min(0).max(1),
  recommendationRate: z.number().min(0).max(1),
  pageVisits: z.number().nonnegative(),
});
export type CompetitorMetrics = z.infer<typeof competitorMetricsSchema>;

export const experimentResultSchema = z.object({
  experimentId: z.string(),
  target: z.string(),
  competitors: z.array(z.string()),
  runCounts: z.object({
    total: z.number().nonnegative(),
    valid: z.number().nonnegative(),
    invalid: z.number().nonnegative(),
  }),
  overallMetrics: z.object({
    taskSuccessRate: z.number().min(0).max(1),
  }),
  customerMetrics: competitorMetricsSchema,
  competitorMetrics: z.record(z.string(), competitorMetricsSchema),
  sourceFrequency: z.record(z.string(), z.number().nonnegative()),
  findings: z.array(findingSchema),
  evaluatedAt: z.string().datetime(),
});
export type ExperimentResult = z.infer<typeof experimentResultSchema>;
