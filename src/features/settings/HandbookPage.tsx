import { Link } from 'react-router-dom'
import { scenarios } from '@/data'

export function HandbookPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 pb-24">
      {/* Back link */}
      <Link
        to="/settings"
        className="mb-6 block text-sm text-zinc-500 hover:text-amber-400 transition-colors"
      >
        ← Back to settings
      </Link>

      <div className="prose prose-zinc prose-invert max-w-none">
        <h1 className="mb-2 text-3xl font-bold text-amber-500">User Handbook</h1>
        <p className="mb-8 font-semibold text-zinc-300">
          Gloomhaven: Jaws of the Lion - Unofficial Companion App
        </p>

        <p className="mb-6 text-zinc-400">
          Welcome to the unofficial companion app for <em className="italic text-zinc-300">Gloomhaven: Jaws of the Lion</em>. This tool is designed to streamline your campaign management, track character progression, and assist with scenario setup and conclusion.
        </p>

        <hr className="my-8 border-zinc-800" />

        <section className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-amber-500">1. Getting Started</h2>
          
          <h3 className="mb-2 text-lg font-semibold text-zinc-200">Installation</h3>
          <p className="mb-4 text-zinc-400">
            This app is a <strong className="font-semibold text-zinc-200">Progressive Web App (PWA)</strong>. You can use it directly in your browser or install it to your device for an app-like experience.
          </p>
          <ul className="mb-6 list-disc space-y-2 pl-5 text-zinc-400">
            <li><strong className="font-semibold text-zinc-200">Desktop (Chrome/Edge):</strong> Click the "Install" icon in the address bar.</li>
            <li><strong className="font-semibold text-zinc-200">Mobile (iOS Safari):</strong> Tap "Share" → "Add to Home Screen".</li>
            <li><strong className="font-semibold text-zinc-200">Mobile (Android Chrome):</strong> Tap "Menu" → "Install App".</li>
          </ul>

          <h3 className="mb-2 text-lg font-semibold text-zinc-200">Your First Campaign</h3>
          <ol className="list-decimal space-y-2 pl-5 text-zinc-400">
            <li>On the home screen, you will see a welcome message.</li>
            <li>Tap <strong className="font-semibold text-zinc-200 block mt-1 text-amber-400/80">"+ New Campaign"</strong> (or use the open creation form if it's your first time).</li>
            <li>Enter a name for your campaign and press Enter or click Create.</li>
          </ol>
        </section>

        <hr className="my-8 border-zinc-800" />

        <section className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-amber-500">2. Managing Campaigns</h2>
          <p className="mb-4 text-zinc-400">The home screen displays your campaigns.</p>
          <ul className="list-disc space-y-2 pl-5 text-zinc-400">
            <li><strong className="font-semibold text-zinc-200">Active Campaign:</strong> The campaign you are currently playing is highlighted at the top with detailed progress stats. Click "Continue Campaign" to jump in.</li>
            <li><strong className="font-semibold text-zinc-200">Switching Campaigns:</strong> Scroll down to the "All Campaigns" list and tap any campaign to switch to it.</li>
            <li><strong className="font-semibold text-zinc-200">Deleting a Campaign:</strong> Tap the "×" icon on a campaign card. You will be asked to confirm before the data is permanently erased.</li>
          </ul>
        </section>

        <hr className="my-8 border-zinc-800" />

        <section className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-amber-500">3. Campaign Dashboard</h2>
          <p className="mb-4 text-zinc-400">Once inside a campaign, you'll see the <strong className="font-semibold text-zinc-200">Campaign Dashboard</strong>. The header shows your overall progress (scenarios completed vs. total).</p>
          
          <h3 className="mb-2 text-lg font-semibold text-zinc-200">The "Party" Tab</h3>
          <ul className="mb-6 list-disc space-y-2 pl-5 text-zinc-400">
            <li><strong className="font-semibold text-zinc-200">Party Members:</strong> Shows all characters in your party (up to 4).</li>
            <li><strong className="font-semibold text-zinc-200">Adding Characters:</strong> Use the form at the bottom of the list. Select a class, enter a name, and tap "Add Character".</li>
            <li><strong className="font-semibold text-zinc-200">What's Next:</strong> A smart card that tells you exactly which scenario to play next based on your unlocks.</li>
          </ul>

          <h3 className="mb-2 text-lg font-semibold text-zinc-200">The "Scenarios" Tab</h3>
          <p className="mb-4 text-zinc-400">This tab tracks the state of all {scenarios.length} scenarios in the game.</p>
          <ul className="list-disc space-y-2 pl-5 text-zinc-400">
            <li><strong className="font-semibold text-zinc-200 text-zinc-500">Locked (Gray):</strong> You cannot play this yet. Tap to manually unlock (e.g. from a City Event).</li>
            <li><strong className="font-semibold text-zinc-200 text-amber-500">Unlocked (Amber):</strong> Available to play. Tap to mark as completed.</li>
            <li><strong className="font-semibold text-zinc-200 text-emerald-500">Completed (Green):</strong> Already finished. Tap to revert if needed.</li>
            <li><strong className="font-semibold text-zinc-200">Goals:</strong> Each card displays the scenario's objective (e.g., "Kill all enemies").</li>
          </ul>
        </section>

        <hr className="my-8 border-zinc-800" />

        <section className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-amber-500">4. Character Sheet</h2>
          <p className="mb-4 text-zinc-400">Tap any character card in the Party list to open their <strong className="font-semibold text-zinc-200">Character Sheet</strong>.</p>
          <ul className="list-disc space-y-2 pl-5 text-zinc-400">
            <li><strong className="font-semibold text-zinc-200">Stats:</strong> Manage Level, Experience (XP), and Gold. Leveling up automatically increases HP and adjusts Perk count.</li>
            <li><strong className="font-semibold text-zinc-200">Checkmarks:</strong> Track battle goal checkmarks. Every 3 checkmarks grant a Perk.</li>
            <li><strong className="font-semibold text-zinc-200">Perks:</strong> Select perks as you earn them. The app validates that you don't exceed your earned perks.</li>
            <li><strong className="font-semibold text-zinc-200">Items:</strong> Browse the Shop to buy items or manage your Inventory. Slot limits are enforced.</li>
          </ul>
        </section>

        <hr className="my-8 border-zinc-800" />

        <section className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-amber-500">5. Tools & Utilities</h2>
          <p className="mb-4 text-zinc-400">The Campaign Dashboard provides quick access to essential tools.</p>
          
          <h3 className="mb-2 text-lg font-semibold text-zinc-200">Scenario Level Calculator</h3>
          <p className="mb-4 text-zinc-400 italic">Located in the "Tools" section of the Party tab.</p>
          <ul className="mb-6 list-disc space-y-2 pl-5 text-zinc-400">
            <li><strong className="font-semibold text-zinc-200">Party Overview:</strong> Shows everyone's level and the calculated average.</li>
            <li><strong className="font-semibold text-zinc-200">Difficulty Selector:</strong> Choose Easy, Normal, Hard, or Very Hard.</li>
            <li><strong className="font-semibold text-zinc-200">Results:</strong> Instantly see Monster Level, Trap Damage, Gold Conversion, and Bonus XP.</li>
          </ul>

          <h3 className="mb-2 text-lg font-semibold text-zinc-200">Post-Scenario Checklist</h3>
          <p className="mb-4 text-zinc-400 italic">Located in the "Tools" section of the Party tab.</p>
          <ul className="list-disc space-y-2 pl-5 text-zinc-400">
            <li>Use this after finishing a game session to record XP and Gold.</li>
            <li><strong className="font-semibold text-zinc-200">Gold Calculator:</strong> Enter looted tokens to calculate total gold based on scenario level.</li>
            <li><strong className="font-semibold text-zinc-200">Step-by-Step Guide:</strong> Ensures you don't miss conclusion text, rewards, or record updates.</li>
          </ul>
        </section>

        <hr className="my-8 border-zinc-800" />

        <section className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-amber-500">6. Rules & Reference</h2>
          <p className="mb-4 text-zinc-400">Access the <strong className="font-semibold text-zinc-200">Rules</strong> section via the bottom navigation bar.</p>
          <ul className="list-disc space-y-2 pl-5 text-zinc-400">
            <li><strong className="font-semibold text-zinc-200">Glossary:</strong> A searchable dictionary of game terms.</li>
            <li><strong className="font-semibold text-zinc-200">Reference:</strong> Digital cards for round structure, condition tokens, and elements.</li>
            <li><strong className="font-semibold text-zinc-200">Focus Helper:</strong> An interactive tool to determine monster focus using the proximity and initiative rules.</li>
          </ul>
        </section>

        <hr className="my-8 border-zinc-800" />

        <section className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-amber-500">7. Settings & Data</h2>
          <ul className="list-disc space-y-2 pl-5 text-zinc-400">
            <li><strong className="font-semibold text-zinc-200">Data Management:</strong> Export backups or import them to transfer campaigns.</li>
            <li><strong className="font-semibold text-zinc-200">Reset App:</strong> Permanently deletes all local data.</li>
            <li><strong className="font-semibold text-zinc-200">About:</strong> Version, author, and license details.</li>
          </ul>
        </section>

        <hr className="my-8 border-zinc-800" />

        <footer className="mt-12 text-center">
          <p className="text-sm font-semibold text-zinc-300">Author: Lukas Walek</p>
          <p className="text-sm text-zinc-500">License: GNU GPLv3</p>
          <p className="mt-4 text-xs text-zinc-600 italic">
            Disclaimer: This is an unofficial fan project and is not affiliated with Cephalofair Games.
          </p>
        </footer>
      </div>
    </div>
  )
}
