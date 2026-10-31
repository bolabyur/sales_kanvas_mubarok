export class InvoiceCreatedEvent {
  constructor(
    public readonly invoiceId: number,
    public readonly outletName: string,
    public readonly totalAmount: number,
    public readonly actorId: number,
    public readonly actorName: string,
  ) {}
}