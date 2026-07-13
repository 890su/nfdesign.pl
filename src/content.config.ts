import { defineCollection } from "astro:content";
import { file } from "astro/loaders";
import { z } from "astro/zod";

const localizedString = z.string().min(1);

const segments = defineCollection({
  loader: file("src/content/segments.json"),
  schema: z.object({
    translationKey: z.string(),
    locale: z.enum(["pl", "uk", "ru"]),
    segment: z.enum(["new_build", "small_flat", "rental"]),
    slug: z.string(),
    seo: z.object({ title: localizedString, description: localizedString }),
    nav: z.object({
      method: localizedString,
      result: localizedString,
      price: localizedString,
      faq: localizedString,
    }),
    hero: z.object({
      eyebrow: localizedString,
      title: localizedString,
      lead: localizedString,
      benefits: z.array(localizedString).length(3),
      cta: localizedString,
      secondaryCta: localizedString,
    }),
    proof: z.object({
      label: localizedString,
      value: localizedString,
      note: localizedString,
    }),
    pains: z.object({
      eyebrow: localizedString,
      title: localizedString,
      items: z
        .array(
          z.object({
            number: z.string(),
            title: localizedString,
            text: localizedString,
          }),
        )
        .min(3),
    }),
    deliverables: z.object({
      eyebrow: localizedString,
      title: localizedString,
      items: z
        .array(z.object({ title: localizedString, text: localizedString }))
        .min(4),
    }),
    example: z.object({
      eyebrow: localizedString,
      title: localizedString,
      text: localizedString,
      before: localizedString,
      after: localizedString,
      disclaimer: localizedString,
      notes: z.array(localizedString).length(3),
    }),
    process: z.object({
      eyebrow: localizedString,
      title: localizedString,
      items: z
        .array(z.object({ title: localizedString, text: localizedString }))
        .length(4),
    }),
    package: z.object({
      eyebrow: localizedString,
      title: localizedString,
      priceLabel: localizedString,
      price: z.number(),
      currency: z.literal("zł"),
      duration: localizedString,
      includedTitle: localizedString,
      included: z.array(localizedString),
      excludedTitle: localizedString,
      excluded: z.array(localizedString),
      cta: localizedString,
    }),
    comparison: z.object({
      title: localizedString,
      express: localizedString,
      full: localizedString,
      rows: z.array(
        z.object({
          label: localizedString,
          express: localizedString,
          full: localizedString,
        }),
      ),
    }),
    expert: z.object({
      eyebrow: localizedString,
      title: localizedString,
      text: localizedString,
      points: z.array(localizedString).length(3),
      aiNote: localizedString,
    }),
    faq: z.object({
      eyebrow: localizedString,
      title: localizedString,
      items: z
        .array(z.object({ question: localizedString, answer: localizedString }))
        .min(5),
    }),
    form: z.object({
      eyebrow: localizedString,
      title: localizedString,
      lead: localizedString,
      objectLabel: localizedString,
      objectOptions: z.array(localizedString).length(3),
      areaLabel: localizedString,
      stageLabel: localizedString,
      stageOptions: z.array(localizedString).length(3),
      nameLabel: localizedString,
      contactLabel: localizedString,
      contactHint: localizedString,
      fileLabel: localizedString,
      fileHint: localizedString,
      messageLabel: localizedString,
      consent: localizedString,
      submit: localizedString,
      sending: localizedString,
      successTitle: localizedString,
      successText: localizedString,
      error: localizedString,
    }),
    footer: z.object({
      note: localizedString,
      privacy: localizedString,
      terms: localizedString,
    }),
  }),
});

export const collections = { segments };
