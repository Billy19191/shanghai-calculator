'use client'

import { use } from 'react'
import Card from '@/app/components/card'
import Link from 'next/link'

export default function UserMenuPage({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  const { name } = use(params)

  return (
    <div className="page-transition flex flex-col items-center justify-center min-h-screen py-10 px-20 my-5">
      <h1 className="text-3xl font-bold mb-8">
        Hello, {decodeURIComponent(name)}!
      </h1>
      <h2 className="text-md mb-4 text-gray-600">What would you like to do?</h2>

      <Card
        name="Add expense transaction"
        href={`/user/${name}/add-transaction`}
      />
      <Card
        name="View my expense"
        href={`/user/${name}/expenses`}
      />
      {name == 'Shared-Pocket' && (
        <Card
          name="Top up pocket"
          href={`/user/${name}/shared-pocket`}
        />
      )}

      <Link
        className="mt-8 text-blue-500 hover:underline block"
        href="/"
      >
        Go back
      </Link>
    </div>
  )
}

