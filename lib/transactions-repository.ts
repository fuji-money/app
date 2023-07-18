export interface TransactionRepository {
  addTransaction(txID: string, hex: string): Promise<void>
  getTransaction(txID: string): Promise<string | undefined>
}

export class InMemoryTransactionRepository implements TransactionRepository {
  private transactions: Map<string, string> = new Map()

  async addTransaction(txID: string, hex: string): Promise<void> {
    this.transactions.set(txID, hex)
  }

  async getTransaction(txID: string): Promise<string | undefined> {
    return this.transactions.get(txID)
  }
}
