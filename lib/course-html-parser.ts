export type CourseCard = {
  thumbClass: string
  title: string
  meta: string
  rating: string
  price: string
  badges: string[]
}

export type CourseCarouselPanel = {
  key: string
  cards: CourseCard[]
}

export type FeaturedCourse = {
  thumbClass: string
  title: string
  description: string
  metaLines: string[]
  rating: string
  badges: string[]
  price: string
}

export type Instructor = {
  avatarClass: string
  name: string
  meta: string
  stats: string[]
}

export type FilterGroup = {
  title: string
  options: string[]
}

export type ResultRow = {
  thumbClass: string
  title: string
  text: string
  meta: string[]
  rating: string
  badges: string[]
  price: string
}

export type ParsedCoursePage = {
  bodyClassName: string
  pageTitle: string
  pageSubhead: string
  pageDescription: string
  tabs: string[]
  panels: CourseCarouselPanel[]
  featuredTitle: string
  featuredDescription: string
  featured: FeaturedCourse
  topics: string[]
  instructorsTitle: string
  instructorsDescription: string
  instructors: Instructor[]
  allCoursesTitle: string
  notice: string
  sortBy: string
  resultsCount: string
  filters: FilterGroup[]
  rows: ResultRow[]
}

function decodeHtml(text: string) {
  return text
    .replaceAll("&amp;", "&")
    .replaceAll("&#39;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&nbsp;", " ")
    .trim()
}

function normalize(text: string) {
  return decodeHtml(text.replace(/\s+/g, " ").trim())
}

function pickOne(source: string, regex: RegExp, fallback = "") {
  const match = source.match(regex)
  if (!match) return fallback
  return normalize(match[1] ?? fallback)
}

function pickRaw(source: string, regex: RegExp, fallback = "") {
  const match = source.match(regex)
  if (!match) return fallback
  return (match[1] ?? fallback).trim()
}

function pickAll(source: string, regex: RegExp) {
  const values: string[] = []
  for (const match of source.matchAll(regex)) {
    values.push(normalize(match[1] ?? ""))
  }
  return values.filter(Boolean)
}

function pickClass(source: string, regex: RegExp, fallback = "") {
  const match = source.match(regex)
  if (!match) return fallback
  return (match[1] ?? fallback).trim()
}

function splitBlocks(source: string, regex: RegExp) {
  const blocks: string[] = []
  for (const match of source.matchAll(regex)) {
    if (match[1]) blocks.push(match[1])
  }
  return blocks
}

function parseCard(cardHtml: string): CourseCard {
  const thumbClass = pickClass(cardHtml, /<div class="([^"]*edu-card__thumb[^"]*)"/i, "edu-card__thumb")
  const title = pickOne(cardHtml, /<h3 class="edu-card__title">([\s\S]*?)<\/h3>/i)
  const meta = pickOne(cardHtml, /<div class="edu-card__meta">([\s\S]*?)<\/div>/i)
  const rating = pickOne(cardHtml, /<div class="edu-card__rating">([\s\S]*?)<\/div>/i)
  const price = pickOne(cardHtml, /<div class="edu-card__price">([\s\S]*?)<\/div>/i, "Free")
  const badges = pickAll(cardHtml, /<span class="edu-badge[^"]*">([\s\S]*?)<\/span>/gi)

  return { thumbClass, title, meta, rating, price, badges }
}

function parseFeatured(featuredHtml: string): FeaturedCourse {
  const thumbClass = pickClass(featuredHtml, /<div class="([^"]*edu-feature__thumb[^"]*)"/i, "edu-feature__thumb")
  const title = pickOne(featuredHtml, /<h3>([\s\S]*?)<\/h3>/i)
  const description = pickOne(featuredHtml, /<p>([\s\S]*?)<\/p>/i)
  const metaLines = pickAll(featuredHtml, /<div class="edu-feature__meta">([\s\S]*?)<\/div>/gi)
  const rating = pickOne(featuredHtml, /<div class="edu-card__rating">([\s\S]*?)<\/div>/i)
  const badges = pickAll(featuredHtml, /<span class="edu-badge[^"]*">([\s\S]*?)<\/span>/gi)
  const price = pickOne(featuredHtml, /<div class="edu-card__price">([\s\S]*?)<\/div>/i, "Free")

  return { thumbClass, title, description, metaLines, rating, badges, price }
}

function parseInstructor(blockHtml: string): Instructor {
  const avatarClass = pickClass(blockHtml, /<div class="([^"]*edu-instructor__avatar[^"]*)"/i, "edu-instructor__avatar")
  const name = pickOne(blockHtml, /<div class="edu-instructor__name">([\s\S]*?)<\/div>/i)
  const metaLines = pickAll(blockHtml, /<div class="edu-instructor__meta">([\s\S]*?)<\/div>/gi)
  const ratingLine = pickOne(blockHtml, /<div class="edu-instructor__stats">([\s\S]*?)<\/div>/i)
  const meta = metaLines[0] ?? ""
  const stats = [ratingLine, ...metaLines.slice(1)].filter(Boolean)

  return { avatarClass, name, meta, stats }
}

