# Gloomhaven: Jaws of the Lion - Unofficial Companion App

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-GPLv3-green.svg)
![React](https://img.shields.io/badge/react-19.0-blue)
![PWA](https://img.shields.io/badge/PWA-Ready-purple)

A feature-rich, offline-first companion app for the board game **Gloomhaven: Jaws of the Lion**. Designed to streamline campaign tracking, character management, and rules lookup without replacing the physical tabletop experience.

---

## 🚀 Features

- **Campaign Management**: Track multiple campaigns, scenario unlocks, and party progress.
- **Character Sheets**: Manage HP, XP, Gold, Items, Perks, and Battle Goals.
- **Scenario Tracker**: Visualizes locked, unlocked, and completed scenarios with goals.
- **Tools & Calculators**:
  - Scenario Level Calculator (based on party avg & difficulty).
  - Post-Scenario Checklist (Gold conversion, Bonus XP, etc.).
  - Monster Focus Helper (interactive wizard).
- **Rules Reference**:
  - Searchable Glossary (Conditions, Keywords).
  - Quick Reference Cards (Elements, Round Structure).
- **Offline First**: Fully functional offline as a Progressive Web App (PWA).
- **Data Portability**: Export/Import your campaign data as JSON backups.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript 5.9, Vite 7
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand 5
- **Persistence**: Dexie.js (IndexedDB)
- **Validation**: Zod v4

## 📖 Documentation

- **[In-App Handbook]**: Accessible via Settings > How to Use.

## 📦 Getting Started

### Prerequisites
- Node.js 20+
- pnpm (recommended) or npm

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/jotl-companion.git
    cd jotl-companion
    ```

2.  **Install dependencies**
    ```bash
    pnpm install
    ```

3.  **Start the development server**
    ```bash
    pnpm dev
    ```

4.  **Build for production**
    ```bash
    pnpm build
    ```

## 📄 License

This project is licensed under the **GNU General Public License v3.0**. See the [LICENSE](LICENSE) file for details.

## ✍️ Author

**Sinimus**
- Email: sinimus@noreply (obfuscated)

---
*Disclaimer: This is an unofficial fan project and is not affiliated with Cephalofair Games.*