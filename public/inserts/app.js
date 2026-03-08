const money = (n) => "₱" + n.toLocaleString("en-PH");
const toastEl = document.getElementById("toast");
// Playlist entries provided by the user

// Set logo link targets per page group
(() => {
  document.querySelectorAll(".brand").forEach((el) => {
    el.setAttribute("href", "/homepage");
    el.setAttribute("target", "_top");
  });
})();

function ytCourse(id, title, channel, language, views, url, description, preview, progress){
  return {
    id,
    kind: "youtube",
    title,
    channel,
    language,
    views,
    url,
    description,
    preview,
    thumb: null,
    progress: Number.isFinite(progress) ? progress : 0,
    learn: [
      "Full playlist lessons in one structured course",
      "Learn at your own pace with practical examples",
      "Apply the skills to real projects"
    ],
    topics: ["Beginner Friendly", "Programming", "Projects"],
    includes: ["Playlist lessons", "Practice examples", "Community notes"],
    content: [
      { title: "Introduction", meta: "8 lectures • 49min" },
      { title: "Getting Started", meta: "6 lectures • 37min" },
      { title: "Core Concepts", meta: "9 lectures • 58min" },
      { title: "Hands-on Practice", meta: "7 lectures • 52min" },
      { title: "Projects", meta: "5 lectures • 1hr 10min" }
    ],
    contentMeta: "5 sections • 35 lectures • 4h 26m total length"
  };
}

function getYouTubeId(input){
  if(!input) return "";
  try{
    const u = new URL(input);
    if(u.hostname.includes("youtube.com")){
      if(u.pathname.startsWith("/embed/")) return u.pathname.split("/").pop();
      if(u.searchParams.get("v")) return u.searchParams.get("v");
    }
    if(u.hostname.includes("youtu.be")){
      return u.pathname.replace("/", "");
    }
  }catch(_){}
  return "";
}

function getPlaylistId(input){
  if(!input) return "";
  try{
    const u = new URL(input, window.location.origin);
    const list = u.searchParams.get("list");
    if(list) return list;
  }catch(_){}
  return "";
}

function watchPathFromCourse(c){
  const fromId = String(c?.id || "").trim();
  const fromUrl = getPlaylistId(String(c?.url || ""));
  const playlistId = fromUrl || fromId;
  return playlistId ? `/watch/${encodeURIComponent(playlistId)}` : "";
}

function goToWatch(path){
  if(!path) return;
  if(window.top && window.top !== window){
    window.top.location.href = path;
    return;
  }
  window.location.href = path;
}

