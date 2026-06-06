'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGetuser } from '~/hooks/api/auth'

export default function DashboardPage() {
  const {user} = useGetuser();
  const router = useRouter();
  console.log(user);

  useEffect(() => {
    if (!user) {
      router.replace('/login')
    }
  }, [user, router])

  if (user === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Redirecting...
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-stone-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-light mb-2">
          Dashboard
        </h1>

        <p className="text-stone-600 mb-10">
          Welcome back.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          <DashboardCard
            title="Forms"
            value="12"
          />

          <DashboardCard
            title="Responses"
            value="1,248"
          />

          <DashboardCard
            title="Views"
            value="8,903"
          />
        </div>
      </div>
    </main>
  )
}

function DashboardCard({
  title,
  value,
}: {
  title: string
  value: string
}) {
  return (
    <div className="bg-white border border-stone-200 rounded-3xl p-8">
      <p className="text-stone-500">
        {title}
      </p>

      <h2 className="text-4xl mt-2 font-light">
        {value}
      </h2>
    </div>
  )
}