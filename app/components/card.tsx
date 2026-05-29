import Link from 'next/link'

const Card = ({
  name,
  onClick,
  href,
}: {
  name: string
  onClick?: () => void
  href?: string
}) => {
  const className =
    'max-w-lg w-64 h-20 border border-gray-300 rounded-lg p-4 justify-center items-center flex my-5 hover:bg-gray-100 cursor-pointer transition-colors'

  if (href) {
    return (
      <Link href={href} className={className}>
        <p>{name}</p>
      </Link>
    )
  }

  return (
    <button className={className} onClick={onClick}>
      <p>{name}</p>
    </button>
  )
}
export default Card

