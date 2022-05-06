import Deposit from "components/deposit"
import { Asset } from "lib/types"
import { useState } from "react"
import Form from "./form"

interface MultiplyProps {
  asset: string
}

const Multiply = ({ asset }: MultiplyProps) => {
  const [deposit, setDeposit] = useState(false)
  return <Form />
}

export default Multiply
