import Image from 'next/image'

const Spinner = () => {
  return (
    <Image
      src="/images/spinner.svg"
      alt="loading spinner icon"
      height={40}
      width={40}
    />
  )
}

export default Spinner
