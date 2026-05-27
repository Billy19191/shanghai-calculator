'use client'

import React, { use, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createExpenseAction } from '@/app/actions'

const listOfPeople: string[] = [
  'Grace',
  'Bam',
  'New',
  'Nonny',
  'Putter',
  'Golf',
  'Fifa',
  'Billy',
]

export default function SharedWalletTransactionPage({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  const router = useRouter()
  const { name } = use(params)

  const [expenseName, setExpenseName] = useState('')
  const [amount, setAmount] = useState('')
  // Initialize with everyone selected by default
  const [selectedPeople, setSelectedPeople] = useState<string[]>(listOfPeople)
  const [isPending, startTransition] = useTransition()

  const handlePersonToggle = (person: string) => {
    setSelectedPeople((prev) =>
      prev.includes(person)
        ? prev.filter((p) => p !== person)
        : [...prev, person],
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    startTransition(async () => {
      try {
        const decodedName = decodeURIComponent(name)
        await createExpenseAction(
          decodedName,
          expenseName,
          parseFloat(amount),
          selectedPeople,
        )

        alert(
          `Expense "${expenseName}" added! Shared among ${selectedPeople.length} people.`,
        )
        router.push(`/user/${name}`)
      } catch (err) {
        console.error(err)
        alert('Failed to add expense')
      }
    })
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-10 px-5 my-5 max-w-lg mx-auto w-full">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Shared Wallet Expense
      </h1>

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="expenseName" className="font-semibold text-lg">
            Expense Name
          </label>
          <input
            id="expenseName"
            type="text"
            value={expenseName}
            onChange={(e) => setExpenseName(e.target.value)}
            className="border border-gray-300 rounded-lg p-3 text-lg"
            placeholder="e.g. Dinner, Taxi"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="amount" className="font-semibold text-lg">
            Total Amount
          </label>
          <input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="border border-gray-300 rounded-lg p-3 text-lg"
            placeholder="e.g. 500"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-semibold text-lg">
            Select people to share with
          </label>
          <div className="flex flex-wrap gap-2">
            {listOfPeople.map((person) => (
              <button
                key={person}
                type="button"
                onClick={() => handlePersonToggle(person)}
                className={`px-4 py-2 rounded-full border transition-colors ${
                  selectedPeople.includes(person)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
              >
                {person}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="mt-6 bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600 transition-colors text-lg disabled:opacity-50"
        >
          {isPending ? 'Submitting...' : 'Submit Expense'}
        </button>
      </form>

      <button
        className="mt-8 text-blue-500 hover:underline"
        onClick={() => router.back()}
      >
        Go back
      </button>
    </div>
  )
}
