'use client'

import React, { use, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createExpenseAction } from '@/app/actions'

const listOfPeople: string[] = [
  'Grace',
  'Bam',
  'Miw',
  'Nonny',
  'Putter',
  'Golf',
  'Fifa',
  'Billy',
]

export default function MyWalletTransactionPage({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  const router = useRouter()
  const { name } = use(params)
  const isSharedPocket = decodeURIComponent(name) === 'Shared-Pocket'

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

  const handleSelectAll = () => {
    if (selectedPeople.length === listOfPeople.length) {
      setSelectedPeople([])
    } else {
      setSelectedPeople([...listOfPeople])
    }
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
          isSharedPocket ? [] : selectedPeople,
        )

        if (isSharedPocket) {
          alert(
            `Expense "${expenseName}" added and deducted from Shared Pocket balance.`,
          )
        } else {
          alert(
            `Expense "${expenseName}" added! Shared among ${selectedPeople.length} people.`,
          )
        }
        router.push(`/user/${name}`)
      } catch (err) {
        console.error(err)
        alert('Failed to add expense')
      }
    })
  }

  const perPerson =
    !isSharedPocket && selectedPeople.length > 0 && amount
      ? (parseFloat(amount) / selectedPeople.length).toFixed(2)
      : null

  return (
    <div className="page-transition flex flex-col items-center justify-center min-h-screen py-10 px-5 my-5 max-w-lg mx-auto w-full">
      <h1 className="text-3xl font-bold mb-2">Add Expense</h1>
      <h2 className="text-md mb-8 text-gray-600">
        Paying from {decodeURIComponent(name)}&apos;s wallet
      </h2>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg flex flex-col gap-6"
      >
        {/* Expense Name */}
        <div className="flex flex-col gap-2">
          <label htmlFor="expenseName" className="font-semibold text-lg">
            Expense Name
          </label>
          <input
            id="expenseName"
            type="text"
            value={expenseName}
            onChange={(e) => setExpenseName(e.target.value)}
            className="border border-gray-300 rounded-lg p-3 text-lg focus:outline-none focus:border-gray-500 transition-colors"
            placeholder="e.g. Dinner, Taxi"
            required
          />
        </div>

        {/* Amount */}
        <div className="flex flex-col gap-2">
          <label htmlFor="amount" className="font-semibold text-lg">
            Total Amount
          </label>
          <input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="border border-gray-300 rounded-lg p-3 text-lg focus:outline-none focus:border-gray-500 transition-colors"
            placeholder="e.g. 500"
            required
          />
        </div>

        {/* People Selector */}
        {!isSharedPocket && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-lg">
                Select people to share with
              </label>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-sm text-blue-500 hover:underline"
              >
                {selectedPeople.length === listOfPeople.length
                  ? 'Deselect all'
                  : 'Select all'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {listOfPeople.map((person) => {
                const isSelected = selectedPeople.includes(person)
                return (
                  <button
                    key={person}
                    type="button"
                    onClick={() => handlePersonToggle(person)}
                    className={`px-4 py-1 rounded-full border transition-colors ${isSelected
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                      }`}
                  >
                    {person}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Per-person summary */}
        {perPerson && (
          <div className="border border-gray-300 rounded-lg p-4 flex justify-between items-center">
            <span className="text-gray-600">
              Per person ({selectedPeople.length} people)
            </span>
            <span className="font-bold text-lg">฿{perPerson}</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending || !expenseName.trim() || !amount || (!isSharedPocket && selectedPeople.length === 0)}
          className="mt-2 bg-black text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
