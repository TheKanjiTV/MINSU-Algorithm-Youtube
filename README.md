![MIT License](https://img.shields.io/badge/license-MIT-green)
# 🎓 YouTube Learning Platform

Welcome to **YouTube Learning Platform**, a structured and interactive way to learn from YouTube playlists. This platform transforms YouTube videos into a course-like experience with features like progress tracking, quizzes, assignments, and documentation resources. 🚀

---

## 🌟 Features

- **📚 Structured Learning**: Organize YouTube playlists into structured courses.
- **✅ Progress Tracking**: Track your progress for each video and playlist.
- **📝 Notes**: Take notes while watching videos to reinforce learning.
- **🧠 Quizzes & Assignments**: Test your knowledge with quizzes and assignments.
- **📄 Documentation**: Access curated resources like articles, GitHub repositories, and tutorials.
- **🔒 Authentication**: Secure sign-up and login using Clerk.
- **🎨 Dark Mode**: Beautiful dark mode for a better viewing experience.

---

## 🖼️ Demo videos
[Watch Demo Video](https://x.com/AnuragOjha8355/status/1918195374335889569)

![Shots](https://github.com/intojhanurag/Yt-Learn/blob/14147ab396cd8c0fa51679cc95ce5939b04f7c1c/Screenshot%202025-04-30%20191851.png)

## 🚀 Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/), [React](https://reactjs.org/), [Tailwind CSS](https://tailwindcss.com/)
- **Backend**: [Node.js](https://nodejs.org/), [Mongoose](https://mongoosejs.com/)
- **Authentication**: [Clerk](https://clerk.dev/)
- **Database**: [MongoDB](https://www.mongodb.com/)
- **APIs**: YouTube Data API, Custom GROQ API

---

## 🛠️ Installation

### Prerequisites
- Node.js (v16+)
- YouTube Data API Key
- Clerk API Key

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/your-repo-name.git
   cd your-repo-name
2. Install dependencies
   pnpm install
3. Create a .env file in the root directory and add the following:
  NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key
  GROQ_API_KEY=your_groq_api_key
  MONGO_URI=your_mongodb_connection_string
  CLERK_API_KEY=your_clerk_api_key
4. Run the development server
   pnpm dev
5. Open http://localhost:3000 in your browser.

## Offline Support (Service Worker)

This app now includes a custom Service Worker (`public/sw.js`) for app-shell offline support.

### What is cached
- App shell/static build assets (`/_next/static`, `.js`, `.css`, `.html`) with cache-first strategy.
- Navigation/document responses for visited pages.
- Images and fonts with cache-first strategy and cache-size trimming.

### What is not cached
- API routes (`/api/*`) are intentionally excluded from caching.

### Update behavior
- When a new Service Worker is installed and waiting, the app shows:
  - **Update available**
  - Buttons: **Update** and **Later**
- Clicking **Update** sends `SKIP_WAITING` to the waiting worker and reloads when activated.

### Build and test offline
1. Build and run production:
   ```bash
   npm run build
   npm run start
   ```
2. Open the app once while online (to warm caches).
3. In DevTools, set Network to **Offline**.
4. Reload:
   - Visited app-shell pages should still load.
   - Unknown uncached navigations fall back to `offline.html`.

### Test update flow
1. Start production (`npm run start`) from a built version.
2. Change a visible string in the app and run `npm run build` again.
3. Refresh the app.
4. Confirm **Update available** appears.
5. Click **Update** and verify the page reloads with new content.

🛡️ Security
Environment Variables: Sensitive keys like API keys are stored in .env files.
Authentication: User authentication is handled securely using Clerk.

🧑‍💻 Contributing
We welcome contributions! Follow these steps to contribute:

1. Fork the repository.
2. Create a new branch:
  git checkout -b feature-name
3. Commit your changes
   git commit -m "Add your message here"
4. push to your branch
   git push origin feature-name
5. Open to pull request

📜 License
This project is licensed under the MIT License.

🙌 Acknowledgments
Clerk for authentication.
Tailwind CSS for styling.
YouTube Data API for video data.
MongoDB for database management.

📧 Contact
For any questions or feedback, feel free to reach out:

⭐ Star the Repository
If you found this project helpful, please give it a ⭐ on GitHub!


