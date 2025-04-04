// Alexander 01-04-2025
export class Message {
    text: string;
    userName: string;
    timeStamp: Date;
    gameId: string;
  
    constructor(message: string, userName: string, gameId: string) {
      this.text = message;
      this.userName = userName;
      this.gameId = gameId;
      this.timeStamp = new Date();
    }
}
// Alexander 01-04-2025