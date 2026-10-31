export class LoadingCompletedEvent {
  constructor(
    public readonly bonId: number,
    public readonly salesUserId: number,
    public readonly totalItems: number,
    public readonly actorId: number,
    public readonly actorName: string,
  ) {}
}