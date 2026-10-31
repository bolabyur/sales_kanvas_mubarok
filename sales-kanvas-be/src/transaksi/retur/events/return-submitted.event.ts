export class ReturnSubmittedEvent {
  constructor(
    public readonly returnId: number,
    public readonly salesUserId: number,
    public readonly outletName: string,
    public readonly actorId: number,
    public readonly actorName: string,
  ) {}
}