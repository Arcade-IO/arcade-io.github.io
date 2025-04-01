import {
  AfterViewChecked,
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { Message } from './Message'

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
  
  ngAfterViewChecked() {
    this.scrollToBottom();
  }
  
  ngAfterViewInit(): void {
    const element: Element = this.chat?.nativeElement;
    element.addEventListener('scroll', this.onScroll.bind(this));
  }

  ngOnInit() {
    const auth = getAuth();
    onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        this.userName = user.displayName;
      }
    });
  }

  //#region Message controle
  makeMessage() {
    if (this.input != '') {
      this.msg.push(new Message(this.input, String(this.userName)));
      this.input = '';
      this.chat.nativeElement.scrollTop = this.chat.nativeElement.scrollHeight;
    }
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