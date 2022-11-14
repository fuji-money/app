import Image from 'next/image'

interface EnablerButtonProps {
  name: string
  icon: string
  handler?: () => void
}

export const EnablerButton = ({ name, icon, handler }: EnablerButtonProps) => {
  const disabled = typeof handler === 'undefined'
  return (
    <p>
      <button
        className="button is-primary mt-4"
        onClick={handler}
        disabled={disabled}
      >
        <Image src={icon} alt={`${name} logo`} width={20} height={20} />
        <span className="ml-2">{name}</span>
      </button>
      <style jsx>{`
        .button {
          justify-content: flex-start;
          width: 90%;
        }
      `}</style>
    </p>
  )
}
