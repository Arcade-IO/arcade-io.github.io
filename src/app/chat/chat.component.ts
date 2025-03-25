import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat',
  imports: [FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
// Alexander 24-03-25 

export class ChatComponent {
  msg : Message[] = [];
  test : TestM[] = []
  input = "";

  makeMessage(newMsg:string){
    this.msg.push(new Message(newMsg))
  }

  makeTest(){
    this.test.push(new TestM(this.input))
    this.input = "";
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
  text : string;
  createdAt: Date;

  constructor( text : string) {
    this.text = text;
    this.createdAt = new Date;
  }
}
// Alexander 24-03-25 

//Hej Aleksander,
//jeg kan se at selin har lavet 2 komponenter, men vi blev enige om at chatten skal-
//vises på game-interface komponenten.

//Jeg tænker at du kan lave en chatbox til din chat.component.html(som du gør nu)-
//og så kan vi integrere din html og css med hazels game-interface når du er klar.
//jeg har fjernet authguard fra app.rooutes.ts(se linje 23-24), så du kan tilgå siden-
//ved at bruge - localhost:4200/chat