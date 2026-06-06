'use client'

import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <h1 className="text-xl font-semibold tracking-wide">
          RuneForms
        </h1>

        <div className="flex gap-3">
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 rounded-lg hover:bg-stone-200 transition"
          >
            Login
          </button>

          <button
            onClick={() => router.push('/signup')}
            className="px-4 py-2 rounded-lg bg-stone-900 text-white hover:bg-stone-800 transition"
          >
            Get Started
          </button>
        </div>
      </nav>

      <section className="max-w-5xl mx-auto px-6 pt-24 pb-32 text-center">
        <p className="text-sm tracking-[0.25em] uppercase text-stone-500 mb-6">
          Form Creation Reimagined
        </p>

        <h1 className="text-6xl font-light leading-tight mb-8">
          Create forms.
          <br />
          Collect answers.
          <br />
          Understand people.
        </h1>

        <p className="max-w-2xl mx-auto text-lg text-stone-600 leading-relaxed">
          RuneForms helps teams design beautiful forms,
          gather submissions, and discover insights without
          unnecessary complexity.
        </p>

        <div className="flex justify-center gap-4 mt-10">
          <button
            onClick={() => router.push('/signup')}
            className="px-6 py-3 rounded-xl bg-stone-900 text-white hover:bg-stone-800 transition"
          >
            Start Building
          </button>

          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 rounded-xl border border-stone-300 hover:bg-white transition"
          >
            View Dashboard
          </button>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            title="Build Forms"
            desc="Create surveys, registrations, feedback forms and more."
          />

          <FeatureCard
            title="Collect Responses"
            desc="View submissions in real time from a clean dashboard."
          />

          <FeatureCard
            title="Share Anywhere"
            desc="Publish forms with a simple link and start collecting data."
          />
        </div>
      </section>
    </main>
  )
}

function FeatureCard({
  title,
  desc,
}: {
  title: string
  desc: string
}) {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-8">
      <h3 className="text-xl font-medium mb-3">
        {title}
      </h3>

      <p className="text-stone-600">
        {desc}
      </p>
    </div>
  )
}