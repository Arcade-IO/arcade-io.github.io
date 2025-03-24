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

//Hej Aleksander,
//jeg kan se at selin har lavet 2 komponenter, men vi blev enige om at chatten skal-
//vises på game-interface komponenten.

//Jeg tænker at du kan lave en chatbox til din chat.component.html(som du gør nu)-
//og så kan vi integrere din html og css med hazels game-interface når du er klar.
//jeg har fjernet authguard fra app.rooutes.ts(se linje 23-24), så du kan tilgå siden-
//ved at bruge - localhost:4200/chat