function toast(msg){
  if(!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add("is-on");
  window.clearTimeout(toastEl._t);
  toastEl._t = window.setTimeout(() => toastEl.classList.remove("is-on"), 1600);
}

const heroSlides = [
  {
    title: "Find your fit",
    text: "Browse short previews. Pick a path. Start learning.",
    bg: "#e8ea6a",
    image: "/1.png"
  },
  {
    title: "Learn faster",
    text: "Follow structured sections. Track progress per topic.",
    bg: "#c7f9cc",
    image: "/2.png"
  },
  {
    title: "Build projects",
    text: "Practice with small tasks. Save notes per lesson.",
    bg: "#ffd6a5",
    image: "/3.png"
  }
];

let heroIndex = 0;

const heroSlideEl = document.getElementById("heroSlide");
const heroTitleEl = document.getElementById("heroTitle");
const heroTextEl = document.getElementById("heroText");
const heroDotsEl = document.getElementById("heroDots");
const heroImageEl = document.getElementById("heroImage");

function renderHeroDots(){
  heroDotsEl.innerHTML = "";
  heroSlides.forEach((_, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "dot" + (i === heroIndex ? " is-on" : "");
    b.setAttribute("aria-label", "Go to slide " + (i + 1));
    b.addEventListener("click", () => setHero(i));
    heroDotsEl.appendChild(b);
  });
}

function setHero(i, direction = 1){
  const nextIndex = (i + heroSlides.length) % heroSlides.length;
  if(!heroSlideEl){
    heroIndex = nextIndex;
    return;
  }
  const outClass = direction >= 0 ? "is-out-left" : "is-out-right";
  heroSlideEl.classList.remove("is-in-left", "is-in-right", "is-out-left", "is-out-right");
  heroSlideEl.classList.add(outClass);
  window.setTimeout(() => {
    heroIndex = nextIndex;
    const s = heroSlides[heroIndex];
    heroTitleEl.textContent = s.title;
    heroTextEl.textContent = s.text;
    heroSlideEl.style.background = s.bg;
    if(s.image){
      heroSlideEl.style.backgroundImage = `url(${s.image})`;
      heroSlideEl.style.backgroundSize = "contain";
      heroSlideEl.style.backgroundPosition = "calc(100% - 110px) center";
      heroSlideEl.style.backgroundRepeat = "no-repeat";
    } else {
      heroSlideEl.style.backgroundImage = "none";
    }
    renderHeroDots();
    const inClass = direction >= 0 ? "is-in-right" : "is-in-left";
    heroSlideEl.classList.remove("is-out-left", "is-out-right");
    heroSlideEl.classList.add(inClass);
    requestAnimationFrame(() => {
      heroSlideEl.classList.remove("is-in-left", "is-in-right");
    });
  }, 220);
}

if(heroSlideEl && heroTitleEl && heroTextEl && heroDotsEl){
  document.getElementById("heroPrev").addEventListener("click", () => setHero(heroIndex - 1, -1));
  document.getElementById("heroNext").addEventListener("click", () => setHero(heroIndex + 1, 1));
  renderHeroDots();
  setHero(0);
}

if(heroDotsEl){
  const heroStage = document.querySelector(".hero__stage");
  if(heroStage && heroDotsEl.parentElement !== heroStage){
    heroStage.appendChild(heroDotsEl);
  }
  heroDotsEl.classList.remove("hero__dots--banner");
}

let courseRows = {
  rec: [
    ytCourse(
      "brocode-js",
      "JavaScript Tutorial for Beginner",
      "Bro Code",
      "English",
      "—",
      "https://www.youtube.com/watch?v=rLf3jnHxSmU&list=PLBlnK6fEyqRggZZgYpPMUxdY1CYkZtARR",
      "Start learning JavaScript with clear explanations and beginner-friendly examples.",
      "https://www.youtube.com/embed/rLf3jnHxSmU",
      35
    ),
    ytCourse(
      "neso-c",
      "C Programming – Features & The First C Program",
      "Neso Academy",
      "English",
      "—",
      "https://www.youtube.com/watch?v=18c3MTX0PK0&list=PLlrATfBNZ98dudnM48yfGUldqGD0S4FFb",
      "Understand C fundamentals, syntax, and your first program step by step.",
      "https://www.youtube.com/embed/18c3MTX0PK0",
      18
    ),
    ytCourse(
      "cherno-cpp",
      "C++ Tutorial (The Cherno Playlist)",
      "The Cherno",
      "English",
      "—",
      "https://www.youtube.com/watch?v=18c3MTX0PK0&list=PLlrATfBNZ98dudnM48yfGUldqGD0S4FFb",
      "Learn modern C++ concepts with focused lessons and practical guidance.",
      "https://www.youtube.com/embed/18c3MTX0PK0",
      52
    ),
    ytCourse(
      "mosh-python",
      "Python Tutorial for Beginners",
      "Programming with Mosh",
      "English",
      "—",
      "https://www.youtube.com/watch?v=_uQrJ0TkZlc&list=PLTjRvDozrdlxj5wgH4qkvwSOdHLOCx10f",
      "Build Python basics with real examples and clean explanations.",
      "https://www.youtube.com/embed/_uQrJ0TkZlc",
      8
    )
  ],
  recent: [
    mkCourse("Ultimate Web Development Course 2026", "H. A. Khan", 4.6, 1346, 459, 659, ["Premium"], "🌐"),
    mkCourse("Blazor: From Beginner To Pro", "B. Davis", 4.5, 78, 419, 599, ["Premium"], "🧊"),
    mkCourse("AI Web Development Bootcamp", "B. Schiff", 4.8, 32, 419, 599, ["Bestseller"], "🤖"),
    mkCourse("Full Stack Web Development", "F. Academy", 4.8, 98, 419, 599, ["Bestseller"], "🧰"),
    mkCourse("Intro to MongoDB", "B. St", 4.5, 4449, 419, 599, ["Premium"], "🍃")
  ],
  trend: [
    mkCourse("AI Engineer Agentic Track", "E. Don", 4.7, 28674, 449, 649, ["Premium", "Bestseller"], "🧠"),
    mkCourse("Ultimate AWS Certified Solutions Architect", "S. M", 4.7, 279825, 539, 769, ["Premium", "Bestseller"], "☁️"),
    mkCourse("AWS Certified Cloud Practitioner", "S. M", 4.7, 278063, 829, 1190, ["Premium", "Bestseller"], "🟦"),
    mkCourse("LLM Engineering Core Track", "E. Don", 4.7, 26392, 469, 669, ["Premium", "Bestseller"], "📚"),
    mkCourse("AI Engineer Course 2026", "365 Careers", 4.6, 15111, 469, 669, ["Premium", "Bestseller"], "🧑‍💻")
  ]
};

function buildImportedRows(){
  try{
    const raw = localStorage.getItem("qm_imported_playlists");
    if(!raw) return null;
    const imported = JSON.parse(raw);
    if(!Array.isArray(imported) || imported.length === 0) return null;

    const mapped = imported.map((item, index) => {
      const videos = Array.isArray(item.videos) ? item.videos : [];
      const firstVideo = videos[0] || null;
      const videoId = firstVideo && firstVideo.id ? firstVideo.id : "";
      const completed = Array.isArray(item.completedVideoIds) ? item.completedVideoIds.length : 0;
      const total = Number(item.totalVideos) || videos.length || 0;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      const views = total > 0 ? `${total} videos` : "—";
      const url = item.id ? `https://www.youtube.com/playlist?list=${encodeURIComponent(item.id)}` : "#";
      const preview = videoId ? `https://www.youtube.com/embed/${videoId}` : "";

      const course = ytCourse(
        item.id || `imported-${index}`,
        item.title || "Imported Playlist",
        item.channelTitle || "YouTube Channel",
        "English",
        views,
        url,
        item.description || "",
        preview,
        progress
      );
      course.__meta = {
        addedAt: item.addedAt || "",
        total,
        completed,
        progress
      };
      return course;
    });

    if(!mapped.length) return null;

    const byLatest = [...mapped].sort((a, b) => {
      const at = Date.parse(a.__meta?.addedAt || 0);
      const bt = Date.parse(b.__meta?.addedAt || 0);
      return bt - at;
    });
    const byProgress = [...mapped].sort((a, b) => (b.__meta?.progress || 0) - (a.__meta?.progress || 0));
    const byTrending = [...mapped].sort((a, b) => {
      const now = Date.now();
      const aAgeDays = Math.max(0, (now - Date.parse(a.__meta?.addedAt || 0)) / 86400000);
      const bAgeDays = Math.max(0, (now - Date.parse(b.__meta?.addedAt || 0)) / 86400000);
      const aRecency = Math.max(0, 30 - aAgeDays);
      const bRecency = Math.max(0, 30 - bAgeDays);
      const aScore = (a.__meta?.total || 0) * 3 + (a.__meta?.progress || 0) * 2 + aRecency;
      const bScore = (b.__meta?.total || 0) * 3 + (b.__meta?.progress || 0) * 2 + bRecency;
      return bScore - aScore;
    });

    const pickTop = (list) => list.slice(0, 12);
    const rec = pickTop(byLatest);
    const recent = pickTop(byProgress);
    const trend = pickTop(byTrending);
    return { rec, recent, trend };
  }catch(_){
    return null;
  }
}

const importedRows = buildImportedRows();
if(importedRows){
  courseRows = importedRows;
}

const USER_INTERESTS_KEY = "qm_user_interests";
const USER_LANGUAGE_KEY = "qm_ui_language";

const LANGUAGE_LABELS = {
  en: "English",
  fil: "Filipino",
  es: "Español"
};

const UI_TEXT = {
  en: {
    welcomeBack: "Welcome back",
    addInterests: "Add Interests",
    noInterests: "No interests selected yet.",
    interestsLabel: "Interests",
    interestsNone: "None",
    whatToLearn: "What to learn next",
    recommendedForYou: "Recommended for you",
    interestsTitle: "Add Interests",
    interestsDesc: "Pick courses/topics you like. This will update your Recommended for you playlists.",
    courses: "Courses",
    topics: "Topics",
    customInterests: "Type Here Your Interests/Hobby",
    customPlaceholder: "e.g. coding, music, design",
    cancel: "Cancel",
    saveInterests: "Save Interests",
    accountSettings: "Account settings",
    insights: "Insights",
    publicProfile: "Public profile",
    language: "Language",
    adminDashboard: "Admin Dashboard",
    logOut: "Log out",
    interestsSaved: "Interests saved"
  },
  fil: {
    welcomeBack: "Maligayang pagbalik",
    addInterests: "Magdagdag ng Interests",
    noInterests: "Wala pang napiling interests.",
    interestsLabel: "Interests",
    interestsNone: "Wala",
    whatToLearn: "Ano ang susunod na aaralin",
    recommendedForYou: "Inirerekomenda para sa iyo",
    interestsTitle: "Magdagdag ng Interests",
    interestsDesc: "Pumili ng courses/topics na gusto mo. Maa-update nito ang Recommended for you playlists.",
    courses: "Mga Kurso",
    topics: "Mga Paksa",
    customInterests: "I-type dito ang Interests/Hobby mo",
    customPlaceholder: "hal. coding, music, design",
    cancel: "Kanselahin",
    saveInterests: "I-save ang Interests",
    accountSettings: "Mga setting ng account",
    insights: "Insights",
    publicProfile: "Public profile",
    language: "Wika",
    adminDashboard: "Admin Dashboard",
    logOut: "Mag log out",
    interestsSaved: "Na-save na ang interests"
  },
  es: {
    welcomeBack: "Bienvenido de nuevo",
    addInterests: "Agregar Intereses",
    noInterests: "Aun no hay intereses seleccionados.",
    interestsLabel: "Intereses",
    interestsNone: "Ninguno",
    whatToLearn: "Que aprender despues",
    recommendedForYou: "Recomendado para ti",
    interestsTitle: "Agregar Intereses",
    interestsDesc: "Elige cursos/temas que te gusten. Esto actualizara tus playlists recomendados.",
    courses: "Cursos",
    topics: "Temas",
    customInterests: "Escribe aqui tus intereses/hobby",
    customPlaceholder: "ej. coding, musica, diseno",
    cancel: "Cancelar",
    saveInterests: "Guardar Intereses",
    accountSettings: "Configuracion de cuenta",
    insights: "Insights",
    publicProfile: "Perfil publico",
    language: "Idioma",
    adminDashboard: "Panel de Admin",
    logOut: "Cerrar sesion",
    interestsSaved: "Intereses guardados"
  }
};

function readUiLanguage(){
  try{
    const raw = localStorage.getItem(USER_LANGUAGE_KEY);
    if(raw && UI_TEXT[raw]) return raw;
  }catch(_){}
  return "en";
}

function saveUiLanguage(lang){
  const next = UI_TEXT[lang] ? lang : "en";
  try{
    localStorage.setItem(USER_LANGUAGE_KEY, next);
  }catch(_){}
}

let currentUiLanguage = readUiLanguage();

function t(key){
  const table = UI_TEXT[currentUiLanguage] || UI_TEXT.en;
  return table[key] || UI_TEXT.en[key] || key;
}

const INTEREST_CATEGORY_NAMES = [
  "Education",
  "Business",
  "Accounting & Finance",
  "IT & Software",
  "Design",
  "Office Productivity",
  "Marketing",
  "Development",
  "Health & Fitness",
  "Music"
];

const INTEREST_TOPICS_BY_CATEGORY = {
  "Education": ["Learning Strategies", "K-12 Resources", "Higher Education", "Teaching Tools", "Student Success"],
  "Business": ["Entrepreneurship", "Management", "Sales", "Leadership", "Business Strategy"],
  "Accounting & Finance": ["Bookkeeping", "Financial Analysis", "Corporate Finance", "Investment", "Tax"],
  "IT & Software": ["Cloud Computing", "Cybersecurity", "IT Support", "DevOps", "Networking"],
  "Design": ["UI/UX Design", "Graphic Design", "Illustration", "Design Systems", "3D Design"],
  "Office Productivity": ["Excel", "Google Workspace", "Project Planning", "Time Management", "Documentation"],
  "Marketing": ["Digital Marketing", "Content Strategy", "SEO", "Branding", "Analytics"],
  "Development": ["Web Development", "Mobile Development", "Programming Languages", "Game Development"],
  "Health & Fitness": ["Nutrition", "Yoga", "Mental Wellness", "Fitness Training", "Health Coaching"],
  "Music": ["Music Production", "Guitar", "Piano", "Music Theory", "Sound Design"]
};

function defaultInterestState(){
  return { categories: [], topics: [], custom: "", none: false };
}

function sanitizeInterests(input){
  const next = defaultInterestState();
  if(!input || typeof input !== "object") return next;
  next.categories = Array.isArray(input.categories)
    ? [...new Set(input.categories.map(String).map((x) => x.trim()).filter(Boolean))]
    : [];
  next.topics = Array.isArray(input.topics)
    ? [...new Set(input.topics.map(String).map((x) => x.trim()).filter(Boolean))]
    : [];
  next.custom = String(input.custom || "").trim().slice(0, 120);
  next.none = Boolean(input.none);
  return next;
}

function readInterests(){
  try{
    const raw = localStorage.getItem(USER_INTERESTS_KEY);
    if(!raw) return defaultInterestState();
    return sanitizeInterests(JSON.parse(raw));
  }catch(_){
    return defaultInterestState();
  }
}

function saveInterests(state){
  try{
    localStorage.setItem(USER_INTERESTS_KEY, JSON.stringify(sanitizeInterests(state)));
  }catch(_){}
}

let userInterests = readInterests();

function getInterestKeywords(state){
  if(!state || state.none) return [];
  const customWords = String(state.custom || "")
    .toLowerCase()
    .split(/[,/|]/g)
    .map((x) => x.trim())
    .filter(Boolean);
  const out = []
    .concat(state.categories || [])
    .concat(state.topics || [])
    .concat(customWords)
    .map((x) => String(x).toLowerCase().trim())
    .filter(Boolean);
  return [...new Set(out)];
}

function getRecommendedList(){
  const base = Array.isArray(courseRows.rec) ? courseRows.rec : [];
  const keywords = getInterestKeywords(userInterests);
  if(!base.length || !keywords.length) return base;

  const scored = base
    .map((course) => {
      const haystack = [
        course?.title || "",
        course?.by || "",
        course?.channel || "",
        course?.description || "",
        Array.isArray(course?.topics) ? course.topics.join(" ") : "",
        Array.isArray(course?.learn) ? course.learn.join(" ") : ""
      ].join(" ").toLowerCase();
      let score = 0;
      keywords.forEach((kw) => {
        if(!kw) return;
        if(haystack.includes(kw)) score += 2;
        else{
          const first = kw.split(" ")[0];
          if(first && haystack.includes(first)) score += 1;
        }
      });
      return { course, score };
    })
    .sort((a, b) => b.score - a.score);

  const matched = scored.filter((x) => x.score > 0).map((x) => x.course);
  return matched.length ? matched : base;
}

function getRowList(rowKey){
  if(rowKey === "rec") return getRecommendedList();
  return Array.isArray(courseRows[rowKey]) ? courseRows[rowKey] : [];
}

function mkCourse(title, by, rating, reviews, now, was, flags, emoji){
  return { title, by, rating, reviews, now, was, flags, emoji };
}

function starText(rating){
  const full = Math.floor(rating);
  let out = "";
  for(let i=0;i<5;i++){
    out += i < full ? "★" : "☆";
  }
  return out;
}

function flagClass(name){
  if(name.toLowerCase().includes("premium")) return "flag flag--premium";
  if(name.toLowerCase().includes("best")) return "flag flag--best";
  return "flag";
}

function cardElYouTube(c){
  const el = document.createElement("article");
  el.className = "card";
  const vid = getYouTubeId(c.preview) || getYouTubeId(c.url);
  const thumb = vid ? `https://i.ytimg.com/vi/${vid}/hqdefault.jpg` : "";
  const watchPath = watchPathFromCourse(c);

  el.innerHTML = `
    <div class="thumb" role="img" aria-label="${escapeHtml(c.title)} cover" style="${thumb ? `background-image:url('${thumb}'); background-size:cover; background-position:center;` : ""}">
      <div class="thumb__tag">Free</div>
      <div class="thumb__emoji" aria-hidden="true">▶</div>
    </div>

    <div class="card__body">
      <h3 class="card__title">${escapeHtml(c.title)}</h3>

      <p class="card__by">Channel: ${escapeHtml(c.channel)}</p>

      <div class="rating" style="gap:12px">
        <span>Views: ${escapeHtml(c.views)}</span>
        <span>Language: ${escapeHtml(c.language)}</span>
      </div>

      <div class="flags">
        <span class="flag">Free</span>
        <a class="flag" href="${watchPath || "#"}" target="_top" rel="noopener">Open</a>
      </div>
    </div>
    <div class="hovercard" aria-hidden="true">
      <h4 class="hovercard__title">${escapeHtml(c.title)}</h4>
      <div class="hovercard__meta">Channel: ${escapeHtml(c.channel)} · ${escapeHtml(c.language)}</div>
      <div class="flags">
        <span class="flag">Free</span>
      </div>
      <div class="hovercard__meta">Playlist course · ${escapeHtml(c.views)} views</div>
      <ul class="hovercard__list">
        <li>Full playlist lessons in one course</li>
        <li>Learn at your own pace</li>
        <li>Continue learning in watch page</li>
      </ul>
      <div class="hovercard__actions">
        <button class="hovercard__btn" type="button">Play</button>
        <button class="hovercard__wish" type="button" aria-label="Wishlist">♡</button>
      </div>
    </div>
  `;

  el.querySelector(".thumb").addEventListener("click", () => {
    goToWatch(watchPath);
  });

  const openLink = el.querySelector('.flags a.flag');
  if(openLink){
    openLink.addEventListener("click", (e) => {
      if(!watchPath) return;
      e.preventDefault();
      goToWatch(watchPath);
    });
  }

  const playBtn = el.querySelector(".hovercard__btn");
  if(playBtn){
    playBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      goToWatch(watchPath);
    });
  }

  el.addEventListener("click", (e) => {
    if(e.target.closest("a") || e.target.closest(".thumb") || e.target.closest("button")) return;
    goToWatch(watchPath);
  });

  const hover = el.querySelector(".hovercard");
  if(hover){
    el.addEventListener("mouseenter", () => {
      const rect = el.getBoundingClientRect();
      hover.classList.add("is-float");
      hover.style.top = Math.max(12, rect.top + 10) + "px";
      hover.style.left = Math.min(window.innerWidth - 320, rect.right + 12) + "px";
      hover.setAttribute("aria-hidden", "false");
      document.body.appendChild(hover);
    });
    el.addEventListener("mouseleave", (e) => {
      if(hover.contains(e.relatedTarget)) return;
      hover.classList.remove("is-float");
      hover.removeAttribute("style");
      hover.setAttribute("aria-hidden", "true");
      el.appendChild(hover);
    });
    hover.addEventListener("mouseleave", () => {
      hover.classList.remove("is-float");
      hover.removeAttribute("style");
      hover.setAttribute("aria-hidden", "true");
      el.appendChild(hover);
    });
  }

  return el;
}

