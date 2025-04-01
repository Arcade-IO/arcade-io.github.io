// Alexander 01-04-2025
export class Message {
    text: string;
    userName: string;
    timeStamp: Date;
  
    constructor(message: string, userName: string) {
      this.text = message;
      this.userName = userName;
      this.timeStamp = new Date();
    }
}
// Alexander 01-04-2025