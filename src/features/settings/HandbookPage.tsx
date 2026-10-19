import { Link } from 'react-router-dom'
import { scenarios } from '@/data'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'

export function HandbookPage() {
  useDocumentTitle('User Handbook')
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 pb-24">
      {/* Back link */}
      <Link
        to="/settings"
        className="mb-4 inline-flex min-h-11 items-center text-sm text-zinc-400 transition-colors hover:text-amber-400"
      >
        ← Back to settings
      </Link>

      <div>
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
            <li>On the home screen, you will see the app introduction and feature overview.</li>
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
            <li><strong className="font-semibold text-zinc-500">Locked (Gray):</strong> You cannot play this yet. Tap to manually unlock (e.g. from a City Event).</li>
            <li><strong className="font-semibold text-amber-500">Unlocked (Amber):</strong> Available to play. Tap to mark as completed by hand; to record gold, experience and rewards as well, use Finish Scenario.</li>
            <li><strong className="font-semibold text-emerald-500">Completed (Green):</strong> Already finished. Tap to revert if needed.</li>
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
            <li><strong className="font-semibold text-zinc-200">Ability Cards:</strong> Choose the hand for the next scenario from the cards available at this point of the campaign, within the hand size. After a level-up, add one card of that level or lower; the panel opens by itself when a card is waiting.</li>
            <li><strong className="font-semibold text-zinc-200">Items:</strong> Browse the Shop to buy items or manage your Inventory. Slot limits are enforced. A sold item goes into the shop and can be bought there again, a reward item too (Rules Glossary p.19).</li>
          </ul>
        </section>

        <hr className="my-8 border-zinc-800" />

        <section className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-amber-500">5. Tools & Utilities</h2>
          <p className="mb-4 text-zinc-400">The Campaign Dashboard provides quick access to essential tools.</p>
          
          <h3 className="mb-2 text-lg font-semibold text-zinc-200">Learning Scenarios 1–5</h3>
          <ul className="mb-6 list-disc space-y-2 pl-5 text-zinc-400">
            <li>What the Learn to Play Guide introduces before each of the first five scenarios and what changes after it, with the cards of your party by name.</li>
          </ul>

          <h3 className="mb-2 text-lg font-semibold text-zinc-200">Set Up Scenario</h3>
          <ul className="mb-6 list-disc space-y-2 pl-5 text-zinc-400">
            <li><strong className="font-semibold text-zinc-200">Next scenario:</strong> level, trap damage, battle goals and whether every hand is ready; monsters and rewards only after you reveal them.</li>
            <li><strong className="font-semibold text-zinc-200">Scenario level:</strong> party levels and difficulty give the monster level, trap damage, gold per token and bonus experience.</li>
          </ul>

          <h3 className="mb-2 text-lg font-semibold text-zinc-200">Finish Scenario</h3>
          <ul className="list-disc space-y-2 pl-5 text-zinc-400">
            <li>Enter the money tokens, the experience on each dial and the battle goals, choose who takes a reward item, then record: gold, experience, checkmarks, perks and items go onto the character sheets and the scenario is completed with its unlocks and closes.</li>
            <li>A lost attempt records gold and experience only; the scenario stays open.</li>
            <li>Afterwards a list of what is left at the table: stickers, shop items, card changes, level-ups, the city event and the refresh.</li>
          </ul>
        </section>

        <hr className="my-8 border-zinc-800" />

        <section className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-amber-500">6. Rules & Reference</h2>
          <p className="mb-4 text-zinc-400">Access the <strong className="font-semibold text-zinc-200">Rules</strong> section via the bottom navigation bar.</p>
          <ul className="list-disc space-y-2 pl-5 text-zinc-400">
            <li><strong className="font-semibold text-zinc-200">Glossary:</strong> A searchable dictionary of game terms.</li>
            <li><strong className="font-semibold text-zinc-200">Round:</strong> The four steps of a round, rests, negating damage, exhaustion and elements on one screen.</li>
            <li><strong className="font-semibold text-zinc-200">Reference:</strong> Conditions, elements and the element board, and short guides (round structure, line of sight, advantage).</li>
            <li><strong className="font-semibold text-zinc-200">Monster Turn:</strong> The monster turn procedure step by step with diagrams (Rules Glossary p.26).</li>
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
          <p className="text-sm text-zinc-500">License: GNU GPLv3</p>
          <p className="mt-4 text-xs text-zinc-500 italic">
            Disclaimer: This is an unofficial fan project and is not affiliated with Cephalofair Games.
          </p>
        </footer>
      </div>
    </div>
  )
}