function cardEl(c){
  const el = document.createElement("article");
  el.className = "card";
  el.innerHTML = `
    <div class="thumb" role="img" aria-label="${escapeHtml(c.title)} cover">
      <div class="thumb__tag">${c.flags[0] || "Course"}</div>
      <div class="thumb__emoji" aria-hidden="true">${c.emoji}</div>
    </div>
    <div class="card__body">
      <h3 class="card__title">${escapeHtml(c.title)}</h3>
      <p class="card__by">${escapeHtml(c.by)}</p>
      <div class="rating">
        <span>${c.rating.toFixed(1)}</span>
        <span class="stars" aria-label="Rating ${c.rating.toFixed(1)} out of 5">${starText(c.rating)}</span>
        <span>(${c.reviews.toLocaleString("en-US")})</span>
      </div>
      <div class="card__actions">
        <span class="pillfree">Free</span>
        <button class="pillfree" type="button">Open</button>
      </div>
    </div>
    <div class="hovercard" aria-hidden="true">
      <h4 class="hovercard__title">${escapeHtml(c.title)}</h4>
      <div class="hovercard__meta">By ${escapeHtml(c.by)} · Updated November 2025</div>
      <div class="hovercard__meta">62 total hours · All levels · Subtitles</div>
      <ul class="hovercard__list">
        <li>Build projects to strengthen your portfolio</li>
        <li>Learn modern tools and frameworks</li>
        <li>Apply for junior developer roles</li>
      </ul>
      <div class="hovercard__actions">
        <button class="hovercard__btn" type="button">Add to cart</button>
        <button class="hovercard__wish" type="button" aria-label="Wishlist">♡</button>
      </div>
    </div>
  `;
  const hover = el.querySelector(".hovercard");
  if(hover){
    el.addEventListener("mouseenter", () => {
      const rect = el.getBoundingClientRect();
      hover.classList.add("is-float");
      hover.style.top = Math.max(12, rect.top + 10) + "px";
      hover.style.left = Math.min(window.innerWidth - 320, rect.right + 12) + "px";
      hover.setAttribute("aria-hidden", "false");
      document.body.appendChild(hover);
    });
    el.addEventListener("mouseleave", (e) => {
      if(hover.contains(e.relatedTarget)) return;
      hover.classList.remove("is-float");
      hover.removeAttribute("style");
      hover.setAttribute("aria-hidden", "true");
      el.appendChild(hover);
    });
    hover.addEventListener("mouseleave", () => {
      hover.classList.remove("is-float");
      hover.removeAttribute("style");
      hover.setAttribute("aria-hidden", "true");
      el.appendChild(hover);
    });
  }
  el.addEventListener("click", () => toast("Opened: " + c.title));
  el.addEventListener("click", (e) => {
    if(e.target.closest("a") || e.target.closest("button")) return;
    const payload = {
      id: c.title,
      title: c.title,
      channel: c.by,
      language: "English",
      views: "—",
      url: "#",
      description: "",
      preview: ""
    };
    try{
      localStorage.setItem("qm_desc_course", JSON.stringify(payload));
    }catch(_){}
    window.location.href = "/QMSystem/src/description.html?id=" + encodeURIComponent(c.title);
  });
  return el;
}

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

