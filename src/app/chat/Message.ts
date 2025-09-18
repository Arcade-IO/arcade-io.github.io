// Alexander 01-04-2025
export class Message {
    text: string;
    displayName: string;
    timeStamp: Date;
    gameId: string;
  
    constructor(message: string, displayName: string, gameId: string) {
      this.text = message;
      this.displayName = displayName;
      this.gameId = gameId;
      this.timeStamp = new Date();
    }
}
// Alexander 01-04-2025