import { z } from "zod";

export const newsletterSubscriptionSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "Comparte tu nombre para personalizar la suscripcion.")
    .max(120, "Usa un nombre mas corto."),
  email: z
    .string()
    .trim()
    .email("Ingresa un email valido."),
  acceptedMarketing: z.boolean().refine((value) => value, {
    message: "Necesitamos tu consentimiento para guardar esta suscripcion.",
  }),
});

export type NewsletterSubscriptionValues = z.infer<typeof newsletterSubscriptionSchema>;
