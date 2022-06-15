import Image from 'next/image'

const Loading = () => {
  return (
    <Image
      src="/images/spinner.svg"
      alt="loading spinner icon"
      height={100}
      width={100}
    />
  )
}

export default Loading
