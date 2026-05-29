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

  const splitAmount = amount / sharedWithNames.length

  const { data: shareUsers, error: shareUsersError } = await supabase
    .from('User')
    .select('*')
    .in('name', sharedWithNames)

  if (shareUsersError) throw new Error(`Failed to find users: ${shareUsersError.message}`)

  // Create the expense first
  const { data: expense, error: expenseError } = await supabase
    .from('Expense')
    .insert({ name, amount, payerId: payer.id })
    .select()
    .single()

  if (expenseError || !expense) throw new Error(`Failed to create expense: ${expenseError?.message}`)

  // People only owe the payer if they aren't the payer
  const sharesData = (shareUsers || [])
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
    if (sharesError) throw new Error(`Failed to create shares: ${sharesError.message}`)
  }

  // If paid from shared pocket, deduct from pocket balance
  if (payerName === 'Shared-Pocket') {
    const { error: pocketError } = await supabase
      .from('PocketTransaction')
      .insert({
        userId: payer.id,
        amount: -amount,
        description: `Expense: ${name}`,
      })
    if (pocketError) throw new Error(`Failed to deduct from pocket: ${pocketError.message}`)
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

  // 1. Add to pocket balance
  const { error } = await supabase
    .from('PocketTransaction')
    .insert({
      userId: user.id,
      amount,
      description: description || `Top up by ${userName}`,
    })

  if (error) throw new Error(`Failed to top up pocket: ${error.message}`)

  // 2. Create an expense split among all people (so everyone owes the person who topped up)
  const expenseName = description || `Pocket top up by ${userName}`
  const { data: expense, error: expenseError } = await supabase
    .from('Expense')
    .insert({ name: expenseName, amount, payerId: user.id })
    .select()
    .single()

  if (expenseError || !expense) throw new Error(`Failed to create expense: ${expenseError?.message}`)

  const splitAmount = amount / listOfPeople.length

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
