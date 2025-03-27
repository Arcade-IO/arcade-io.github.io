import { AfterViewChecked, Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth'

@Component({
  selector: 'app-chat',
  imports: [FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
// Alexander 24-03-25 

export class ChatComponent implements AfterViewChecked {
  msg : Message[] = [];
  input : string = "";
  username : string | null = "";

  @ViewChild('chat') chat!: ElementRef;

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
      // this.scrollToBottom();
    }
  }


  ngAfterViewChecked() {    
    // this.scrollToBottom();
  }


  private scrollToBottom() {
    setTimeout(() => {
      const chatElement : Element = this.chat?.nativeElement;
      if (chatElement) {
        chatElement.scrollTop = chatElement.scrollHeight;        
      }
    }, 100)
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