const rowCursor = { rec: 0, recent: 0, trend: 0 };
const rowPageSize = 5;

function rowItemsWindow(rowKey){
  const list = getRowList(rowKey);
  if(list.length <= rowPageSize) return list;
  const start = ((rowCursor[rowKey] || 0) % list.length + list.length) % list.length;
  const out = [];
  for(let i = 0; i < rowPageSize; i++){
    out.push(list[(start + i) % list.length]);
  }
  return out;
}

function mountRow(rowKey){
  const root = document.getElementById("row-" + rowKey);
  if(!root) return;
  root.innerHTML = "";
  rowItemsWindow(rowKey).forEach(c => {
    if(c.kind === "youtube") root.appendChild(cardElYouTube(c));
    else root.appendChild(cardEl(c));
  });
}

mountRow("rec");
mountRow("recent");
mountRow("trend");

document.querySelectorAll(".row__nav").forEach(btn => {
  btn.addEventListener("click", () => {
    const row = btn.getAttribute("data-row");
    const dir = Number(btn.getAttribute("data-dir"));
    const list = getRowList(row);
    if(!list.length) return;
    rowCursor[row] = (rowCursor[row] || 0) + (dir > 0 ? 1 : -1);
    mountRow(row);
  });
});

const topics = [
  "Graphic Design",
  "PHP (programming language)",
  "Adobe Photoshop",
  "Laravel",
  "Adobe Illustrator",
  "Web Development",
  "MySQL",
  "JavaScript",
  "SQL",
  "Node.js"
];

const topicChips = document.getElementById("topicChips");
if(topicChips){
  topics.forEach(t => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.textContent = t;
    b.addEventListener("click", () => toast("Topic: " + t));
    topicChips.appendChild(b);
  });
}

const dismissBanner = document.getElementById("dismissBanner");
if(dismissBanner){
  dismissBanner.addEventListener("click", () => {
    const banner = document.getElementById("bizBanner");
    banner.style.display = "none";
    toast("Banner dismissed");
  });
}

const banner = document.getElementById("bizBanner");
const bannerText = banner ? banner.querySelector(".banner__text") : null;
const bannerSlides = [
  "Training 2 or more people? Get team access to top courses.",
  "Save time with curated learning paths for your team.",
  "Upgrade skills faster with bulk access and analytics."
];
let bannerIndex = 0;

function setBannerText(i){
  if(!bannerText) return;
  bannerIndex = (i + bannerSlides.length) % bannerSlides.length;
  bannerText.textContent = bannerSlides[bannerIndex];
}

function nextBanner(){
  if(!bannerText) return;
  bannerText.classList.add("is-fade","is-out");
  window.setTimeout(() => {
    setBannerText(bannerIndex + 1);
    bannerText.classList.remove("is-out");
  }, 220);
}

if(bannerText){
  bannerText.classList.add("is-fade");
  setBannerText(0);
  window.setInterval(nextBanner, 5500);
}

const exploreGoals = [
  "Learn AI",
  "Launch a new career",
  "Prepare for a certification",
  "Practice with Role Play"
];

const exploreCategories = [
  {
    name: "Education",
    sub: ["Learning Strategies", "K-12 Resources", "Higher Education", "Teaching Tools", "Student Success"],
    topics: ["Lesson Planning", "Classroom Management", "Assessment", "Inclusive Teaching", "Education Tech"]
  },
  {
    name: "Business",
    sub: ["Entrepreneurship", "Communication", "Management", "Sales", "Business Strategy", "Operations", "Project Management", "Business Law", "Business Analytics & Intelligence", "Human Resources", "Industry", "E-Commerce", "Media", "Real Estate", "Other Business"],
    topics: ["Artificial Intelligence (AI)", "Management Consulting", "Online Business", "ChatGPT", "Prompt Engineering", "Business Fundamentals"]
  },
  {
    name: "Finance & Accounting",
    sub: ["Accounting", "Bookkeeping", "Tax", "Investing & Trading", "Financial Modeling", "Economics"],
    topics: ["Financial Analysis", "Stock Trading", "Excel Finance", "Corporate Finance", "Personal Finance"]
  },
  {
    name: "IT & Software",
    sub: ["IT Support", "Cloud Computing", "Cybersecurity", "DevOps", "Networking", "Hardware"],
    topics: ["AWS", "Azure", "CompTIA", "Linux", "Cybersecurity Essentials"]
  },
  {
    name: "Design",
    sub: ["Graphic Design", "UI/UX Design", "3D & Animation", "Design Tools", "Game Art"],
    topics: ["Figma", "Photoshop", "Illustrator", "Canva", "Typography"]
  },
  {
    name: "Office Productivity",
    sub: ["Microsoft", "Google Workspace", "Project Management", "Time Management", "Typing"],
    topics: ["Excel", "PowerPoint", "Notion", "Trello", "Calendar Planning"]
  },
  {
    name: "Marketing",
    sub: ["Digital Marketing", "SEO", "Content Marketing", "Social Media", "Branding", "Analytics"],
    topics: ["Google Ads", "Email Marketing", "TikTok Marketing", "Copywriting"]
  },
  {
    name: "Development",
    sub: ["Web Development", "Mobile Development", "Programming Languages", "Game Development", "Database Design & Development", "Software Testing"],
    topics: ["JavaScript", "Python", "React", "SQL", "Node.js", "Data Structures"]
  },
  {
    name: "Health & Fitness",
    sub: ["Fitness", "General Health", "Nutrition", "Yoga", "Mental Health"],
    topics: ["Home Workouts", "Mindfulness", "Meal Planning", "Strength Training"]
  },
  {
    name: "Music",
    sub: ["Instruments", "Music Production", "Music Theory", "Vocal", "Music Software"],
    topics: ["Piano", "Guitar", "Ableton", "Logic Pro", "Songwriting"]
  },
  {
    name: "Personal Development",
    sub: ["Leadership", "Career Development", "Parenting", "Happiness", "Personal Branding"],
    topics: ["Communication Skills", "Confidence", "Productivity", "Public Speaking"]
  },
  {
    name: "Lifestyle",
    sub: ["Arts & Crafts", "Beauty & Makeup", "Food & Beverage", "Travel", "Pet Care"],
    topics: ["Cooking", "Photography", "Interior Design", "Gardening"]
  },
  {
    name: "Photography & Video",
    sub: ["Digital Photography", "Video Editing", "Cameras", "Lighting", "Film & Video"],
    topics: ["Premiere Pro", "After Effects", "Lightroom", "Storytelling"]
  },
  {
    name: "Teaching & Academics",
    sub: ["Engineering", "Humanities", "Math", "Science", "Online Education"],
    topics: ["Calculus", "Physics", "Literature", "Statistics"]
  }
];

const exploreMenu = document.getElementById("exploreMenu");
const exploreBtn = document.getElementById("btnExplore");
const exploreGoalsEl = document.getElementById("exploreGoals");
const exploreCatsEl = document.getElementById("exploreCategories");
const exploreSubTitle = document.getElementById("exploreSubTitle");
const exploreSubcatsEl = document.getElementById("exploreSubcats");
const exploreTopicsEl = document.getElementById("exploreTopics");

let activeExplore = exploreCategories[0];

function renderExplore(){
  if(!exploreMenu) return;
  exploreGoalsEl.innerHTML = "";
  exploreGoals.forEach(item => {
    const li = document.createElement("li");
    li.className = "explore-item has-next";
    li.textContent = item;
    exploreGoalsEl.appendChild(li);
  });

  exploreCatsEl.innerHTML = "";
  exploreCategories.forEach(cat => {
    const link = document.createElement("a");
    link.className = "explore-item has-next" + (cat === activeExplore ? " is-active" : "");
    link.textContent = cat.name;
    const catLink = categoryLinks[cat.name] && categoryLinks[cat.name].base ? categoryLinks[cat.name].base : "#";
    link.href = catLink;
    link.target = "_top";
    link.addEventListener("mouseenter", () => {
      activeExplore = cat;
      renderExplore();
    });
    exploreCatsEl.appendChild(link);
  });

  exploreSubTitle.textContent = activeExplore.name;
  exploreSubcatsEl.innerHTML = "";
  activeExplore.sub.forEach(item => {
    const link = document.createElement("a");
    link.className = "explore-item has-next";
    const cat = categoryLinks[activeExplore.name];
    link.href = cat && cat[item] ? cat[item] : "#";
    link.target = "_top";
    link.textContent = item;
    exploreSubcatsEl.appendChild(link);
  });

  exploreTopicsEl.innerHTML = "";
  activeExplore.topics.forEach(item => {
    const li = document.createElement("li");
    li.className = "explore-item";
    li.textContent = item;
    exploreTopicsEl.appendChild(li);
  });
}

