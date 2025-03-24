import { Component } from '@angular/core';

@Component({
  selector: 'app-chat',
  imports: [],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})

export class ChatComponent {
  msg : Message[] = [];
  test : TestM[] = [
    new TestM(1,"ss"),
    new TestM(2,"ssss")
  ]

  makeMessage(newMsg:string){
    this.msg.push(new Message(newMsg))
  }
}





class Message {
  message : string;
  userName : string = "";
  timeStamp : undefined;

  constructor(message : string) {
    this.message = message;
  }
}





class TestM {
  id : number;
  text : string;

  constructor(id : number, text : string) {
    this.id = id;
    this.text = text;
  }
}