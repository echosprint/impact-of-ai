export const SITE_CONFIG = {
  bookTitle: "智能陷阱",
  description: "深入探讨人工智能对经济结构的冲击以及需求坍缩现象的分析",
  author: "乔迁",
  url: "https://echosprint.github.io/impact-of-ai",
  locale: "zh-CN",
} as const;

export type SiteConfig = typeof SITE_CONFIG; 