function openExplore(){
  if(!exploreMenu) return;
  renderExplore();
  exploreMenu.classList.add("is-open");
  exploreMenu.setAttribute("aria-hidden", "false");
  exploreBtn.setAttribute("aria-expanded", "true");
}

function closeExplore(){
  if(!exploreMenu) return;
  exploreMenu.classList.remove("is-open");
  exploreMenu.setAttribute("aria-hidden", "true");
  exploreBtn.setAttribute("aria-expanded", "false");
}

if(exploreBtn && exploreMenu){
  let locked = false;

  const isInside = (t) => exploreBtn.contains(t) || exploreMenu.contains(t);

  exploreBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    locked = !locked;
    if(locked) openExplore();
    else closeExplore();
  });

  exploreBtn.addEventListener("mouseenter", () => {
    if(!locked) openExplore();
  });
  exploreBtn.addEventListener("mouseleave", (e) => {
    if(locked) return;
    if(exploreMenu.contains(e.relatedTarget)) return;
    closeExplore();
  });

  exploreMenu.addEventListener("mouseenter", () => {
    if(!locked) openExplore();
  });
  exploreMenu.addEventListener("mouseleave", (e) => {
    if(locked) return;
    if(exploreBtn.contains(e.relatedTarget)) return;
    closeExplore();
  });

  document.addEventListener("click", (e) => {
    if(isInside(e.target)) return;
    locked = false;
    closeExplore();
  });
}

const categoryMap = {
  "Education": ["Learning Strategies", "K-12 Resources", "Higher Education", "Teaching Tools", "Student Success"],
  "Business": ["Entrepreneurship", "Management", "Sales", "Leadership", "Business Strategy"],
  "Accounting & Finance": ["Bookkeeping", "Financial Analysis", "Corporate Finance", "Investment", "Tax"],
  "IT & Software": ["Cloud Computing", "Cybersecurity", "IT Support", "DevOps", "Networking"],
  "Design": ["UI/UX Design", "Graphic Design", "Illustration", "Design Systems", "3D Design"],
  "Office Productivity": ["Excel", "Google Workspace", "Project Planning", "Time Management", "Documentation"],
  "Marketing": ["Digital Marketing", "Content Strategy", "SEO", "Branding", "Analytics"],
  "Development": ["Web Development", "Mobile Development", "Programming Languages", "Game Development", "Database Design & Development", "Software Testing"],
  "Health & Fitness": ["Nutrition", "Yoga", "Mental Wellness", "Fitness Training", "Health Coaching"],
  "Music": ["Music Production", "Guitar", "Piano", "Music Theory", "Sound Design"]
};

const categoryLinks = {
  "Education": {
    base: "/courses/education/learning-strategies",
    "Learning Strategies": "/courses/education/learning-strategies",
    "K-12 Resources": "/courses/education/k-12-resources",
    "Higher Education": "/courses/education/higher-education",
    "Teaching Tools": "/courses/education/teaching-tools",
    "Student Success": "/courses/education/student-success"
  },
  "Business": {
    base: "/courses/business/entpreneurship",
    "Entrepreneurship": "/courses/business/entpreneurship",
    "Management": "/courses/business/management",
    "Sales": "/courses/business/sales",
    "Leadership": "/courses/business/leadership",
    "Business Strategy": "/courses/business/business-strategy"
  },
  "Accounting & Finance": {
    base: "/courses/accounting-and-finance/bookkeeping",
    "Financial Analysis": "/courses/accounting-and-finance/financial-analysis",
    "Bookkeeping": "/courses/accounting-and-finance/bookkeeping",
    "Investment": "/courses/accounting-and-finance/investment",
    "Tax": "/courses/accounting-and-finance/tax",
    "Corporate Finance": "/courses/accounting-and-finance/corporate-finance"
  },
  "IT & Software": {
    base: "/courses/it-and-software/networking",
    "Cloud Computing": "/courses/it-and-software/cloud-computing",
    "Cybersecurity": "/courses/it-and-software/cybersecurity",
    "IT Support": "/courses/it-and-software/it-support",
    "DevOps": "/courses/it-and-software/dev-ops",
    "Networking": "/courses/it-and-software/networking"
  },
  "Design": {
    base: "/courses/design/ui-ux-design",
    "UI/UX Design": "/courses/design/ui-ux-design",
    "Graphic Design": "/courses/design/graphic-design",
    "Illustration": "/courses/design/illustration",
    "Design Systems": "/courses/design/design-systems",
    "3D Design": "/courses/design/3d-design"
  },
  "Office Productivity": {
    base: "/courses/office-productivity/time-management",
    "Excel": "/courses/office-productivity/excel",
    "Google Workspace": "/courses/office-productivity/google-workspace",
    "Project Planning": "/courses/office-productivity/project-planning",
    "Time Management": "/courses/office-productivity/time-management",
    "Documentation": "/courses/office-productivity/documentation"
  },
  "Marketing": {
    base: "/courses/marketing/digital-marketing",
    "Digital Marketing": "/courses/marketing/digital-marketing",
    "Content Strategy": "/courses/marketing/content-strategy",
    "SEO": "/courses/marketing/seo",
    "Branding": "/courses/marketing/branding",
    "Analytics": "/courses/marketing/analytics"
  },
  "Development": {
    base: "/courses/development/web-development",
    "Web Development": "/courses/development/web-development",
    "Mobile Development": "/courses/development/mobile-development",
    "Programming Languages": "/courses/development/programming-languages",
    "Game Development": "/courses/development/game-development",
    "Database Design & Development": "/courses/development/database-design-and-development",
    "Software Testing": "/courses/development/software-testing"
  },
  "Health & Fitness": {
    base: "/courses/health-and-fitness/nutrition",
    "Nutrition": "/courses/health-and-fitness/nutrition",
    "Yoga": "/courses/health-and-fitness/yoga",
    "Mental Wellness": "/courses/health-and-fitness/mental-wellness",
    "Fitness Training": "/courses/health-and-fitness/fitness-training",
    "Health Coaching": "/courses/health-and-fitness/health-coaching"
  },
  "Music": {
    base: "/courses/music/music-production",
    "Music Production": "/courses/music/music-production",
    "Guitar": "/courses/music/guitar",
    "Piano": "/courses/music/piano",
    "Music Theory": "/courses/music/music-theory",
    "Sound Design": "/courses/music/sound-design"
  }
};

function setInterestSummary(state){
  const summary = document.getElementById("interestsSummary");
  if(!summary) return;
  const normalized = sanitizeInterests(state);
  if(normalized.none){
    summary.textContent = `${t("interestsLabel")}: ${t("interestsNone")}`;
    return;
  }
  const picks = []
    .concat(normalized.categories || [])
    .concat(normalized.topics || [])
    .concat(normalized.custom ? [normalized.custom] : []);
  if(!picks.length){
    summary.textContent = t("noInterests");
    return;
  }
  summary.textContent = `${t("interestsLabel")}: ` + picks.slice(0, 3).join(", ") + (picks.length > 3 ? ` +${picks.length - 3}` : "");
}

function refreshRecommendations(){
  rowCursor.rec = 0;
  mountRow("rec");
}

