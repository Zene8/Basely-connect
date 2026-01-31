# UI Specification: GitMatch Modern Dark (State Archive)

**Commit Hash:** [INSERT_COMMIT_HASH_HERE]
**Date:** January 31, 2026

This document describes the visual and interactive state of the UI in the `github-matcher-nextjs New` folder. Use this as a reference to recreate the "Modern Dark" aesthetic in future branches.

---

## 🎨 Design System

### 1. Color Palette (Dark Mode)
*   **Backgrounds:**
    *   Primary: `#09090b` (Deep Black/Gray)
    *   Secondary: `#18181b` (Card backgrounds)
    *   Tertiary: `#27272a` (Input fields, hover states)
*   **Typography:**
    *   Primary: `#fafafa` (Pure White)
    *   Secondary: `#a1a1aa`
    *   Muted: `#71717a`
    *   Dim: `#52525b`
*   **Accents:**
    *   Cyan: `#22d3ee` (Primary brand color, links, buttons)
    *   Purple: `#a78bfa` (Secondary highlights)
    *   Green: `#34d399` (Success, match indicators)
    *   Amber: `#fbbf24` (Missing skills/warnings)

### 2. Typography
*   **Display:** `Outfit` (Sans-serif) - Used for headings and primary UI elements.
*   **Technical:** `JetBrains Mono` (Monospace) - Used for code tags, data points, and labels.

### 3. Background Effects
*   **Grid Overlay:** A fixed background pattern of `1px` cyan lines (3% opacity) spaced every `60px`.
*   **Animated Orbs:** Three large, blurred radial gradients that slowly float across the screen:
    *   Orb 1 (Top-Right): Cyan (15% opacity).
    *   Orb 2 (Bottom-Left): Purple (10% opacity).
    *   Orb 3 (Center): Green (8% opacity).

---

## 🧱 Component Architecture

### 1. Landing View
*   **Navbar:** Minimalist glassmorphism style. Contains logo (hexagon icon), links (Companies, How it works), and buttons (For Employers, Sign In).
*   **Hero Section:**
    *   **Badge:** "AI-Powered Matching" with a pulsing dot.
    *   **Title:** Large clamp-sized heading with a three-color animated gradient on "want your skills."
    *   **Input Area:** A wide input with a GitHub icon and a "Find My Matches" button that features a glow animation.
    *   **Analysis Steps:** Shows three steps (Scanning, Extracting, Matching) that animate into view with checkmarks during the loading sequence.
    *   **Stats:** Large numbers (12,000+) with mono labels.
*   **Company Profiles Grid:**
    *   Cards with thin borders that brighten on hover.
    *   Attributes (languages) displayed as tags.
    *   Expandable "View All Attributes" section revealing detailed tech requirements and culture info.
*   **How It Works:** Numbered cards (01, 02, 03) with abstract icons and high-contrast step numbers in the corner.

### 2. Results View
*   **Header:** Identifies the analyzed profile with cyan highlight.
*   **Analysis Summary:** A gradient-bordered card containing:
    *   Detected languages as mono tags.
    *   Inferred frameworks.
    *   Grid of stats: Repositories, Total Size, and Top Stars.
*   **Match Cards:**
    *   Vertical list of companies.
    *   **Match Badge:** Large bold percentage with color-coded label (Excellent, Good, etc.).
    *   **Progress Bar:** Smooth fill animation showing the score.
    *   **Expandable Details:** Deep dive into specific matched languages/frameworks/skills vs. "Skills to Learn" (missing attributes).

---

## ✨ Animations & Interactions
*   **Transitions:** All buttons and cards have `0.2s` to `0.3s` ease-in-out transitions.
*   **Keyframes:**
    *   `float`: Subtle vertical movement for background orbs.
    *   `slideUp`: Elements entrance animation.
    *   `glow`: Pulsing box-shadow for primary buttons.
    *   `gradient`: Shifting background-position for the title text.
*   **Loading:** Custom spinner and staggered step-activation logic in `page.js`.

---

## 🛠️ Logic Summary
*   **Analysis:** Performed client-side via the GitHub API (`/users/{user}/repos`).
*   **Scoring:** Weighted calculation based on:
    *   Languages (40%)
    *   Frameworks (35%)
    *   Skills (25%)
*   **Filtering:** Heuristic overlap matching between user's extracted languages and company attribute lists.
