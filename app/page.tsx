'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getSharedPocketBalance } from '@/app/actions'

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

export default function Home() {
  const [pocketBalance, setPocketBalance] = useState<number | null>(null)

  useEffect(() => {
    getSharedPocketBalance().then(setPocketBalance)
  }, [])

  return (
    <div className="page-transition flex flex-col items-center justify-center min-h-screen py-10 px-5 text-center">
      <div className="text-6xl mb-4">🇨🇳</div>
      <div className="text-3xl font-bold mb-1">Shanghai Calculator</div>
      <p className="text-sm text-gray-400 mb-10">By Billy</p>

      <h1 className="text-lg font-semibold mb-4">Select Pocket</h1>

      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
        {listOfPeople.map((person) => (
          <Link
            key={person}
            href={`/user/${person}`}
            className="border border-gray-300 rounded-lg py-3 px-4 text-center font-medium hover:bg-gray-100 active:scale-95 cursor-pointer transition-all block"
          >
            {person}
          </Link>
        ))}

        <div className="col-span-2 mt-4 border-t border-dotted border-gray-300" />

        <Link
          href="/user/Shared-Pocket"
          className="col-span-2 mt-4 border border-gray-300 rounded-lg py-3 px-4 text-center font-medium hover:bg-gray-100 active:scale-95 cursor-pointer transition-all block"
        >
          <span>Shared Pocket</span>
          <span className={`block text-sm mt-1 ${pocketBalance !== null && pocketBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {pocketBalance !== null ? `${pocketBalance.toLocaleString()} THB` : '...'}
          </span>
        </Link>
      </div>

    </div>
  )
}

