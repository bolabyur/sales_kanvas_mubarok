export class BonCreatedEvent {
  constructor(
    public readonly bonId: number,
    public readonly planInvoice: string,
    public readonly actorId: number,
    public readonly actorName: string,
  ) {}
}