'use client'

import { useRouter } from 'next/navigation'

const listOfPeople: string[] = [
  'Grace',
  'Bam',
  'Mew',
  'Nonny',
  'Putter',
  'Golf',
  'Fifa',
  'Billy',
]

export default function Home() {
  const router = useRouter()
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-10 px-5 text-center">
      <div className="text-6xl mb-4">🇨🇳</div>
      <div className="text-3xl font-bold mb-1">Shanghai Calculator</div>
      <p className="text-sm text-gray-400 mb-10">By Billy</p>

      <h1 className="text-lg font-semibold mb-4">Who are you?</h1>

      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
        {listOfPeople.map((person) => (
          <button
            key={person}
            onClick={() => router.push(`/user/${person}`)}
            className="border border-gray-300 rounded-lg py-3 px-4 text-center font-medium hover:bg-gray-100 active:scale-95 cursor-pointer transition-all"
          >
            {person}
          </button>
        ))}
      </div>
    </div>
  )
}
