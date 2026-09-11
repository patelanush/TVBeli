export class NeedsUnrankConfirmationError extends Error {
  constructor() {
    super('Changing this status will remove the show from your active ranking. Your review will be kept.');
    this.name = 'NeedsUnrankConfirmationError';
  }
}

export class StaleRankingError extends Error {
  constructor() {
    super('Your rankings changed during this comparison. Start again with the updated order.');
    this.name = 'StaleRankingError';
  }
}

export class WatchedShowRequiredError extends Error {
  constructor() {
    super('Mark this show as Watched before rating and ranking it.');
    this.name = 'WatchedShowRequiredError';
  }
}

export class OfflineWriteError extends Error {
  constructor() {
    super('TVBeli is offline. Reconnect before changing your library or rankings.');
    this.name = 'OfflineWriteError';
  }
}

