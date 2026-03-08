export type CourseTopicReference = {
  label: string
  slug: string
  referenceHtml: string
}

export type CourseCategoryReference = {
  label: string
  slug: string
  topics: CourseTopicReference[]
}

export const COURSE_CATEGORIES: CourseCategoryReference[] = [
  {
    label: "Education",
    slug: "education",
    topics: [
      { label: "Learning Strategies", slug: "learning-strategies", referenceHtml: "inserts/courses/education/learning-strategies.html" },
      { label: "K-12 Resources", slug: "k-12-resources", referenceHtml: "inserts/courses/education/k-12-resources.html" },
      { label: "Higher Education", slug: "higher-education", referenceHtml: "inserts/courses/education/higher-education.html" },
      { label: "Teaching Tools", slug: "teaching-tools", referenceHtml: "inserts/courses/education/teaching-tools.html" },
      { label: "Student Success", slug: "student-success", referenceHtml: "inserts/courses/education/student-success.html" },
    ],
  },
  {
    label: "Business",
    slug: "business",
    topics: [
      { label: "Entrepreneurship", slug: "entrepreneurship", referenceHtml: "inserts/courses/business/entpreneurship.html" },
      { label: "Management", slug: "management", referenceHtml: "inserts/courses/business/management.html" },
      { label: "Sales", slug: "sales", referenceHtml: "inserts/courses/business/sales.html" },
      { label: "Leadership", slug: "leadership", referenceHtml: "inserts/courses/business/leadership.html" },
      { label: "Business Strategy", slug: "business-strategy", referenceHtml: "inserts/courses/business/business-strategy.html" },
    ],
  },
  {
    label: "Accounting & Finance",
    slug: "accounting-and-finance",
    topics: [
      { label: "Bookkeeping", slug: "bookkeeping", referenceHtml: "inserts/courses/accounting-and-finance/bookkeeping.html" },
      { label: "Financial Analysis", slug: "financial-analysis", referenceHtml: "inserts/courses/accounting-and-finance/financial-analysis.html" },
      { label: "Corporate Finance", slug: "corporate-finance", referenceHtml: "inserts/courses/accounting-and-finance/corporate-finance.html" },
      { label: "Investment", slug: "investment", referenceHtml: "inserts/courses/accounting-and-finance/investment.html" },
      { label: "Tax", slug: "tax", referenceHtml: "inserts/courses/accounting-and-finance/tax.html" },
    ],
  },
  {
    label: "IT & Software",
    slug: "it-and-software",
    topics: [
      { label: "Cloud Computing", slug: "cloud-computing", referenceHtml: "inserts/courses/it-and-software/cloud-computing.html" },
      { label: "Cybersecurity", slug: "cybersecurity", referenceHtml: "inserts/courses/it-and-software/cybersecurity.html" },
      { label: "IT Support", slug: "it-support", referenceHtml: "inserts/courses/it-and-software/it-support.html" },
      { label: "DevOps", slug: "dev-ops", referenceHtml: "inserts/courses/it-and-software/dev-ops.html" },
      { label: "Networking", slug: "networking", referenceHtml: "inserts/courses/it-and-software/networking.html" },
    ],
  },
  {
    label: "Design",
    slug: "design",
    topics: [
      { label: "UI/UX Design", slug: "ui-ux-design", referenceHtml: "inserts/courses/design/ui-ux-design.html" },
      { label: "Graphic Design", slug: "graphic-design", referenceHtml: "inserts/courses/design/graphic-design.html" },
      { label: "Illustration", slug: "illustration", referenceHtml: "inserts/courses/design/illustration.html" },
      { label: "Design Systems", slug: "design-systems", referenceHtml: "inserts/courses/design/design-systems.html" },
      { label: "3D Design", slug: "3d-design", referenceHtml: "inserts/courses/design/3d-design.html" },
    ],
  },
  {
    label: "Office Productivity",
    slug: "office-productivity",
    topics: [
      { label: "Excel", slug: "excel", referenceHtml: "inserts/courses/office-productivity/excel.html" },
      { label: "Google Workspace", slug: "google-workspace", referenceHtml: "inserts/courses/office-productivity/google-workspace.html" },
      { label: "Project Planning", slug: "project-planning", referenceHtml: "inserts/courses/office-productivity/project-planning.html" },
      { label: "Time Management", slug: "time-management", referenceHtml: "inserts/courses/office-productivity/time-management.html" },
      { label: "Documentation", slug: "documentation", referenceHtml: "inserts/courses/office-productivity/documentation.html" },
    ],
  },
  {
    label: "Marketing",
    slug: "marketing",
    topics: [
      { label: "Digital Marketing", slug: "digital-marketing", referenceHtml: "inserts/courses/marketing/digital-marketing.html" },
      { label: "Content Strategy", slug: "content-strategy", referenceHtml: "inserts/courses/marketing/content-strategy.html" },
      { label: "SEO", slug: "seo", referenceHtml: "inserts/courses/marketing/seo.html" },
      { label: "Branding", slug: "branding", referenceHtml: "inserts/courses/marketing/branding.html" },
      { label: "Analytics", slug: "analytics", referenceHtml: "inserts/courses/marketing/analytics.html" },
    ],
  },
  {
    label: "Development",
    slug: "development",
    topics: [
      { label: "Web Development", slug: "web-development", referenceHtml: "inserts/courses/development/web-development.html" },
      { label: "Mobile Development", slug: "mobile-development", referenceHtml: "inserts/courses/development/mobile-development.html" },
      { label: "Programming Languages", slug: "programming-languages", referenceHtml: "inserts/courses/development/programming-languages.html" },
      { label: "Game Development", slug: "game-development", referenceHtml: "inserts/courses/development/game-development.html" },
      { label: "Database Design & Development", slug: "database-design-and-development", referenceHtml: "inserts/courses/development/database-design-and-development.html" },
      { label: "Software Testing", slug: "software-testing", referenceHtml: "inserts/courses/development/software-testing.html" },
    ],
  },
  {
    label: "Health & Fitness",
    slug: "health-and-fitness",
    topics: [
      { label: "Nutrition", slug: "nutrition", referenceHtml: "inserts/courses/health-and-fitness/nutrition.html" },
      { label: "Yoga", slug: "yoga", referenceHtml: "inserts/courses/health-and-fitness/yoga.html" },
      { label: "Mental Wellness", slug: "mental-wellness", referenceHtml: "inserts/courses/health-and-fitness/mental-wellness.html" },
      { label: "Fitness Training", slug: "fitness-training", referenceHtml: "inserts/courses/health-and-fitness/fitness-training.html" },
      { label: "Health Coaching", slug: "health-coaching", referenceHtml: "inserts/courses/health-and-fitness/health-coaching.html" },
    ],
  },
  {
    label: "Music",
    slug: "music",
    topics: [
      { label: "Music Production", slug: "music-production", referenceHtml: "inserts/courses/music/music-production.html" },
      { label: "Guitar", slug: "guitar", referenceHtml: "inserts/courses/music/guitar.html" },
      { label: "Piano", slug: "piano", referenceHtml: "inserts/courses/music/piano.html" },
      { label: "Music Theory", slug: "music-theory", referenceHtml: "inserts/courses/music/music-theory.html" },
      { label: "Sound Design", slug: "sound-design", referenceHtml: "inserts/courses/music/sound-design.html" },
    ],
  },
]

export function getCourseCategory(categorySlug: string) {
  return COURSE_CATEGORIES.find((category) => category.slug === categorySlug) ?? null
}

export function getCourseTopic(categorySlug: string, topicSlug: string) {
  const category = getCourseCategory(categorySlug)
  if (!category) {
    return null
  }

  const topic = category.topics.find((item) => item.slug === topicSlug) ?? null
  return topic ? { category, topic } : null
}
