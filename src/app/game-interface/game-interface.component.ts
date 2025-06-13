import { CommonModule }               from '@angular/common';
import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { FormsModule }                from '@angular/forms';
import { ActivatedRoute }             from '@angular/router';
import { FirebaseService }            from '../services/firebase.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { get, ref }                   from 'firebase/database';
import { ChatComponent }              from '../chat/chat.component';

@Component({
  selector: 'app-game-interface',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatComponent],
  templateUrl: './game-interface.component.html',
  styleUrls: ['./game-interface.component.css']
})
export class GameInterfaceComponent implements AfterViewInit, OnDestroy {
  gameId:  string = '';
  game:    any    = null;
  safeUrl: SafeResourceUrl | null = null;   // ← brugt til iframe-src

  private resendAttempts   = 0;
  private maxAttempts      = 3;
  private resendInterval: any;
  private unityAcknowledged = false;

  constructor(
    private route: ActivatedRoute,
    private firebaseService: FirebaseService,
    private sanitizer: DomSanitizer
  ) {}

  /* ---------- Chat-toggle ---------- */
  showChat: boolean = true;
  toggleChat() { this.showChat = !this.showChat; }

  /* ---------- Lifecycle ---------- */
  ngAfterViewInit() {
    this.gameId = this.route.snapshot.paramMap.get('gameId') || '';

    if (this.gameId) {
      console.log('Fetching game with ID:', this.gameId);
      this.fetchGameDetails(this.gameId);
    } else {
      console.error('Invalid game ID');
    }

    /*  Lyt efter UNITY_ACK + highscore-events  */
    window.addEventListener('message', this.handleUnityMessages.bind(this));

    /*  Send UID + navn til Unity, og (gen)send op til 3 gange  */
    setTimeout(() => {
      this.sendStoredDataToUnity();
      this.beginResendLoop();
    }, 3000);
  }

  ngOnDestroy() {
    clearInterval(this.resendInterval);
    window.removeEventListener('message', this.handleUnityMessages.bind(this));
  }

  /* ---------- Resend-loop ---------- */
  private beginResendLoop() {
    this.resendInterval = setInterval(() => {
      if (this.unityAcknowledged || this.resendAttempts >= this.maxAttempts) {
        clearInterval(this.resendInterval);
        if (!this.unityAcknowledged)
          console.warn('⚠️ Unity never acknowledged player data after 3 attempts.');
        return;
      }
      this.resendAttempts++;
      console.log(`🔁 Attempt #${this.resendAttempts} to resend UID & playerName to Unity...`);
      this.sendStoredDataToUnity();
    }, 5000);
  }

  /* ---------- Send UID + navn til Unity ---------- */
  private sendStoredDataToUnity() {
    const uid        = localStorage.getItem('uid');
    const playerName = localStorage.getItem('playerName');

    if (!uid || !playerName) {
      console.warn('No UID or Player Name found in localStorage');
      return;
    }

    const iframe = document.querySelector('iframe') as HTMLIFrameElement;
    iframe?.contentWindow?.postMessage({ type: 'SET_PLAYER_DATA', uid, name: playerName }, '*');
    console.log('📤 Sent UID & Player Name to Unity:', uid, playerName);
  }

  /* ---------- Unity-hændelser ---------- */
  private handleUnityMessages(event: MessageEvent) {
    if (event.data === 'UNITY_ACK') {
      console.log('✅ Received UNITY_ACK from Unity');
      this.unityAcknowledged = true;
      return;
    }

    if (event.data?.type === 'UPDATE_HIGHSCORE') {
      console.log('🎯 Received high score data from Unity:', event.data.data);
      this.pushHighscoreToFirebase(event.data.data);
    }
  }

  /* ---------- Gem highscore i Firebase ---------- */
  private async pushHighscoreToFirebase(highscoreData: { userId: string; score: number }) {
    const { userId, score } = highscoreData;
    const storedUid = localStorage.getItem('uid');
    if (!storedUid || storedUid !== userId) {
      console.error('❌ Invalid userId received from Unity:', userId);
      return;
    }

    const gameTitle = this.game?.title;
    const gameId    = this.gameId;
    if (!gameTitle || !gameId) {
      console.error('❌ Missing game information – cannot save highscore.');
      return;
    }

    try {
      const userData   = await this.firebaseService.getUserbyUID(userId);
      const playerName = userData.displayName || 'Ukendt Spiller';
      const email      = userData.email       || 'ukendt@email.dk';

      await this.firebaseService.submitHighscore(
        playerName,
        email,
        gameTitle,
        score,
        gameId
      );
      console.log('✅ Highscore saved to Firebase (automatic)');
    } catch (err) {
      console.error('❌ Error while saving highscore:', err);
    }
  }

  /* ---------- Hent spil-detaljer ---------- */
  async fetchGameDetails(gameId: string) {
const uid        = localStorage.getItem('uid')       || '';
const playerName = localStorage.getItem('playerName') || '';
const urlWithParams = `${this.game.netlifyUrl}` +
  `?uid=${encodeURIComponent(uid)}` +
  `&name=${encodeURIComponent(playerName)}`;
this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(urlWithParams);

  }
}
