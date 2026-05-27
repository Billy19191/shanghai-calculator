'use client'

import Card from './components/card'
import { useRouter } from 'next/navigation'

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

export default function Home() {
  const router = useRouter()
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-10 px-20 my-5">
      <h1 className="text-3xl font-bold ">Who are you?</h1>
      {listOfPeople.map((person) => (
        <Card
          key={person}
          name={person}
          onClick={() => router.push(`/user/${person}`)}
        />
      ))}
    </div>
  )
}
