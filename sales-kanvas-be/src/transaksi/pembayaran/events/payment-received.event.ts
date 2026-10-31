export class PaymentReceivedEvent {
  constructor(
    public readonly invoiceId: number,
    public readonly outletName: string,
    public readonly nominalBayar: number,
    public readonly salesUserId: number,
    public readonly actorId: number,
    public readonly actorName: string,
  ) {}
}