function initInterestsModal(){
  const trigger = document.getElementById("addInterestsBtn");
  const modal = document.getElementById("interestsModal");
  const overlay = document.getElementById("interestsOverlay");
  const closeBtn = document.getElementById("interestsClose");
  const cancelBtn = document.getElementById("interestsCancel");
  const saveBtn = document.getElementById("interestsSave");
  const noneInput = document.getElementById("interestNone");
  const customInput = document.getElementById("interestCustom");
  const categoriesWrap = document.getElementById("interestCategories");
  const topicsWrap = document.getElementById("interestTopics");

  if(
    !trigger || !modal || !overlay || !closeBtn || !cancelBtn || !saveBtn ||
    !noneInput || !customInput || !categoriesWrap || !topicsWrap
  ) return;

  let draft = sanitizeInterests(userInterests);

  const setOpen = (open) => {
    modal.classList.toggle("is-open", open);
    modal.setAttribute("aria-hidden", open ? "false" : "true");
  };

  const renderTopics = () => {
    const selectedCategories = draft.categories || [];
    let topicPool = [];
    if(selectedCategories.length){
      topicPool = selectedCategories.flatMap((name) => INTEREST_TOPICS_BY_CATEGORY[name] || []);
    } else {
      topicPool = INTEREST_CATEGORY_NAMES.flatMap((name) => INTEREST_TOPICS_BY_CATEGORY[name] || []);
    }
    const topics = [...new Set(topicPool)];
    topicsWrap.innerHTML = "";
    topics.forEach((name) => {
      const label = document.createElement("label");
      label.className = "interests-option";
      const checked = (draft.topics || []).includes(name) ? "checked" : "";
      label.innerHTML = `<input type="checkbox" value="${escapeHtml(name)}" ${checked} /><span>${escapeHtml(name)}</span>`;
      const input = label.querySelector("input");
      input.addEventListener("change", (e) => {
        const next = new Set(draft.topics || []);
        if(e.target.checked) next.add(name);
        else next.delete(name);
        draft.topics = [...next];
        if(draft.topics.length) draft.none = false;
      });
      topicsWrap.appendChild(label);
    });
  };

  const renderCategories = () => {
    categoriesWrap.innerHTML = "";
    INTEREST_CATEGORY_NAMES.forEach((name) => {
      const label = document.createElement("label");
      label.className = "interests-option";
      const checked = (draft.categories || []).includes(name) ? "checked" : "";
      label.innerHTML = `<input type="checkbox" value="${escapeHtml(name)}" ${checked} /><span>${escapeHtml(name)}</span>`;
      const input = label.querySelector("input");
      input.addEventListener("change", (e) => {
        const next = new Set(draft.categories || []);
        if(e.target.checked) next.add(name);
        else next.delete(name);
        draft.categories = [...next];
        if(draft.categories.length) draft.none = false;
        renderTopics();
      });
      categoriesWrap.appendChild(label);
    });
  };

  const loadDraftFromCurrent = () => {
    draft = sanitizeInterests(userInterests);
    noneInput.checked = Boolean(draft.none);
    customInput.value = draft.custom || "";
    renderCategories();
    renderTopics();
  };

  const closeModal = () => setOpen(false);

  trigger.addEventListener("click", () => {
    loadDraftFromCurrent();
    setOpen(true);
  });
  overlay.addEventListener("click", closeModal);
  closeBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);

  noneInput.addEventListener("change", () => {
    draft.none = noneInput.checked;
    if(draft.none){
      draft.categories = [];
      draft.topics = [];
      draft.custom = "";
      customInput.value = "";
      renderCategories();
      renderTopics();
    }
  });

  customInput.addEventListener("input", () => {
    draft.custom = customInput.value.trim().slice(0, 120);
    if(draft.custom) draft.none = false;
  });

  saveBtn.addEventListener("click", () => {
    if(draft.none){
      draft.categories = [];
      draft.topics = [];
      draft.custom = "";
    }
    userInterests = sanitizeInterests(draft);
    saveInterests(userInterests);
    setInterestSummary(userInterests);
    refreshRecommendations();
    toast(t("interestsSaved"));
    closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if(e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });

  setInterestSummary(userInterests);
}

const catItems = document.querySelectorAll(".cats__item");
const catMenu = document.getElementById("catMenu");
const catMenuInner = document.getElementById("catMenuInner");
const catsInner = document.querySelector(".cats__inner");
const catsWrap = document.querySelector(".cats");

function resetMobileCategoryScroll(){
  if(!catsInner) return;
  if(catsInner.scrollWidth <= catsInner.clientWidth + 2) return;
  const reset = () => {
    try{
      catsInner.scrollTo({ left: 0, behavior: "auto" });
    }catch(_){
      catsInner.scrollLeft = 0;
    }
    const first = catsInner.querySelector(".cats__item");
    if(first && typeof first.scrollIntoView === "function"){
      try{
        first.scrollIntoView({ inline: "start", block: "nearest" });
      }catch(_){}
    }
  };
  reset();
  window.setTimeout(reset, 40);
  window.setTimeout(reset, 180);
  window.setTimeout(reset, 320);
}
let activeCat = null;
let catCloseTimer = null;

if(catMenu && catMenuInner){
  function scheduleCloseCatMenu(){
    if(catCloseTimer) window.clearTimeout(catCloseTimer);
    catCloseTimer = window.setTimeout(() => closeCatMenu(), 180);
  }

  function cancelCloseCatMenu(){
    if(!catCloseTimer) return;
    window.clearTimeout(catCloseTimer);
    catCloseTimer = null;
  }

  function renderCatMenu(label){
    const items = categoryMap[label] || [];
    catMenuInner.innerHTML = "";
    const row = document.createElement("div");
    row.className = "cat-menu__items";
    items.forEach(name => {
      const link = document.createElement("a");
      link.className = "cat-menu__link";
      const cat = categoryLinks[label];
      link.href = cat && cat[name] ? cat[name] : "#";
      link.target = "_top";
      link.textContent = name;
      row.appendChild(link);
    });
    catMenuInner.appendChild(row);
  }

  function openCatMenu(item){
    cancelCloseCatMenu();
    const label = item.getAttribute("data-cat") || item.textContent.trim();
    activeCat = item;
    renderCatMenu(label);
    catMenu.classList.add("is-open");
    catMenu.setAttribute("aria-hidden", "false");
  }

  function closeCatMenu(){
    cancelCloseCatMenu();
    activeCat = null;
    catMenu.classList.remove("is-open");
    catMenu.setAttribute("aria-hidden", "true");
  }

  catItems.forEach(item => {
    item.setAttribute("data-cat", item.textContent.trim());
    item.addEventListener("mouseenter", () => openCatMenu(item));
    item.addEventListener("mouseleave", (e) => {
      if(catMenu.contains(e.relatedTarget)) return;
      scheduleCloseCatMenu();
    });
  });

  catMenu.addEventListener("mouseleave", (e) => {
    if(activeCat && activeCat.contains(e.relatedTarget)) return;
    scheduleCloseCatMenu();
  });
  catMenu.addEventListener("mouseenter", cancelCloseCatMenu);

  if(catsInner){
    catsInner.addEventListener("mouseover", (e) => {
      const item = e.target.closest(".cats__item");
      if(item) openCatMenu(item);
    });
  }

  if(catsWrap){
    catsWrap.addEventListener("mouseleave", (e) => {
      if(catMenu.contains(e.relatedTarget)) return;
      scheduleCloseCatMenu();
    });
  }
}

window.addEventListener("load", resetMobileCategoryScroll);
window.addEventListener("resize", resetMobileCategoryScroll);
window.addEventListener("orientationchange", resetMobileCategoryScroll);
window.addEventListener("pageshow", resetMobileCategoryScroll);
document.addEventListener("DOMContentLoaded", resetMobileCategoryScroll);
document.addEventListener("visibilitychange", () => {
  if(document.visibilityState === "visible") resetMobileCategoryScroll();
});

const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
if(searchBtn && searchInput){
  searchBtn.addEventListener("click", runSearch);
  searchInput.addEventListener("keydown", (e) => {
    if(e.key === "Enter") runSearch();
  });
}

function findCourseById(id){
  const all = [].concat(getRowList("rec"), getRowList("recent"), getRowList("trend"));
  return all.find(c => c.id === id || c.title === id);
}

