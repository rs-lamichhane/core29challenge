🎨 1. The UI/UX Architecture Document (For the Humans)
To make this feel like a futuristic, mobile-friendly PWA, we are going to use a "Dark Mode Glassmorphism" design language. It looks like a high-end FinTech app (like Revolut or Apple Wallet), which perfectly fits our "Carbon Bank" narrative.

The Tech Stack: React (via Vite) + Tailwind CSS (for instant, responsive styling) + Framer Motion (for the smooth, futuristic animations and the Volumetric Smoke).

Color Palette:

Background: Deep Space Black (#0F172A) - Saves battery on OLED screens and makes colors pop.

The "Good" Accents: Neon Mint (#10B981) and Electric Cyan (#06B6D4).

The "Bad" Accent (For Loss Aversion): Alert Crimson (#EF4444).

Typography: 'Inter' or 'Space Grotesk' (Google Fonts). Clean, geometric, and highly readable on mobile.

Navigation: A standard iOS-style Bottom Tab Bar. Do not use a hamburger menu; they hide features and add friction.

Tabs: 🏦 Bank (Dashboard) | 📍 Route (Input) | 🌍 Network (Influence Tree).

🤖 2. The Agentic Prompt Library (For the AI)
Do not ask your AI to "build the app." Paste these exact prompts, one by one, into your AI coding tool (or directly to me) to generate the responsive, mobile-first components.

Prompt 1: The App Shell & Navigation (The Foundation)
Copy/Paste this:
"Act as an expert UX/UI frontend developer. I am building a mobile-first PWA in React using Tailwind CSS and Lucide React for icons. Create the main App.jsx layout. It must have a dark mode background (bg-slate-900), and a fixed Bottom Navigation Bar with three icons: 'Dashboard', 'Commute', and 'Network'. The main content area should be a scrollable container above the nav bar. Make it perfectly responsive for mobile screens."

Prompt 2: The Carbon Bank Dashboard (The Core Feature)
Copy/Paste this:
"Create a React component called CarbonBank.jsx using Tailwind CSS. It should use a 'Glassmorphism' style (semi-transparent backgrounds with backdrop blur).

At the top, show a massive, bold 'Carbon Balance' of 42.5 kg.

Below it, show a 'Smart Grid Status' card that is glowing Neon Mint, saying 'Aberdeen Grid: 82% Wind Power. E-Bikes are zero-emission today!'

Below that, create a 'Recent Transactions' list showing completed commutes (e.g., 'Bus to RGU: +0kg', 'Drive to Union St: -4.2kg' in red). Ensure the padding and touch targets are large and mobile-friendly."

Prompt 3: The "Volumetric Smoke" UI (The Innovation Winner)
Copy/Paste this:
"Create a React component called RoutePlanner.jsx using Tailwind CSS and Framer Motion.

It needs a simple form: 'From', 'To', and a toggle button for 'Car' vs 'Walk/Bus'.

Crucial Feature: When the user toggles to 'Car', use Framer Motion to animate a dark, semi-transparent div (representing smog) that scales up from the bottom of the screen, obscuring the lower half of the UI. Add text over the smoke saying: 'Warning: This journey will emit 2.5 cubic meters of pure CO2.' This must feel immersive and disruptive."

⚡ 3. The "Golden Rule" for PWA UX
Since you are presenting this on a screen or a phone tomorrow:

Fake the Delays: When a user clicks "Calculate Route," add a fake 1.5-second loading spinner that says "Syncing with Scottish National Grid..." It makes the app feel vastly more intelligent and complex than it actually is.

Keep Inputs Massive: Hackathon demos fail when buttons are too small to tap. Use Tailwind's p-4 or p-5 on all buttons.