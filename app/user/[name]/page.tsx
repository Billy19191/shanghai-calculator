'use client'

import React, { use } from 'react'
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
      <h2 className="text-xl mb-4 text-gray-600">What would you like to do?</h2>

      <Card
        name="1. Add transaction"
        onClick={() => router.push(`/user/${name}/add-transaction`)}
      />
      <Card
        name="2. View my expense"
        onClick={() => router.push(`/user/${name}/expenses`)}
      />

      <button
        className="mt-8 text-blue-500 hover:underline"
        onClick={() => router.push('/')}
      >
        Go back to Home
      </button>
    </div>
  )
}