function parseResultRow(rowHtml: string): ResultRow {
  const thumbClass = pickClass(rowHtml, /<div class="([^"]*edu-row__thumb[^"]*)"/i, "edu-row__thumb")
  const title = pickOne(rowHtml, /<div class="edu-row__title">([\s\S]*?)<\/div>/i)
  const text = pickOne(rowHtml, /<div class="edu-row__text">([\s\S]*?)<\/div>/i)
  const meta = pickAll(rowHtml, /<div class="edu-row__meta">([\s\S]*?)<\/div>/gi)
  const rating = pickOne(rowHtml, /<div class="edu-row__rating">([\s\S]*?)<\/div>/i)
  const badges = pickAll(rowHtml, /<span class="edu-badge[^"]*">([\s\S]*?)<\/span>/gi)
  const price = pickOne(rowHtml, /<div class="edu-row__price">([\s\S]*?)<\/div>/i, "Free")

  return { thumbClass, title, text, meta, rating, badges, price }
}

export function parseCourseHtml(html: string): ParsedCoursePage {
  const bodyClassName = pickClass(html, /<body[^>]*class="([^"]*)"/i)
  const pageTitle = pickOne(html, /<h1 class="edu__title">([\s\S]*?)<\/h1>/i)
  const pageSubhead = pickOne(html, /<div class="edu__subhead">([\s\S]*?)<\/div>/i)
  const pageDescription = pickOne(html, /<p class="edu__desc">([\s\S]*?)<\/p>/i)

  const tabs = pickAll(html, /<button class="edu__tab[^"]*"[^>]*>([\s\S]*?)<\/button>/gi)
  const panelBlocks = Array.from(
    html.matchAll(/<div class="edu__carousel[^"]*" data-panel="([^"]+)">([\s\S]*?)<\/div>\s*(?=<div class="edu__carousel|<\/section>)/gi)
  )
  const panels: CourseCarouselPanel[] = panelBlocks.map((match) => {
    const key = normalize(match[1] ?? "")
    const block = match[2] ?? ""
    const cards = splitBlocks(block, /<article class="edu-card">([\s\S]*?)<\/article>/gi).map(parseCard)
    return { key, cards }
  })

  const featuredTitle = pickOne(html, /<h2 class="edu__featuredTitle">([\s\S]*?)<\/h2>/i)
  const featuredDescription = pickOne(html, /<p class="edu__featuredDesc">([\s\S]*?)<\/p>/i)
  const featuredBlock = pickRaw(html, /<div class="edu-feature">([\s\S]*?)<\/div>\s*<\/section>/i)
  const featured = parseFeatured(featuredBlock)

  const topics = pickAll(html, /<button class="edu__topic">([\s\S]*?)<\/button>/gi)
  const instructorsTitle = pickOne(html, /<section class="edu__instructors">[\s\S]*?<h2 class="edu__sectionTitle">([\s\S]*?)<\/h2>/i)
  const instructorsDescription = pickOne(html, /<p class="edu__sectionDesc">([\s\S]*?)<\/p>/i)
  const instructors = splitBlocks(html, /<article class="edu-instructor">([\s\S]*?)<\/article>/gi).map(parseInstructor)

  const allCoursesTitle = pickOne(html, /<section class="edu__all">[\s\S]*?<h2 class="edu__sectionTitle">([\s\S]*?)<\/h2>/i)
  const notice = pickOne(html, /<div class="edu__notice">[\s\S]*?<span class="edu__noticeIcon">[\s\S]*?<\/span>\s*<span>([\s\S]*?)<\/span>[\s\S]*?<\/div>/i)
  const sortBy = pickOne(html, /<button class="edu__sortBtn" type="button">([\s\S]*?)<\/button>/i)
  const resultsCount = pickOne(html, /<div class="edu__results">([\s\S]*?)<\/div>/i)

  const filterBlocks = splitBlocks(html, /<div class="edu-filter">([\s\S]*?)<\/div>/gi)
  const filters: FilterGroup[] = filterBlocks.map((block) => ({
    title: pickOne(block, /<div class="edu-filter__title">([\s\S]*?)<\/div>/i),
    options: splitBlocks(block, /<label class="edu-check">([\s\S]*?)<\/label>/gi).map((option) =>
      normalize(option.replace(/<[^>]+>/g, ""))
    ),
  }))

  const rows = splitBlocks(html, /<article class="edu-row">([\s\S]*?)<\/article>/gi).map(parseResultRow)

  return {
    bodyClassName,
    pageTitle,
    pageSubhead,
    pageDescription,
    tabs,
    panels,
    featuredTitle,
    featuredDescription,
    featured,
    topics,
    instructorsTitle,
    instructorsDescription,
    instructors,
    allCoursesTitle,
    notice,
    sortBy,
    resultsCount,
    filters,
    rows,
  }
}
