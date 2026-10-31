export class PlanCreatedEvent {
  constructor(
    public readonly planId: number,
    public readonly planInvoice: string,
    public readonly actorId: number,
    public readonly actorName: string,
  ) {}
}