function renderDescriptionPage(){
  const titleEl = document.getElementById("descTitle") || document.getElementById("descHeroTitle");
  if(!titleEl) return;
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  let course = findCourseById(id);
  if(!course){
    try{
      const raw = localStorage.getItem("qm_desc_course");
      if(raw) course = JSON.parse(raw);
    }catch(_){}
  }
  if(!course) course = courseRows.rec[0];

  titleEl.textContent = course.title;
  document.title = course.title + " | QMSystem";
  const crumb = document.getElementById("descTitleCrumb");
  if(crumb) crumb.textContent = course.title;
  const trailTitle = document.getElementById("descTrailTitle");
  if(trailTitle) trailTitle.textContent = course.title;
  const heroTitle = document.getElementById("descHeroTitle");
  const heroSub = document.getElementById("descHeroSub");
  if(heroTitle) heroTitle.textContent = course.title;
  const autoDesc = `Learn ${course.title} with a structured, beginner‑friendly course playlist.`;
  if(heroSub) heroSub.textContent = course.description || autoDesc;
  const subtitle = document.getElementById("descSubtitle");
  if(subtitle) subtitle.textContent = course.description || autoDesc;
  const viewsEl = document.getElementById("descViews");
  if(viewsEl) viewsEl.textContent = "Views: " + (course.views || "—");
  const langEl = document.getElementById("descLanguage");
  if(langEl) langEl.textContent = "Language: " + (course.language || "English");
  const channelEl = document.getElementById("descChannel");
  if(channelEl) channelEl.textContent = course.channel || course.by || "Unknown";
  const channelBadge = document.getElementById("descChannelBadge");
  if(channelBadge) channelBadge.textContent = course.channel || course.by || "Channel";
  const langSide = document.getElementById("descLanguageSide");
  if(langSide) langSide.textContent = course.language || "English";
  const creator = document.getElementById("descCreator");
  if(creator) creator.textContent = course.channel || course.by || "Instructor";
  const trail = document.getElementById("descTrail");
  if(trail) trail.dataset.ready = "1";
  const rating = document.getElementById("descRating");
  const ratingsCount = document.getElementById("descRatingsCount");
  const learners = document.getElementById("descLearners");
  if(rating) rating.textContent = "4.7";
  if(ratingsCount) ratingsCount.textContent = "463,405 ratings";
  if(learners) learners.textContent = "1,532,083";

  const sticky = document.getElementById("descSticky");
  const stickyTitle = document.getElementById("descStickyTitle");
  if(sticky && stickyTitle){
    stickyTitle.textContent = course.title;
    const showSticky = () => {
      const y = window.scrollY || document.documentElement.scrollTop;
      if(y > 220){
        sticky.classList.add("is-on");
        sticky.setAttribute("aria-hidden", "false");
      } else {
        sticky.classList.remove("is-on");
        sticky.setAttribute("aria-hidden", "true");
      }
    };
    window.addEventListener("scroll", showSticky);
    showSticky();
  }

  const preview = document.getElementById("descPreview");
  if(preview){
    preview.src = course.preview || "https://www.youtube.com/embed/dQw4w9WgXcQ";
  }

  const progressText = document.getElementById("descProgressText");
  const progressFill = document.getElementById("descProgressFill");
  if(progressText && progressFill){
    const pct = Math.max(0, Math.min(100, course.progress || 0));
    progressText.textContent = pct + "%";
    progressFill.style.width = pct + "%";
  }

  const learn = document.getElementById("descLearn");
  if(learn){
    learn.innerHTML = "";
    (course.learn || ["Build real projects", "Practice with examples", "Learn fundamentals"]).forEach(item => {
      const div = document.createElement("div");
      div.className = "desc__learnItem";
      div.innerHTML = `<span class="desc__learnCheck">✓</span><span>${escapeHtml(item)}</span>`;
      learn.appendChild(div);
    });
  }

  const topics = document.getElementById("descTopics");
  if(topics){
    topics.innerHTML = "";
    (course.topics || ["Programming", "Basics", "Practice"]).forEach(item => {
      const span = document.createElement("span");
      span.textContent = item;
      topics.appendChild(span);
    });
  }

  const includes = document.getElementById("descIncludes");
  if(includes){
    includes.innerHTML = "";
    (course.includes || ["Video lessons", "Notes", "Exercises"]).forEach(item => {
      const div = document.createElement("div");
      div.className = "desc__includeItem";
      div.innerHTML = `<span class="desc__includeIcon">▢</span><span>${escapeHtml(item)}</span>`;
      includes.appendChild(div);
    });
  }

  const contentMeta = document.getElementById("descContentMeta");
  if(contentMeta) contentMeta.textContent = course.contentMeta || "0 sections • 0 lectures • 0h total length";
  const contentList = document.getElementById("descContentList");
  if(contentList){
    contentList.innerHTML = "";
    (course.content || []).forEach(row => {
      const div = document.createElement("div");
      div.className = "desc__contentRow";
      div.innerHTML = `
        <div class="desc__contentTitle">
          <span class="desc__contentChevron">›</span>
          <span>${escapeHtml(row.title)}</span>
        </div>
        <div class="desc__contentMetaRight">${escapeHtml(row.meta)}</div>
      `;
      contentList.appendChild(div);
    });
  }
}

function runSearch(){
  const q = document.getElementById("searchInput").value.trim();
  if(!q){
    toast("Type a search term");
    return;
  }
  toast("Searching: " + q);
}

// Global search suggestions panel
const searchSuggestions = [
  "python",
  "ai",
  "power bi",
  "sql",
  "excel",
  "pmp",
  "javascript",
  "data analysis",
  "web development",
  "react",
  "node.js",
  "cloud computing",
  "cybersecurity"
];

function initSearchPanels(){
  const searches = document.querySelectorAll(".search");
  searches.forEach((search) => {
    if(search.dataset.panelReady === "1") return;
    search.dataset.panelReady = "1";

    const wrap = document.createElement("div");
    wrap.className = "search-wrap";
    search.parentNode.insertBefore(wrap, search);
    wrap.appendChild(search);

    const panel = document.createElement("div");
    panel.className = "search-panel";
    panel.innerHTML = `
      <div class="search-panel__title">Trending</div>
      <ul class="search-panel__list"></ul>
    `;
    wrap.appendChild(panel);

    const list = panel.querySelector(".search-panel__list");
    const input = search.querySelector(".search__input");

    const renderList = (items) => {
      list.innerHTML = "";
      items.forEach((item) => {
        const li = document.createElement("li");
        li.className = "search-panel__item";
        li.innerHTML = `<span class="search-panel__icon">↗</span><span>${item}</span>`;
        li.addEventListener("click", () => {
          input.value = item;
          panel.classList.remove("is-open");
          input.focus();
          runSearch();
        });
        list.appendChild(li);
      });
    };

    renderList(searchSuggestions.slice(0, 8));

    const openPanel = () => panel.classList.add("is-open");
    const closePanel = () => panel.classList.remove("is-open");

    input.addEventListener("focus", () => {
      const q = input.value.trim().toLowerCase();
      const items = q
        ? searchSuggestions.filter((s) => s.includes(q)).slice(0, 8)
        : searchSuggestions.slice(0, 8);
      renderList(items.length ? items : searchSuggestions.slice(0, 8));
      openPanel();
    });

    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      const items = q
        ? searchSuggestions.filter((s) => s.includes(q)).slice(0, 8)
        : searchSuggestions.slice(0, 8);
      renderList(items.length ? items : searchSuggestions.slice(0, 8));
      openPanel();
    });

    document.addEventListener("click", (e) => {
      if(wrap.contains(e.target)) return;
      closePanel();
    });
  });
}

initSearchPanels();

function initLoginRoleToggle(){
  const form = document.querySelector(".login__form");
  if(!form) return;
  const radios = form.querySelectorAll("input[name='role']");
  const roleField = form.querySelector(".login__field");
  const roleLabel = form.querySelector(".login__label--role");
  const roleInput = form.querySelector("#roleId");
  if(!radios.length || !roleField || !roleLabel || !roleInput) return;

  const setRole = (role) => {
    const isProfessor = role === "professor";
    roleLabel.textContent = isProfessor ? "Professor ID" : "Student ID";
    roleInput.placeholder = isProfessor ? "MBC2026-00000" : "MBC2025-00996";
    roleInput.value = "";
    roleField.classList.add("is-showing");
    window.setTimeout(() => roleField.classList.remove("is-showing"), 280);
  };

  const onRoleChange = (e) => {
    const target = e.target;
    if(target && target.name === "role" && target.checked){
      setRole(target.value);
    }
  };

  radios.forEach((radio) => {
    radio.addEventListener("change", onRoleChange);
  });

  form.addEventListener("change", onRoleChange);

  const checked = Array.from(radios).find((r) => r.checked);
  if(checked) setRole(checked.value);
}

if(heroSlideEl){
  let autoTimer = window.setInterval(() => setHero(heroIndex + 1), 6500);
  ["heroPrev","heroNext"].forEach(id => {
    const btn = document.getElementById(id);
    if(!btn) return;
    btn.addEventListener("click", () => {
      window.clearInterval(autoTimer);
      autoTimer = window.setInterval(() => setHero(heroIndex + 1), 6500);
    });
  });
}

renderDescriptionPage();

// Reveal footer on scroll for login/signup pages
const pageFooter = document.querySelector(".page-login .footer, .page-signup .footer");
if(pageFooter){
  const revealFooter = () => {
    const y = window.scrollY || document.documentElement.scrollTop;
    pageFooter.classList.toggle("is-revealed", y > 60);
  };
  window.addEventListener("scroll", revealFooter, { passive: true });
  revealFooter();
}

// Motion + interactions across pages
function initGlobalMotion(){
  if(!document.body) return;
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.body.classList.add("is-loaded");

  const transition = document.createElement("div");
  transition.className = "page-transition";
  document.body.appendChild(transition);
  const loading = document.createElement("div");
  loading.className = "page-loading";
  loading.innerHTML = '<div class="page-loading__bar"></div>';
  document.body.appendChild(loading);

  const isInternalLink = (a) => {
    const href = a.getAttribute("href") || "";
    if(!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return false;
    if(a.target && a.target !== "_self") return false;
    if(a.hasAttribute("download")) return false;
    try{
      const url = new URL(a.href, window.location.href);
      if(url.origin !== window.location.origin) return false;
      if(url.pathname === window.location.pathname && url.search === window.location.search) return false;
      return true;
    }catch(_){
      return false;
    }
  };

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if(!a) return;
    if(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if(!isInternalLink(a)) return;
    e.preventDefault();
    if(reduceMotion){
      window.location.href = a.href;
      return;
    }
    loading.classList.remove("is-done");
    loading.classList.add("is-on");
    transition.classList.add("is-on");
    document.body.classList.add("is-leaving");
    window.setTimeout(() => {
      loading.classList.add("is-done");
      window.location.href = a.href;
    }, 240);
  });

  window.addEventListener("pageshow", () => {
    transition.classList.remove("is-on");
    loading.classList.remove("is-on", "is-done");
  });

  document.querySelectorAll(".banner").forEach((b) => {
    window.requestAnimationFrame(() => b.classList.add("is-in"));
  });

  if(!reduceMotion) initTiltCards(".edu-card");
}

