export class ReturnApprovedEvent {
  constructor(
    public readonly returnId: number,
    public readonly salesUserId: number,
    public readonly actorId: number,
    public readonly actorName: string,
  ) {}
}