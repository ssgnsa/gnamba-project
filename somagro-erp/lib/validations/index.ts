import { z } from "zod";

export const tenantSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
});

export type TenantInput = z.infer<typeof tenantSchema>;
