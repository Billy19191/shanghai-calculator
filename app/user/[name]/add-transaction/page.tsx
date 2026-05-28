'use client'

import React, { use } from 'react'
import Card from '@/app/components/card'
import { useRouter } from 'next/navigation'

export default function AddTransactionPage({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  const router = useRouter()
  const { name } = use(params)

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-10 px-20 my-5">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Add Transaction
      </h1>
      <h2 className="text-md mb-4 text-gray-600">Select payment method</h2>

      <Card
        name="1. Pay with my wallet"
        onClick={() => router.push(`/user/${name}/add-transaction/my-wallet`)}
      />
      <Card
        name="2. Pay with shared wallet"
        onClick={() => router.push(`/user/${name}/add-transaction/shared-wallet`)}
      />

      <button
        className="mt-8 text-blue-500 hover:underline"
        onClick={() => router.back()}
      >
        Go back
      </button>
    </div>
  )
}