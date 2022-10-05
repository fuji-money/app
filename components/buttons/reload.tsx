import { ContractsContext } from 'components/providers/contracts'
import Image from 'next/image'
import { useContext } from 'react'

const ReloadButton = () => {
  const { reloadContracts, setLoading } = useContext(ContractsContext)

  const reload = async () => {
    setLoading(true)
    await reloadContracts(true)
    setLoading(false)
  }

  return (
    <p className="pt-2 is-clickable">
      <Image
        src="/images/icons/reload.svg"
        alt="reload"
        height={16}
        width={16}
        onClick={reload}
      />
    </p>
  )
}

export default ReloadButton
