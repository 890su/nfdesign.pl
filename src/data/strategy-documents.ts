import businessStrategy from "../content/strategy/business_strategy.md?raw";
import roadmap from "../content/strategy/ROADMAP.md?raw";
import plan from "../content/strategy/PLAN.md?raw";
import launchChecklist from "../content/strategy/LAUNCH_CHECKLIST.md?raw";
import mvpReadme from "../content/strategy/README.md?raw";

export interface StrategyDocument {
  slug: string;
  title: string;
  subtitle: string;
  source: string;
  content: string;
}

export const strategyDocuments: StrategyDocument[] = [
  {
    slug: "business-strategy",
    title: "Бизнес-стратегия",
    subtitle: "Позиционирование, продукт, сегменты и экономика MVP.",
    source: "src/content/strategy/business_strategy.md",
    content: businessStrategy,
  },
  {
    slug: "roadmap",
    title: "Roadmap",
    subtitle: "Этапы запуска, развития продукта и контрольные метрики.",
    source: "src/content/strategy/ROADMAP.md",
    content: roadmap,
  },
  {
    slug: "plan",
    title: "План внедрения",
    subtitle: "12-недельный рабочий план для первых трёх сегментов.",
    source: "src/content/strategy/PLAN.md",
    content: plan,
  },
  {
    slug: "launch-checklist",
    title: "MVP launch checklist",
    subtitle: "Роли, готовность продукта, реклама, аналитика и запуск.",
    source: "src/content/strategy/LAUNCH_CHECKLIST.md",
    content: launchChecklist,
  },
  {
    slug: "mvp-overview",
    title: "MVP: обзор",
    subtitle: "Цель, воронка, языки, сегменты и условия успеха.",
    source: "src/content/strategy/README.md",
    content: mvpReadme,
  },
];

export const getStrategyDocument = (slug: string) =>
  strategyDocuments.find((document) => document.slug === slug);
