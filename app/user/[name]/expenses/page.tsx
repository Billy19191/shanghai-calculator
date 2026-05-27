'use client'

import React, { use, useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { getUserExpenses, confirmSharesPaid } from '@/app/actions'

// Types matching our server action return
type ExpenseGroup = {
  person: string
  expenses: {
    id: number
    name: string
    amount: number
    date: string
  }[]
}

function ExpenseGroupList({
  title,
  data,
  checkable = false,
  onConfirmStart,
}: {
  title: string
  data: ExpenseGroup[]
  checkable?: boolean
  onConfirmStart?: (ids: number[]) => void
}) {
  const [selectedExpenses, setSelectedExpenses] = useState<number[]>([])

  const handleToggle = (id: number) => {
    setSelectedExpenses((prev) =>
      prev.includes(id) ? prev.filter((eId) => eId !== id) : [...prev, id],
    )
  }

  const handleConfirm = () => {
    if (onConfirmStart) {
      onConfirmStart(selectedExpenses)
      setSelectedExpenses([])
    }
  }

  if (data.length === 0) {
    return (
      <div className="w-full mb-8">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <p className="text-gray-500 py-2">No expenses found.</p>
      </div>
    )
  }

  return (
    <div className="w-full mb-10">
      <h2 className="text-xl font-bold mb-6 text-gray-800">{title}</h2>
      <div className="flex flex-col gap-8">
        {data.map((group) => {
          const personTotal = group.expenses.reduce(
            (sum, e) => sum + e.amount,
            0,
          )

          // Group expenses by date
          const expensesByDate: Record<string, typeof group.expenses> = {}
          group.expenses.forEach((e) => {
            if (!expensesByDate[e.date]) {
              expensesByDate[e.date] = []
            }
            expensesByDate[e.date].push(e)
          })

          return (
            <div key={group.person} className="flex flex-col">
              <div className="flex justify-between font-bold text-lg border-b border-gray-200 pb-1 mb-3">
                <span>{group.person}</span>
                <span>{personTotal} USD</span>
              </div>

              <div className="flex flex-col gap-4">
                {Object.entries(expensesByDate)
                  .sort((a, b) => a[0].localeCompare(b[0]))
                  .map(([date, dateExpenses]) => (
                    <div key={date} className="flex flex-col">
                      <span className="text-xs font-semibold text-gray-400 mb-1 tracking-wide">
                        {new Date(date).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          timeZone: 'UTC',
                        })}
                      </span>
                      <div className="flex flex-col gap-2">
                        {dateExpenses.map((expense) =>
                          checkable ? (
                            <label
                              key={expense.id}
                              className="flex items-center gap-3 text-gray-800 cursor-pointer"
                            >
                              <input
                                title={`Select ${expense.name}`}
                                type="checkbox"
                                checked={selectedExpenses.includes(expense.id)}
                                onChange={() => handleToggle(expense.id)}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                              <div className="flex justify-between w-full">
                                <span>{expense.name}</span>
                                <span className="font-medium">
                                  {expense.amount} USD
                                </span>
                              </div>
                            </label>
                          ) : (
                            <div
                              key={expense.id}
                              className="flex justify-between text-gray-800"
                            >
                              <span>{expense.name}</span>
                              <span className="font-medium">
                                {expense.amount} USD
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )
        })}
      </div>
      {checkable && selectedExpenses.length > 0 && (
        <button
          onClick={handleConfirm}
          className="mt-6 w-full bg-blue-500 text-white font-bold py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Confirm Paid ({selectedExpenses.length})
        </button>
      )}
    </div>
  )
}

export default function ViewExpensesPage({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  const router = useRouter()
  const { name } = use(params)
  const decodedName = decodeURIComponent(name)

  const [owedExpenses, setOwedExpenses] = useState<ExpenseGroup[]>([])
  const [owningMeExpenses, setOwningMeExpenses] = useState<ExpenseGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [, startTransition] = useTransition()

  const loadExpenses = React.useCallback(() => {
    startTransition(async () => {
      try {
        const data = await getUserExpenses(decodedName)
        setOwedExpenses(data.owedExpenses)
        setOwningMeExpenses(data.owningMeExpenses)
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    })
  }, [decodedName])

  useEffect(() => {
    loadExpenses()
  }, [loadExpenses])

  const handleConfirmPaid = (ids: number[]) => {
    startTransition(async () => {
      await confirmSharesPaid(ids, decodedName)
      loadExpenses()
    })
  }

  const totalExpense = owedExpenses.reduce(
    (outerSum, personGroup) =>
      outerSum +
      personGroup.expenses.reduce(
        (innerSum, item) => innerSum + item.amount,
        0,
      ),
    0,
  )

  const totalOwesMe = owningMeExpenses.reduce(
    (outerSum, personGroup) =>
      outerSum +
      personGroup.expenses.reduce(
        (innerSum, item) => innerSum + item.amount,
        0,
      ),
    0,
  )

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading expenses...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-10 px-5 max-w-md mx-auto w-full">
      <h1 className="text-3xl font-bold mb-2 text-center">
        {decodeURIComponent(name)}&apos;s Expenses
      </h1>
      <div className="flex flex-col items-center gap-1 text-gray-500 mb-8 w-full border-b border-gray-200 pb-6">
        <p>
          Total to pay:{' '}
          <span className="font-bold text-red-500">{totalExpense} USD</span>
        </p>
        <p>
          Total owed to me:{' '}
          <span className="font-bold text-green-500">{totalOwesMe} USD</span>
        </p>
      </div>

      <ExpenseGroupList
        title="People I need to pay"
        data={owedExpenses}
        checkable
        onConfirmStart={handleConfirmPaid}
      />
      <ExpenseGroupList title="People who owe me" data={owningMeExpenses} />

      <button
        className="mt-4 text-blue-500 hover:underline"
        onClick={() => router.back()}
      >
        Go back
      </button>
    </div>
  )
}
