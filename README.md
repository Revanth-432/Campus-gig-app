# ⚡ CampusGig 
**The Hyper-Local Marketplace for VNRVJIET Students** *(Built for Webathon 4.0 by ACM VNRVJIET)*

CampusGig is a real-time, cross-platform gig economy app designed to connect students who need quick tasks done with peers looking to earn extra rewards. From grabbing a printout at SAC to finding a coding tutor, CampusGig makes campus life more efficient.

> "We didn't just build a mobile app; we built a unified cross-platform ecosystem. By utilizing React Native Web and Supabase, our codebase simultaneously compiles to Android, iOS, and the Web, ensuring every student at VNRVJIET can access the marketplace regardless of what device they own."

---

## 🛠️ Tech Stack
* **Frontend:** React Native (Expo) & NativeWind (Tailwind CSS)
* **Web Support:** React Native Web
* **Backend:** Supabase (PostgreSQL, Auth, Real-time)
* **Deployment:** EAS (Android APK) & Netlify (Web Version)
* **Iconography:** Lucide-React-Native

---

## ✨ Key Features

### 🔄 Approval Workflows
* **1-Step (Instant Claim):** Ideal for simple, low-stakes tasks (e.g., "Bring me a water bottle"). The first student to click "Claim" gets the gig immediately.
* **2-Step (Application & Approval):** For skilled tasks like "Fix my laptop." Multiple students apply, and the creator reviews profiles before manually "Approving" the best fit.

### 📍 Task Types
* **On-Campus (Location-Based):** Utilizes an Interactive Map for physical errands like food delivery or moving equipment across campus.
* **Online (Remote Skills):** Skill-based tasks like debugging code or graphic design, appearing in a dedicated Grid View.

### ⚡ Performance & Logic
* **Instant:** The "Available Now" feed, powered by **Supabase Real-time**, for urgent tasks needing completion in 1-2 hours.
* **Feasible:** A general list for time-insensitive tasks that students can browse and fit into their schedules.

---

## 📦 Installation & Usage

### 📱 Mobile (Android)
1. Download the APK from our [Latest EAS Build](https://expo.dev/accounts/sknayaz55/projects/web/builds/f7080f66-349f-410a-ab7c-8a1a88600564).
2. Allow **"Install from Unknown Sources"** on your device.
3. Launch **CampusGig** and log in with your credentials.

### 🌐 Web Demo
Visit our live site at: [campus-gig-webathon.netlify.app](https://campus-gig-webathon.netlify.app/)

---

## 👥 Team Contribution

| Name | Role | Core Contributions |
| :--- | :--- | :--- |
| **A Revanth** | **Team Leader** | Full-stack architecture, Supabase integration, EAS Android builds, and Web deployment. |
| **Sk Nayaz Ahmed** | **UI/UX & Frontend** | Figma design, NativeWind styling, and Dashboard/Profile screen implementation. |
| **M Sri Varsha** | **Backend & Logic** | SQL schema, Row Level Security (RLS) rules, and real-time task logic. |
| **U Pinakapani** | **Quality & Testing** | Bug fixing, dependency management, and documentation. |

---

## 💻 Local Development
```bash
# Clone the repo
git clone [https://github.com/sk-nayaz/Campus-gig-app.git](https://github.com/sk-nayaz/Campus-gig-app.git)

# Install dependencies
npm install

# Start the project
npx expo start
