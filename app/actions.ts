'use server'

import supabase from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

const listOfPeople = [
  'Grace',
  'Bam',
  'Miw',
  'Nonny',
  'Putter',
  'Golf',
  'Fifa',
  'Billy',
]

// All users including special ones (for DB seeding)
const allUsers = [...listOfPeople, 'Shared-Pocket']

// Ensure database is seeded with users
export async function seedUsers() {
  const { count } = await supabase
    .from('User')
    .select('*', { count: 'exact', head: true })

  if (count === 0) {
    const { error } = await supabase
      .from('User')
      .insert(allUsers.map((name) => ({ name })))
    if (error) throw new Error(`Failed to seed users: ${error.message}`)
  }
}

export async function createExpenseAction(
  payerName: string,
  name: string,
  amount: number,
  sharedWithNames: string[],
) {
  await seedUsers()

  const { data: payer, error: payerError } = await supabase
    .from('User')
    .select('*')
    .eq('name', payerName)
    .single()

  if (payerError || !payer) throw new Error('Payer not found')

  const roundedAmount = Math.round(amount * 100) / 100
  const splitAmount = Math.round((roundedAmount / sharedWithNames.length) * 100) / 100

  const { data: shareUsers, error: shareUsersError } = await supabase
    .from('User')
    .select('*')
    .in('name', sharedWithNames)

  if (shareUsersError) throw new Error(`Failed to find users: ${shareUsersError.message}`)

  // Create the expense first
  const { data: expense, error: expenseError } = await supabase
    .from('Expense')
    .insert({ name, amount: roundedAmount, payerId: payer.id })
    .select()
    .single()

  if (expenseError || !expense) throw new Error(`Failed to create expense: ${expenseError?.message}`)

  // People only owe the payer if they aren't the payer (and if it is not paid by Shared-Pocket)
  const sharesData =
    payerName === 'Shared-Pocket'
      ? []
      : (shareUsers || [])
        .filter((u) => u.name !== payerName)
        .map((u) => ({
          expenseId: expense.id,
          userId: u.id,
          amountOwed: splitAmount,
        }))

  if (sharesData.length > 0) {
    const { error: sharesError } = await supabase
      .from('ExpenseShare')
      .insert(sharesData)
    if (sharesError)
      throw new Error(`Failed to create shares: ${sharesError.message}`)
  }

  // If paid from shared pocket, deduct from pocket balance of people who attend only
  if (payerName === 'Shared-Pocket') {
    const transactionsData = (shareUsers || []).map((u) => ({
      userId: u.id,
      amount: -splitAmount,
      description: `Expense: ${name} (Share)`,
    }))

    if (transactionsData.length > 0) {
      const { error: pocketError } = await supabase
        .from('PocketTransaction')
        .insert(transactionsData)
      if (pocketError) throw new Error(`Failed to deduct from pocket: ${pocketError.message}`)
    }
    revalidatePath('/')
  }

  revalidatePath(`/user/${payerName}/expenses`)
}

