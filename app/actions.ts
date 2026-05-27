'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

const listOfPeople = [
  'Grace',
  'Bam',
  'New',
  'Nonny',
  'Putter',
  'Golf',
  'Fifa',
  'Billy',
]

// Ensure database is seeded with users
export async function seedUsers() {
  const count = await prisma.user.count()
  if (count === 0) {
    await prisma.user.createMany({
      data: listOfPeople.map((name) => ({ name })),
    })
  }
}

export async function createExpenseAction(
  payerName: string,
  name: string,
  amount: number,
  sharedWithNames: string[],
) {
  await seedUsers()

  const payer = await prisma.user.findUnique({ where: { name: payerName } })
  if (!payer) throw new Error('Payer not found')

  const splitAmount = amount / sharedWithNames.length

  const shareUsers = await prisma.user.findMany({
    where: { name: { in: sharedWithNames } },
  })

  // People only owe the payer if they aren't the payer
  const sharesData = shareUsers
    .filter((u) => u.name !== payerName)
    .map((u) => ({
      userId: u.id,
      amountOwed: splitAmount,
    }))

  await prisma.expense.create({
    data: {
      name,
      amount,
      payerId: payer.id,
      shares: {
        create: sharesData,
      },
    },
  })

  revalidatePath(`/user/${payerName}/expenses`)
}

export async function getUserExpenses(userName: string) {
  await seedUsers()

  const user = await prisma.user.findUnique({ where: { name: userName } })
  if (!user) return { owedExpenses: [], owningMeExpenses: [] }

  // 1. Expenses this user needs to pay (they are in the shares, someone else is the payer)
  const owedShares = await prisma.expenseShare.findMany({
    where: { userId: user.id, isPaid: false },
    include: {
      expense: { include: { payer: true } },
    },
  })

  // Format conceptually to grouped array
  const owedMap: Record<
    string,
    { id: number; name: string; amount: number; date: string }[]
  > = {}
  for (const share of owedShares) {
    const payerName = share.expense.payer.name
    if (!owedMap[payerName]) owedMap[payerName] = []

    // Use ISO string for the date to transfer cleanly over Server Actions
    owedMap[payerName].push({
      id: share.id,
      name: share.expense.name,
      amount: share.amountOwed,
      date: share.expense.date.toISOString(),
    })
  }

  const owedExpenses = Object.entries(owedMap).map(([person, expenses]) => ({
    person,
    expenses,
  }))

  // 2. Expenses others owe this user (they are the payer)
  const owningMeShares = await prisma.expenseShare.findMany({
    where: { expense: { payerId: user.id }, isPaid: false },
    include: {
      expense: true,
      user: true,
    },
  })

  const owningMap: Record<
    string,
    { id: number; name: string; amount: number; date: string }[]
  > = {}
  for (const share of owningMeShares) {
    const debtorName = share.user.name
    if (!owningMap[debtorName]) owningMap[debtorName] = []

    owningMap[debtorName].push({
      id: share.id,
      name: share.expense.name,
      amount: share.amountOwed,
      date: share.expense.date.toISOString(),
    })
  }

  const owningMeExpenses = Object.entries(owningMap).map(
    ([person, expenses]) => ({
      person,
      expenses,
    }),
  )

  return { owedExpenses, owningMeExpenses }
}

export async function confirmSharesPaid(shareIds: number[], userName: string) {
  await prisma.expenseShare.updateMany({
    where: { id: { in: shareIds } },
    data: { isPaid: true },
  })

  revalidatePath(`/user/${userName}/expenses`)
}
