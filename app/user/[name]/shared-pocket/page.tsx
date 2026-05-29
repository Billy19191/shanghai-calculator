'use client'

import React, { use, useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  topUpPocket,
  getSharedPocketBalance,
  getPocketTransactions,
  getPersonalSharedBalances,
} from '@/app/actions'

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

type PocketTransaction = {
  id: number
  amount: number
  description: string
  date: string
  userName: string
}

export default function TopUpPocketPage({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  const router = useRouter()
  const { name } = use(params)

  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [selectedPerson, setSelectedPerson] = useState(listOfPeople[0])
  const [isPending, startTransition] = useTransition()
  const [balance, setBalance] = useState<number | null>(null)
  const [transactions, setTransactions] = useState<PocketTransaction[]>([])
  const [personalBalances, setPersonalBalances] = useState<{ name: string; balance: number }[]>([])

  const loadData = () => {
    getSharedPocketBalance().then(setBalance)
    getPocketTransactions().then(setTransactions)
    getPersonalSharedBalances().then(setPersonalBalances)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    startTransition(async () => {
      try {
        await topUpPocket(selectedPerson, parseFloat(amount), description)
        alert(`Topped up ${amount} THB by ${selectedPerson}`)
        setAmount('')
        setDescription('')
        loadData()
      } catch (err) {
        console.error(err)
        alert('Failed to top up pocket')
      }
    })
  }

  return (
    <div className="page-transition flex flex-col items-center justify-center min-h-screen py-10 px-5 max-w-md mx-auto w-full">
      <h1 className="text-3xl font-bold mb-2">Top Up Pocket</h1>

      {/* Current Balance */}
      <div className="w-full border border-gray-200 rounded-lg p-4 mb-6 text-center">
        <p className="text-sm text-gray-500">Current Balance</p>
        <p
          className={`text-2xl font-bold mt-1 ${balance !== null && balance >= 0 ? 'text-green-500' : 'text-red-500'}`}
        >
          {balance !== null ? `${balance.toLocaleString()} THB` : '...'}
        </p>
      </div>

      {/* Personal Shared Balances */}
      {personalBalances.length > 0 && (
        <div className="w-full border border-gray-200 rounded-lg p-4 mb-8">
          <h2 className="text-sm font-semibold text-gray-500 mb-3 text-center uppercase tracking-wider">
            Personal Shared Balances
          </h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {personalBalances.map((pb) => (
              <div key={pb.name} className="flex justify-between border-b border-gray-50 pb-1">
                <span className="text-gray-600">{pb.name}</span>
                <span
                  className={`font-semibold ${pb.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {pb.balance >= 0 ? '+' : ''}
                  {pb.balance.toLocaleString()} THB
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Up Form */}
      <form
        onSubmit={handleSubmit}
        className="w-full flex flex-col gap-6 mb-10"
      >
        {/* Who is topping up */}
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-lg">Who is topping up?</label>
          <div className="flex flex-wrap gap-2">
            {listOfPeople.map((person) => {
              const isSelected = selectedPerson === person
              return (
                <button
                  key={person}
                  type="button"
                  onClick={() => setSelectedPerson(person)}
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

        {/* Amount */}
        <div className="flex flex-col gap-2">
          <label htmlFor="topUpAmount" className="font-semibold text-lg">
            Amount
          </label>
          <input
            id="topUpAmount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="border border-gray-300 rounded-lg p-3 text-lg focus:outline-none focus:border-gray-500 transition-colors"
            placeholder="e.g. 1000"
            required
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-2">
          <label htmlFor="topUpDesc" className="font-semibold text-lg">
            Description (optional)
          </label>
          <input
            id="topUpDesc"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border border-gray-300 rounded-lg p-3 text-lg focus:outline-none focus:border-gray-500 transition-colors"
            placeholder="e.g. Cash top up"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending || !amount}
          className="mt-2 bg-black text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Submitting...' : 'Top Up'}
        </button>
      </form>

      {/* Transaction History */}
      {transactions.length > 0 && (
        <div className="w-full">
          <h2 className="text-xl font-bold mb-4">Transaction History</h2>
          <div className="flex flex-col gap-3">
            {transactions.map((t) => (
              <div
                key={t.id}
                className="flex justify-between items-center border-b border-gray-100 pb-2"
              >
                <div>
                  <p className="font-medium">{t.userName}</p>
                  <p className="text-sm text-gray-400">
                    {t.description || 'Top up'}
                  </p>
                  <p className="text-xs text-gray-300">
                    {new Date(t.date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      timeZone: 'UTC',
                    })}
                  </p>
                </div>
                <span
                  className={`font-bold ${t.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}
                >
                  {t.amount >= 0 ? '+' : ''}
                  {t.amount.toLocaleString()} THB
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        className="mt-8 text-blue-500 hover:underline"
        onClick={() => router.back()}
      >
        Go back
      </button>
    </div>
  )
}
