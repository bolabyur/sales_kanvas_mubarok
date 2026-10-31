export class SettlementSubmittedEvent {
  constructor(
    public readonly settlementId: number,
    public readonly planInvoice: string,
    public readonly totalAmount: number,
    public readonly actorId: number,
    public readonly actorName: string,
  ) {}
}