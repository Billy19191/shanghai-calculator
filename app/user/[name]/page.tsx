'use client'

import { use } from 'react'
import Card from '@/app/components/card'
import { useRouter } from 'next/navigation'

export default function UserMenuPage({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  const router = useRouter()
  const { name } = use(params)


  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-10 px-20 my-5">
      <h1 className="text-3xl font-bold mb-8">
        Hello, {decodeURIComponent(name)}!
      </h1>
      <h2 className="text-md mb-4 text-gray-600">What would you like to do?</h2>

      <Card
        name="Add expense transaction"
        onClick={() => router.push(`/user/${name}/add-transaction`)}
      />
      <Card
        name="View my expense"
        onClick={() => router.push(`/user/${name}/expenses`)}
      />
      {name == 'Shared-Pocket' && (
        <Card
          name="Top up pocket"
          onClick={() => router.push(`/user/${name}/shared-pocket`)}
        />
      )}

      <button
        className="mt-8 text-blue-500 hover:underline"
        onClick={() => router.push('/')}
      >
        Go back
      </button>
    </div>
  )
}
