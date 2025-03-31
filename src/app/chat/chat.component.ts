import {
  AfterViewChecked,
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';

@Component({
  selector: 'app-chat',
  imports: [FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
})
// Alexander 24-03-25
export class ChatComponent implements AfterViewInit, AfterViewChecked {
  msg: Message[] = [];
  input: string = '';
  private username: string | null = '';
  private shouldScroll = true;

  @ViewChild('chat', { static: false }) chat!: ElementRef;

  ngAfterViewInit(): void {
    const element: Element = this.chat?.nativeElement;
    element.addEventListener('scroll', this.onScroll.bind(this));
  }

  ngOnInit() {
    const auth = getAuth();
    onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        this.username = user.displayName;
      }
    });
  }

  makeMessage() {
    if (this.input != '') {
      this.msg.push(new Message(this.input, String(this.username)));
      this.input = '';
      this.chat.nativeElement.scrollTop = this.chat.nativeElement.scrollHeight;
    }
  }

  onScroll() {
    const element: Element = this.chat?.nativeElement;
    const atBottom =
      element.scrollHeight <= element.clientHeight + element.scrollTop + 10;
    this.shouldScroll = atBottom;
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom() {
    if (this.shouldScroll) {
      const chatElement: Element = this.chat?.nativeElement;
      if (chatElement) {
        chatElement.scrollTop = chatElement.scrollHeight;
      }
    }
  }
}





class Message {
  message: string;
  uid: string | undefined;
  userName: string;
  timeStamp: Date;

  constructor(message: string, userName: string) {
    this.message = message;
    this.userName = userName;
    this.timeStamp = new Date();
    this.uid = getAuth().currentUser?.uid;
  }
}
// Alexander 24-03-25
