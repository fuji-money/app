import { UnblindingData } from 'marina-provider'

export interface BlindersRepository {
  addBlindingData(
    txID: string,
    vout: number,
    blindingData: UnblindingData,
  ): Promise<void>
  getBlindingData(
    txID: string,
    vout: number,
  ): Promise<UnblindingData | undefined>
}

export class InMemoryBlindersRepository implements BlindersRepository {
  private blindingData: Map<string, Map<number, UnblindingData>> = new Map()

  async addBlindingData(
    txID: string,
    vout: number,
    blindingData: UnblindingData,
  ): Promise<void> {
    if (!this.blindingData.has(txID)) {
      this.blindingData.set(txID, new Map())
    }
    this.blindingData.get(txID)!.set(vout, blindingData)
  }

  async getBlindingData(
    txID: string,
    vout: number,
  ): Promise<UnblindingData | undefined> {
    if (!this.blindingData.has(txID)) {
      return undefined
    }
    return this.blindingData.get(txID)!.get(vout)
  }
}
