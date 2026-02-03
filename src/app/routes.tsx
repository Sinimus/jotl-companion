import { Routes, Route } from 'react-router-dom'

// Placeholder page — will be replaced in Task 04 (Campaign CRUD)
function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-4xl font-bold text-amber-500">
        Gloomhaven
      </h1>
      <h2 className="text-xl text-zinc-400">
        Jaws of the Lion — Companion App
      </h2>
      <p className="text-sm text-zinc-500">
        Foundation scaffolding — features coming soon.
      </p>
    </div>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
    </Routes>
  )
}
