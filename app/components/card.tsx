const Card = ({ name, onClick }: { name: string; onClick?: () => void }) => {
  return (
    <button
      className="max-w-lg w-64 h-20 border border-gray-300 rounded-lg p-4 justify-center items-center flex my-5 hover:bg-gray-100 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <p>{name}</p>
    </button>
  )
}
export default Card
