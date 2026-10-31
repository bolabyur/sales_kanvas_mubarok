export class InvoiceCancelledEvent {
  constructor(
    public readonly invoiceId: number,
    public readonly actorId: number,
    public readonly actorName: string,
  ) {}
}