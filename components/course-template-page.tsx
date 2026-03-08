"use client"

import { useMemo, useRef, useState } from "react"
import type { ParsedCoursePage } from "@/lib/course-html-parser"

type CourseTemplatePageProps = {
  data: ParsedCoursePage
}

export function CourseTemplatePage({ data }: CourseTemplatePageProps) {
  const initialPanel = data.panels[0]?.key ?? ""
  const [activePanel, setActivePanel] = useState(initialPanel)
  const trackRef = useRef<HTMLDivElement>(null)

  const visiblePanel = useMemo(
    () => data.panels.find((panel) => panel.key === activePanel) ?? data.panels[0],
    [activePanel, data.panels]
  )

  const scrollTrack = (direction: -1 | 1) => {
    const track = trackRef.current
    if (!track) return
    const card = track.querySelector<HTMLElement>(".edu-card")
    const gap = 16
    const amount = (card?.getBoundingClientRect().width ?? 240) + gap
    track.scrollBy({ left: direction * amount, behavior: "smooth" })
  }

  return (
    <main className="page edu">
      <section className="edu__head">
        <h1 className="edu__title">{data.pageTitle}</h1>
        <div className="edu__subhead">{data.pageSubhead}</div>
        <p className="edu__desc">{data.pageDescription}</p>
      </section>

      <nav className="edu__tabs" aria-label="Course filters">
        {data.tabs.map((tab, index) => {
          const key = data.panels[index]?.key ?? tab.toLowerCase()
          const isActive = key === activePanel
          return (
            <button
              key={key}
              className={`edu__tab${isActive ? " is-active" : ""}`}
              type="button"
              onClick={() => setActivePanel(key)}
            >
              {tab}
            </button>
          )
        })}
      </nav>

      <section className="edu__carouselWrap" aria-label="Course list">
        <div className="edu__carousel is-active" data-panel={visiblePanel?.key ?? ""}>
          <button
            className="edu__nav edu__nav--prev"
            type="button"
            aria-label="Previous"
            onClick={() => scrollTrack(-1)}
          >
            ‹
          </button>
          <div ref={trackRef} className="edu__track">
            {visiblePanel?.cards.map((card, cardIndex) => (
              <article key={`${visiblePanel.key}-${card.title}-${cardIndex}`} className="edu-card">
                <div className={card.thumbClass} />
                <h3 className="edu-card__title">{card.title}</h3>
                <div className="edu-card__meta">{card.meta}</div>
                <div className="edu-card__rating">{card.rating}</div>
                <div className="edu-card__price">{card.price}</div>
                {card.badges.length > 0 ? (
                  <div className="edu-card__badges">
                    {card.badges.map((badge, badgeIndex) => (
                      <span key={`${card.title}-${badge}-${badgeIndex}`} className="edu-badge edu-badge--best">
                        {badge}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
          <button className="edu__nav edu__nav--next" type="button" aria-label="Next" onClick={() => scrollTrack(1)}>
            ›
          </button>
        </div>
      </section>

      <section className="edu__featured">
        <h2 className="edu__featuredTitle">{data.featuredTitle}</h2>
        <p className="edu__featuredDesc">{data.featuredDescription}</p>
        <div className="edu-feature">
          <div className={data.featured.thumbClass} />
          <div className="edu-feature__body">
            <h3>{data.featured.title}</h3>
            <p>{data.featured.description}</p>
            {data.featured.metaLines.map((line, lineIndex) => (
              <div key={`${line}-${lineIndex}`} className="edu-feature__meta">
                {line}
              </div>
            ))}
            <div className="edu-card__rating">{data.featured.rating}</div>
            <div className="edu-card__badges">
              {data.featured.badges.map((badge, badgeIndex) => (
                <span key={`featured-${badge}-${badgeIndex}`} className="edu-badge edu-badge--best">
                  {badge}
                </span>
              ))}
            </div>
            <div className="edu-card__price">{data.featured.price}</div>
          </div>
        </div>
      </section>

      <section className="edu__topics">
        <h2 className="edu__sectionTitle">Popular topics</h2>
        <div className="edu__topicGrid">
          {data.topics.map((topic, topicIndex) => (
            <button key={`${topic}-${topicIndex}`} className="edu__topic">
              {topic}
            </button>
          ))}
        </div>
      </section>

      <section className="edu__instructors">
        <h2 className="edu__sectionTitle">{data.instructorsTitle}</h2>
        <p className="edu__sectionDesc">{data.instructorsDescription}</p>
        <div className="edu__instructorGrid">
          {data.instructors.map((instructor, instructorIndex) => (
            <article key={`${instructor.name}-${instructorIndex}`} className="edu-instructor">
              <div className="edu-instructor__row">
                <div className={instructor.avatarClass} />
                <div>
                  <div className="edu-instructor__name">{instructor.name}</div>
                  <div className="edu-instructor__meta">{instructor.meta}</div>
                </div>
              </div>
              {instructor.stats.map((stat, statIndex) => (
                <div key={`${instructor.name}-${stat}-${statIndex}`} className="edu-instructor__meta">
                  {stat}
                </div>
              ))}
            </article>
          ))}
        </div>
      </section>

      <section className="edu__all">
        <h2 className="edu__sectionTitle">{data.allCoursesTitle}</h2>
        <div className="edu__notice">
          <span className="edu__noticeIcon">i</span>
          <span>{data.notice}</span>
        </div>

        <div className="edu__toolbar">
          <button className="edu__filterBtn" type="button">
            Filter
          </button>
          <div className="edu__sort">
            <div className="edu__sortLabel">Sort by</div>
            <button className="edu__sortBtn" type="button">
              {data.sortBy}
            </button>
          </div>
          <div className="edu__results">{data.resultsCount}</div>
        </div>

        <div className="edu__allLayout">
          <aside className="edu__filters">
            {data.filters.map((filter, filterIndex) => (
              <div key={`${filter.title || "filter"}-${filterIndex}`} className="edu-filter">
                <div className="edu-filter__title">{filter.title}</div>
                {filter.options.map((option, optionIndex) => (
                  <label key={`${filter.title || "filter"}-${option}-${optionIndex}`} className="edu-check">
                    <input type="checkbox" /> {option}
                  </label>
                ))}
              </div>
            ))}
          </aside>

          <div className="edu__resultsList">
            {data.rows.map((row, rowIndex) => (
              <article key={`${row.title}-${rowIndex}`} className="edu-row">
                <div className={row.thumbClass} />
                <div className="edu-row__body">
                  <div className="edu-row__title">{row.title}</div>
                  <div className="edu-row__text">{row.text}</div>
                  {row.meta.map((line, lineIndex) => (
                    <div key={`${row.title}-${line}-${lineIndex}`} className="edu-row__meta">
                      {line}
                    </div>
                  ))}
                  <div className="edu-row__rating">{row.rating}</div>
                  <div className="edu-card__badges">
                    {row.badges.map((badge, badgeIndex) => (
                      <span key={`${row.title}-${badge}-${badgeIndex}`} className="edu-badge edu-badge--best">
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="edu-row__price">{row.price}</div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
