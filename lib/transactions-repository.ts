export interface TransactionRepository {
  getAllTransactions(): Promise<string[]>
  addTransaction(txID: string, hex: string): Promise<void>
  getTransaction(txID: string): Promise<string | undefined>
}
