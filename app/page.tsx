"use client"

import Link from "next/link"
import { useEffect, type MouseEvent } from "react"
import styles from "./page.module.css"

const categories = [
  ["💻", "Web Development", "Build modern websites and web applications."],
  ["📊", "Data Science", "Analyze data and build ML models."],
  ["🎨", "UI/UX Design", "Create beautiful user experiences."],
  ["💼", "Business", "Grow your career and business."],
  ["📣", "Digital Marketing", "Master SEO, social media, and ads."],
  ["📱", "Mobile Development", "Build iOS and Android apps."],
  ["☁️", "Cloud & DevOps", "AWS, Azure, Docker, Kubernetes."],
  ["📷", "Photography", "Capture stunning images."],
]

const featuredCourses = [
  {
    image: "https://i.ytimg.com/vi/rLf3jnHxSmU/hqdefault.jpg",
    category: "WEB DEVELOPMENT",
    title: "JavaScript Tutorial for Beginner",
    author: "Sarah Johnson",
    initials: "SJ",
    stats: "⭐ 4.8  235K students  478 lessons",
  },
  {
    image: "https://i.ytimg.com/vi/18c3MTX0PK0/hqdefault.jpg",
    category: "DATA SCIENCE",
    title: "C Programming - Features & The First C Program",
    author: "Neso Academy",
    initials: "NA",
    stats: "⭐ 4.7  178K students  312 lessons",
  },
  {
    image: "https://i.ytimg.com/vi/18c3MTX0PK0/hqdefault.jpg",
    category: "UI/UX DESIGN",
    title: "C++ Tutorial (The Cherno Playlist)",
    author: "Emily Rodriguez",
    initials: "ER",
    stats: "⭐ 4.9  89K students  245 lessons",
  },
  {
    image: "https://i.ytimg.com/vi/_uQrJ0TkZlc/hqdefault.jpg",
    category: "CLOUD & DEVOPS",
    title: "Python Tutorial for Beginners",
    author: "David Kim",
    initials: "DK",
    stats: "⭐ 4.8  157K students  380 lessons",
  },
]

const experts = [
  ["Kenji Yonaha", "Full Stack Developer"],
  ["Alessandra Rivano", "UI/UX Designer"],
  ["Fate Caraan", "UI/UX Designer"],
  ["Cedrick Masculino", "Manuscript Editor"],
  ["Trisha Ogbac", "Manuscript Editor"],
  ["Nelson Villanueva", "Manuscript Editor"],
]

