export class PlanApprovedEvent {
  constructor(
    public readonly planId: number,
    public readonly planInvoice: string,
    public readonly salesUserId: number,
    public readonly actorId: number,
    public readonly actorName: string,
  ) {}
}