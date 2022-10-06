import { ContractsContext } from 'components/providers/contracts'
import Image from 'next/image'
import { useContext } from 'react'

const ReloadButton = () => {
  const { reloadContracts, setLoading } = useContext(ContractsContext)

  const rotateIcon = () => {
    const className = 'rotates'
    const duration = 1000 // 1 second
    const el = document.getElementById('iconContainer')
    el?.classList.add(className)
    setTimeout(() => el?.classList.remove(className), duration)
  }

  const reload = async () => {
    setLoading(true)
    rotateIcon()
    await reloadContracts(true)
    setLoading(false)
  }

  return (
    <p id="iconContainer" className="pt-2 is-clickable">
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