export async function getUserExpenses(userName: string) {
  await seedUsers()

  const { data: user, error: userError } = await supabase
    .from('User')
    .select('*')
    .eq('name', userName)
    .single()

  if (userError || !user) return { owedExpenses: [], owningMeExpenses: [] }

  // 1. Expenses this user needs to pay (they are in the shares, someone else is the payer)
  const { data: owedShares } = await supabase
    .from('ExpenseShare')
    .select(`
      id,
      amountOwed,
      isPaid,
      expense:Expense (
        id,
        name,
        amount,
        date,
        payer:User!payerId (
          id,
          name
        )
      )
    `)
    .eq('userId', user.id)
    .eq('isPaid', false)

  // Format to grouped array
  const owedMap: Record<
    string,
    { id: number; name: string; amount: number; date: string }[]
  > = {}

  for (const share of owedShares || []) {
    // Supabase returns nested relations as objects
    const expense = share.expense as unknown as {
      id: number; name: string; amount: number; date: string;
      payer: { id: number; name: string }
    }
    const payerName = expense.payer.name
    if (!owedMap[payerName]) owedMap[payerName] = []

    owedMap[payerName].push({
      id: share.id,
      name: expense.name,
      amount: share.amountOwed,
      date: expense.date,
    })
  }

  const owedExpenses = Object.entries(owedMap).map(([person, expenses]) => ({
    person,
    expenses,
  }))

  // 2. Expenses others owe this user (they are the payer)
  const { data: owningMeShares } = await supabase
    .from('ExpenseShare')
    .select(`
      id,
      amountOwed,
      isPaid,
      expense:Expense (
        id,
        name,
        amount,
        date,
        payerId
      ),
      user:User!userId (
        id,
        name
      )
    `)
    .eq('isPaid', false)

  // Filter server-side: only shares where the expense payer is this user
  const filteredOwningMe = (owningMeShares || []).filter((share) => {
    const expense = share.expense as unknown as { payerId: number }
    return expense.payerId === user.id
  })

  const owningMap: Record<
    string,
    { id: number; name: string; amount: number; date: string }[]
  > = {}

  for (const share of filteredOwningMe) {
    const expense = share.expense as unknown as {
      id: number; name: string; amount: number; date: string
    }
    const debtor = share.user as unknown as { id: number; name: string }
    const debtorName = debtor.name
    if (!owningMap[debtorName]) owningMap[debtorName] = []

    owningMap[debtorName].push({
      id: share.id,
      name: expense.name,
      amount: share.amountOwed,
      date: expense.date,
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
  const { error } = await supabase
    .from('ExpenseShare')
    .update({ isPaid: true })
    .in('id', shareIds)

  if (error) throw new Error(`Failed to confirm paid: ${error.message}`)

  revalidatePath(`/user/${userName}/expenses`)
}

export async function getSharedPocketBalance() {
  const { data, error } = await supabase
    .from('PocketTransaction')
    .select('amount')

  if (error) return 0

  return (data || []).reduce((sum, row) => sum + row.amount, 0)
}

export async function topUpPocket(
  userName: string,
  amount: number,
  description: string,
) {
  await seedUsers()

  const { data: user, error: userError } = await supabase
    .from('User')
    .select('*')
    .eq('name', userName)
    .single()

  if (userError || !user) throw new Error('User not found')

  const roundedAmount = Math.round(amount * 100) / 100

  // 1. Add to pocket balance
  const { error } = await supabase
    .from('PocketTransaction')
    .insert({
      userId: user.id,
      amount: roundedAmount,
      description: description || `Top up by ${userName}`,
    })

  if (error) throw new Error(`Failed to top up pocket: ${error.message}`)

  // 2. Create an expense split among all people (so everyone owes the person who topped up)
  const expenseName = description || `Pocket top up by ${userName}`
  const { data: expense, error: expenseError } = await supabase
    .from('Expense')
    .insert({ name: expenseName, amount: roundedAmount, payerId: user.id })
    .select()
    .single()

  if (expenseError || !expense) throw new Error(`Failed to create expense: ${expenseError?.message}`)

  const splitAmount = Math.round((roundedAmount / listOfPeople.length) * 100) / 100

  // Get all people (excluding the person who topped up)
  const { data: shareUsers } = await supabase
    .from('User')
    .select('*')
    .in('name', listOfPeople)

  const sharesData = (shareUsers || [])
    .filter((u) => u.name !== userName)
    .map((u) => ({
      expenseId: expense.id,
      userId: u.id,
      amountOwed: splitAmount,
    }))

  if (sharesData.length > 0) {
    const { error: sharesError } = await supabase
      .from('ExpenseShare')
      .insert(sharesData)
    if (sharesError) throw new Error(`Failed to create shares: ${sharesError.message}`)
  }

  revalidatePath('/')
  revalidatePath(`/user/Shared-Pocket`)
  // Revalidate expense pages for all people
  for (const person of listOfPeople) {
    revalidatePath(`/user/${person}/expenses`)
  }
}

export async function getPocketTransactions() {
  const { data, error } = await supabase
    .from('PocketTransaction')
    .select(`
      id,
      amount,
      description,
      date,
      user:User!userId (
        name
      )
    `)
    .order('date', { ascending: false })

  if (error) return []

  return (data || []).map((t) => ({
    id: t.id,
    amount: t.amount,
    description: t.description,
    date: t.date,
    userName: (t.user as unknown as { name: string }).name,
  }))
}

export async function getPersonalSharedBalances() {
  await seedUsers()

  const { data: users, error: usersError } = await supabase
    .from('User')
    .select('*')
    .in('name', listOfPeople)

  if (usersError || !users) return []

  const { data: txs, error: txsError } = await supabase
    .from('PocketTransaction')
    .select('userId, amount')

  if (txsError) return []

  // 1. Calculate total positive top-ups
  const totalTopUps = (txs || [])
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0)

  const sharePerPerson = totalTopUps / listOfPeople.length

  // 2. Calculate deductions (negative pocket transactions) for each user
  const deductions: Record<number, number> = {}
  users.forEach((u) => {
    deductions[u.id] = 0
  })

    ; (txs || []).forEach((t) => {
      if (t.amount < 0 && deductions[t.userId] !== undefined) {
        deductions[t.userId] += t.amount
      }
    })

  return users.map((u) => ({
    name: u.name,
    balance: Math.round((sharePerPerson + (deductions[u.id] || 0)) * 100) / 100,
  }))
}
