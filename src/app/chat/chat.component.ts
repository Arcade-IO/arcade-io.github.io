import {
  AfterViewChecked,
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { Message } from './Message';
import { FirebaseService } from '../services/firebase.service';

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
  private userName: string | null = '';
  private shouldScroll = true;
  
  @ViewChild('chat', { static: false }) chat!: ElementRef;

  constructor(private fire : FirebaseService) {}
  
  ngAfterViewChecked() {
    this.scrollToBottom();
  }
  
  ngAfterViewInit(): void {
    this.newMessages();
    const element: Element = this.chat?.nativeElement;
    element.addEventListener('scroll', this.onScroll.bind(this));
  }

  ngOnInit() {
    this.deleteOldMessages();
    const auth = getAuth();
    onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        this.userName = user.displayName;
      }
    });
  }

  //#region Message controle
  makeMessage() {
    if (this.input.trim() !== '') {
      const m = new Message(this.input, String(this.userName));
      this.fire.sendMessage(m);
      this.input = '';
      this.chat.nativeElement.scrollTop = this.chat.nativeElement.scrollHeight;
    }
  }

  newMessages() {
    this.fire.listenForMessages((message) => {
      this.msg.push(message);
      this.scrollToBottom();
    });
  }

  deleteOldMessages() {
    this.fire.cleanOldMessages();
  }

  //#endregion

  //#region Scroll Controle
  onScroll() {
    const element: Element = this.chat?.nativeElement;
    const atBottom =
      element.scrollHeight <= element.clientHeight + element.scrollTop + 10;
    this.shouldScroll = atBottom;
  }

  private scrollToBottom() {
    if (this.shouldScroll) {
      const chatElement: Element = this.chat?.nativeElement;
      if (chatElement) {
        chatElement.scrollTop = chatElement.scrollHeight;
      }
    }
  }
  //#endregion
}
// Alexander 24-03-25