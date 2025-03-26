import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../services/firebase.service';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth'

@Component({
  selector: 'app-chat',
  imports: [FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
// Alexander 24-03-25 

export class ChatComponent {
  msg : Message[] = [];
  input : string = "";
  username : string | null = "";

  
  //constructor(private fireService : FirebaseService) {}

  ngOnInit() {
    const auth = getAuth();
    onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        this.username = user.displayName;
      }
    });
  }


  makeMessage(){
    if (this.input != "") {
      this.msg.push(new Message(this.input, String(this.username)))
      this.input = "";
    }
  }
}





class Message {
  message : string;
  userName : string;
  timeStamp : Date;

  constructor(message : string, userName : string) {
    this.message = message;
    this.userName = userName;
    this.timeStamp = new Date;
  }
}
// Alexander 24-03-25