export default function LandingPage() {
  const handleNavClick = (e: MouseEvent<HTMLAnchorElement>) => {
    const href = e.currentTarget.getAttribute("href")
    if (!href?.startsWith("#")) return
    const target = document.querySelector<HTMLElement>(href)
    if (!target) return

    e.preventDefault()
    const headerOffset = 76
    const y = target.getBoundingClientRect().top + window.scrollY - headerOffset
    window.scrollTo({ top: y, behavior: "smooth" })
  }

  useEffect(() => {
    const items = document.querySelectorAll<HTMLElement>("[data-reveal]")
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const el = entry.target as HTMLElement
          const delay = el.dataset.delay || "0"
          el.style.transitionDelay = `${delay}ms`
          el.classList.add(styles.visible)
          observer.unobserve(el)
        })
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    )

    items.forEach((item) => observer.observe(item))
    return () => observer.disconnect()
  }, [])

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <div className={styles.topInner}>
          <Link href="/" className={styles.brand} aria-label="Home">
            <img src="/R.png" alt="MINSU" className={styles.logo} />
          </Link>

          <nav className={styles.nav} aria-label="Homepage links">
            <a href="#browse-categories" onClick={handleNavClick}>
              Categories
            </a>
            <a href="#featured-courses" onClick={handleNavClick}>
              Library
            </a>
            <a href="#about-minsu" onClick={handleNavClick}>
              About
            </a>
            <a href="#expert-developers" onClick={handleNavClick}>
              Experts
            </a>
          </nav>

          <div className={styles.actions}>
            <Link href="/sign-in" className={styles.linkBtn}>
              Log In
            </Link>
            <Link href="/sign-up" className={styles.ctaBtn}>
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className={styles.hero}>
          <div className={styles.heroOverlay}>
            <div className={`${styles.reveal} ${styles.fromUp} ${styles.heroBadge}`} data-reveal>
              Trusted by learners worldwide
            </div>
            <h1 className={`${styles.reveal} ${styles.fromUp}`} data-reveal data-delay="60">
              Build, Learn, Browse with <span>MINSU</span>
            </h1>
            <p className={`${styles.reveal} ${styles.fromUp}`} data-reveal data-delay="120">
              Discover guided paths, expert-led courses, and stories from the MINSU community.
            </p>
            <div className={`${styles.reveal} ${styles.fromUp} ${styles.heroActions}`} data-reveal data-delay="180">
              <a href="#featured-courses" onClick={handleNavClick} className={styles.heroPrimary}>
                Explore Courses
              </a>
              <a href="#about-minsu" onClick={handleNavClick} className={styles.heroGhost}>
                View About
              </a>
            </div>
          </div>
        </section>

        <section id="browse-categories" className={styles.categories}>
          <div className={`${styles.reveal} ${styles.fromUp} ${styles.sectionHead}`} data-reveal>
            <p>BROWSE CATEGORIES</p>
            <h2>Explore Our Top Categories</h2>
            <span>Find the perfect course from our wide selection of categories taught by industry experts.</span>
          </div>
          <div className={styles.categoryGrid}>
            {categories.map(([icon, title, description], idx) => (
              <article
                key={title}
                className={`${styles.reveal} ${styles.fromUp} ${styles.categoryCard}`}
                data-reveal
                data-delay={String(50 * (idx + 1))}
              >
                <div className={styles.categoryIcon}>{icon}</div>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="featured-courses" className={styles.featured}>
          <div className={`${styles.reveal} ${styles.fromUp} ${styles.sectionHeadDark}`} data-reveal>
            <p>FEATURED COURSES</p>
            <h2>Most Popular Courses</h2>
            <span>Start learning from the highest-rated courses chosen by thousands of students worldwide.</span>
          </div>
          <div className={styles.featuredGrid}>
            {featuredCourses.map((course, idx) => (
              <article
                key={course.title}
                className={`${styles.reveal} ${styles.fromUp} ${styles.courseCard}`}
                data-reveal
                data-delay={String(70 * (idx + 1))}
              >
                <div className={styles.courseThumb} style={{ backgroundImage: `url(${course.image})` }} />
                <div className={styles.courseBody}>
                  <p className={styles.courseCategory}>{course.category}</p>
                  <h3>{course.title}</h3>
                  <div className={styles.author}>
                    <span>{course.initials}</span>
                    {course.author}
                  </div>
                  <p className={styles.courseStats}>{course.stats}</p>
                  <strong className={styles.free}>Free</strong>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="about-minsu" className={styles.about}>
          <div className={styles.aboutInner}>
            <div className={`${styles.reveal} ${styles.fromUp}`} data-reveal>
              <p>ABOUT MINSU</p>
              <h2>
                Build, Learn, Browse with <span>MINSU</span>
              </h2>
              <span>
                Discover guided paths, expert-led courses, and stories from the MINSU community.
              </span>
              <div className={styles.aboutGrid}>
                <article>
                  <b>⏱️ Learn at Your Pace</b>
                  <p>Access courses anytime, anywhere with flexible learning paths.</p>
                </article>
                <article>
                  <b>🧑‍🏫 Expert Developers</b>
                  <p>Learn from MINSU mentors and industry professionals.</p>
                </article>
                <article>
                  <b>🛠️ Hands-on Projects</b>
                  <p>Build real projects and add them to your portfolio.</p>
                </article>
                <article>
                  <b>🎓 Certificates</b>
                  <p>Earn verified certificates after finishing your courses.</p>
                </article>
              </div>
            </div>
            <div className={`${styles.reveal} ${styles.fromRight} ${styles.aboutImage}`} data-reveal data-delay="120" />
          </div>
        </section>

        <section id="expert-developers" className={styles.experts}>
          <div className={`${styles.reveal} ${styles.fromUp} ${styles.sectionHead}`} data-reveal>
            <p>EXPERT DEVELOPERS</p>
            <h2>Learn From the Best</h2>
            <span>
              Build, Learn, Browse with MINSU. Discover guided paths, expert-led courses, and stories from the MINSU
              community.
            </span>
          </div>
          <div className={styles.expertGrid}>
            {experts.map(([name, role], idx) => (
              <article
                key={name}
                className={`${styles.reveal} ${styles.fromUp} ${styles.expertCard}`}
                data-reveal
                data-delay={String(70 * (idx + 1))}
              >
                <img src="/Profile.png" alt={name} />
                <h3>{name}</h3>
                <p>{role}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={`${styles.reveal} ${styles.fromUp} ${styles.footerTop}`} data-reveal>
          <div>
            <h3>Teach the world online</h3>
            <p>Create a course, reach learners, earn.</p>
          </div>
          <button type="button">Teach</button>
        </div>

        <div className={`${styles.reveal} ${styles.fromUp} ${styles.footerGrid}`} data-reveal data-delay="60">
          <div>
            <h4>In-demand Careers</h4>
            <a href="#">Data Scientist</a>
            <a href="#">Full Stack Web Developer</a>
            <a href="#">Cloud Engineer</a>
            <a href="#">Project Manager</a>
            <a href="#">Game Developer</a>
          </div>
          <div>
            <h4>Web Development</h4>
            <a href="#">JavaScript</a>
            <a href="#">React</a>
            <a href="#">Node.js</a>
            <a href="#">Python</a>
            <a href="#">Django</a>
          </div>
          <div>
            <h4>IT Certifications</h4>
            <a href="#">AWS</a>
            <a href="#">Azure Fundamentals</a>
            <a href="#">Kubernetes</a>
            <a href="#">Security+</a>
          </div>
          <div>
            <h4>Business Analytics</h4>
            <a href="#">Excel</a>
            <a href="#">SQL</a>
            <a href="#">Power BI</a>
            <a href="#">Data Analysis</a>
          </div>
        </div>

        <div className={`${styles.reveal} ${styles.fromUp} ${styles.footerBottom}`} data-reveal data-delay="120">
          © 2026 Your Project UI
        </div>
      </footer>
    </div>
  )
}