function initTiltCards(selector){
  const cards = document.querySelectorAll(selector);
  if(!cards.length) return;
  const maxDeg = 6;
  cards.forEach((card) => {
    card.addEventListener("mouseenter", () => card.classList.add("is-tilting"));
    card.addEventListener("mouseleave", () => {
      card.classList.remove("is-tilting");
      card.style.removeProperty("--rx");
      card.style.removeProperty("--ry");
    });
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      const rx = (-py * maxDeg).toFixed(2);
      const ry = (px * maxDeg).toFixed(2);
      card.style.setProperty("--rx", rx + "deg");
      card.style.setProperty("--ry", ry + "deg");
    });
  });
}

initGlobalMotion();

initLoginRoleToggle();
document.addEventListener("DOMContentLoaded", initLoginRoleToggle);
window.addEventListener("load", initLoginRoleToggle);

// Remove wishlist/cart/notification icons across pages
document.querySelectorAll(".top__icons .iconbtn").forEach((btn) => btn.remove());

function readHomeUser(){
  try{
    const raw = localStorage.getItem("qm_home_user");
    if(!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      name: parsed?.name || "",
      email: parsed?.email || "",
      image: parsed?.image || "",
      role: parsed?.role || "",
      roleId: parsed?.roleId || ""
    };
  }catch(_){
    return null;
  }
}

function getInitials(name, email){
  const source = (name || email || "User").trim();
  if(!source) return "U";
  return source.charAt(0).toUpperCase();
}

function roleLabel(role){
  if(role === "student") return "Student ID";
  if(role === "professor") return "Professor ID";
  return "ID";
}

function setAvatarVisual(el, image, initials){
  if(!el) return;
  if(image){
    el.style.backgroundImage = `url("${image}")`;
    el.style.backgroundSize = "cover";
    el.style.backgroundPosition = "center";
    el.style.color = "transparent";
    el.style.textIndent = "-9999px";
    el.textContent = initials;
    return;
  }
  el.style.backgroundImage = "";
  el.style.backgroundSize = "";
  el.style.backgroundPosition = "";
  el.style.color = "";
  el.style.textIndent = "";
  el.textContent = initials;
}

function applyHomeUserToPage(homeUser){
  const displayName = homeUser?.name || homeUser?.roleId || homeUser?.email?.split("@")[0] || "User";
  const heading = document.querySelector(".welcome .h1");
  if(heading) heading.textContent = `${t("welcomeBack")}, ${displayName}`;

  const initials = getInitials(homeUser?.name, homeUser?.email);
  document.querySelectorAll(".avatar, .avatar--big").forEach((avatarEl) => {
    setAvatarVisual(avatarEl, homeUser?.image, initials);
  });
}

function applyUiLanguageToHomepage(){
  const addBtn = document.getElementById("addInterestsBtn");
  if(addBtn) addBtn.textContent = t("addInterests");

  const learnTitle = document.querySelector(".block .h2");
  if(learnTitle) learnTitle.textContent = t("whatToLearn");

  const learnSubtitle = document.querySelector(".block .muted");
  if(learnSubtitle) learnSubtitle.textContent = t("recommendedForYou");

  const title = document.getElementById("interestsTitle");
  if(title) title.textContent = t("interestsTitle");
  const desc = document.getElementById("interestsDesc");
  if(desc) desc.textContent = t("interestsDesc");
  const coursesLabel = document.getElementById("interestsCoursesLabel");
  if(coursesLabel) coursesLabel.textContent = t("courses");
  const topicsLabel = document.getElementById("interestsTopicsLabel");
  if(topicsLabel) topicsLabel.textContent = t("topics");
  const noneLabel = document.getElementById("interestsNoneLabel");
  if(noneLabel) noneLabel.textContent = t("interestsNone");
  const customLabel = document.getElementById("interestsCustomLabel");
  if(customLabel) customLabel.textContent = t("customInterests");
  const customInput = document.getElementById("interestCustom");
  if(customInput) customInput.placeholder = t("customPlaceholder");
  const cancelBtn = document.getElementById("interestsCancel");
  if(cancelBtn) cancelBtn.textContent = t("cancel");
  const saveBtn = document.getElementById("interestsSave");
  if(saveBtn) saveBtn.textContent = t("saveInterests");

  setInterestSummary(userInterests);
  applyHomeUserToPage(homeUser);
}

const homeUser = readHomeUser();
applyHomeUserToPage(homeUser);
applyUiLanguageToHomepage();
initInterestsModal();

// Profile dropdown (click/focus)
function initProfileMenu(){
  const avatars = document.querySelectorAll(".top__icons .avatar");
  const menus = [];

  const closeAll = () => menus.forEach((m) => m.classList.remove("is-open"));

  avatars.forEach((btn) => {
    if(btn.dataset.menuReady === "1") return;
    btn.dataset.menuReady = "1";
    const wrap = btn.parentElement;
    if(!wrap) return;
    wrap.style.position = "relative";

    const displayName = homeUser?.name || homeUser?.roleId || homeUser?.email?.split("@")[0] || "User";
    const displayEmail = homeUser?.email || "No email";
    const displayRole = homeUser?.roleId
      ? `${roleLabel(homeUser?.role)}: ${homeUser.roleId}`
      : (homeUser?.role ? roleLabel(homeUser.role) : "");
    const initials = getInitials(homeUser?.name, homeUser?.email);

    const menu = document.createElement("div");
    menu.className = "profile-menu";
    menu.innerHTML = `
      <div class="profile-menu__head">
        <div class="profile-menu__avatar">${escapeHtml(initials)}</div>
        <div>
          <div class="profile-menu__name">${escapeHtml(displayName)}</div>
          <div class="profile-menu__email">${escapeHtml(displayEmail)}</div>
          ${displayRole ? `<div class="profile-menu__meta">${escapeHtml(displayRole)}</div>` : ""}
        </div>
      </div>
      <div class="profile-menu__divider"></div>
      <div class="profile-menu__group">
        <a class="profile-menu__item" href="/account-settings" target="_top">${escapeHtml(t("accountSettings"))}</a>
        <a class="profile-menu__item" href="/profile" target="_top">${escapeHtml(t("insights"))}</a>
        <a class="profile-menu__item" href="/public-profile" target="_top">${escapeHtml(t("publicProfile"))}</a>
      </div>
      <div class="profile-menu__divider"></div>
      <div class="profile-menu__group">
        <label class="profile-menu__langRow">
          <span class="profile-menu__langLabel">${escapeHtml(t("language"))}:</span>
          <select class="profile-menu__langSelect" id="profileLangSelect">
            <option value="en"${currentUiLanguage === "en" ? " selected" : ""}>${LANGUAGE_LABELS.en}</option>
            <option value="fil"${currentUiLanguage === "fil" ? " selected" : ""}>${LANGUAGE_LABELS.fil}</option>
            <option value="es"${currentUiLanguage === "es" ? " selected" : ""}>${LANGUAGE_LABELS.es}</option>
          </select>
        </label>
        <a class="profile-menu__item" href="/admin-dashboard" target="_top">${escapeHtml(t("adminDashboard"))}</a>
      </div>
      <div class="profile-menu__divider"></div>
      <div class="profile-menu__group profile-menu__group--logout">
        <button class="profile-menu__logoutBtn profile-menu__item--logout" type="button">${escapeHtml(t("logOut"))}</button>
      </div>
    `;
    wrap.appendChild(menu);
    menus.push(menu);
    setAvatarVisual(btn, homeUser?.image, initials);
    setAvatarVisual(menu.querySelector(".profile-menu__avatar"), homeUser?.image, initials);

    const logoutBtn = menu.querySelector(".profile-menu__item--logout");
    const langSelect = menu.querySelector("#profileLangSelect");

    if(langSelect){
      langSelect.addEventListener("change", (e) => {
        const next = e.target && e.target.value ? e.target.value : "en";
        currentUiLanguage = UI_TEXT[next] ? next : "en";
        saveUiLanguage(currentUiLanguage);
        applyUiLanguageToHomepage();
        closeAll();
        document.querySelectorAll(".profile-menu").forEach((m) => m.remove());
        avatars.forEach((avatarBtn) => {
          avatarBtn.dataset.menuReady = "";
        });
        initProfileMenu();
      });
    }

    if(logoutBtn){
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if(window.parent && window.parent !== window){
          window.parent.postMessage({ type: "QM_SIGN_OUT" }, window.location.origin);
          return;
        }
        window.location.href = "/sign-in";
      });
    }

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = menu.classList.contains("is-open");
      closeAll();
      if(!isOpen) menu.classList.add("is-open");
    });
    btn.addEventListener("focus", () => {
      closeAll();
      menu.classList.add("is-open");
    });
    menu.addEventListener("click", (e) => e.stopPropagation());
  });

  document.addEventListener("click", () => closeAll());
  document.addEventListener("keydown", (e) => {
    if(e.key === "Escape") closeAll();
  });
}

initProfileMenu();
