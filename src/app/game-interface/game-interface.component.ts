import { CommonModule } from '@angular/common';
import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FirebaseService } from '../services/firebase.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { get, ref } from 'firebase/database';

@Component({
  selector: 'app-game-interface',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './game-interface.component.html',
  styleUrls: ['./game-interface.component.css']
})
export class GameInterfaceComponent implements AfterViewInit, OnDestroy {
  gameId: string = '';
  game: any = null;
  safeUrl: SafeResourceUrl | null = null;
  manualScore: number = 0;

  private resendAttempts = 0;
  private maxAttempts = 3;
  private resendInterval: any;
  private unityAcknowledged = false;

  constructor(
    private route: ActivatedRoute,
    private firebaseService: FirebaseService,
    private sanitizer: DomSanitizer
  ) {}

  ngAfterViewInit() {
    this.gameId = this.route.snapshot.paramMap.get('gameId') || '';

    if (this.gameId) {
      console.log('Fetching game with ID:', this.gameId);
      this.fetchGameDetails(this.gameId);
    } else {
      console.error('Invalid game ID');
    }

    // Unity READY listener
    // window.addEventListener('message', this.handleHighScoreMessage.bind(this));
    window.addEventListener('message', this.handleUnityAck.bind(this));

    // Delay first send
    setTimeout(() => {
      this.sendStoredDataToUnity();
      this.beginResendLoop();
    }, 3000);
  }

  ngOnDestroy() {
    clearInterval(this.resendInterval);
    // window.removeEventListener('message', this.handleHighScoreMessage.bind(this));
    window.removeEventListener('message', this.handleUnityAck.bind(this));
  }

  private beginResendLoop() {
    this.resendInterval = setInterval(() => {
      if (this.unityAcknowledged || this.resendAttempts >= this.maxAttempts) {
        clearInterval(this.resendInterval);
        if (this.unityAcknowledged) {
          console.log("✅ Unity acknowledged player data.");
        } else {
          console.warn("⚠️ Unity never acknowledged player data after 3 attempts.");
        }
        return;
      }

      this.resendAttempts++;
      console.log(`🔁 Attempt #${this.resendAttempts} to resend UID & playerName to Unity...`);
      this.sendStoredDataToUnity();
    }, 5000);
  }

  private sendStoredDataToUnity() {
    const uid = localStorage.getItem('uid');
    const playerName = localStorage.getItem('playerName');

    if (!uid || !playerName) {
      console.warn('No UID or Player Name found in localStorage');
      return;
    }

    const iframe = document.querySelector('iframe') as HTMLIFrameElement;

    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        { type: 'SET_PLAYER_DATA', uid, name: playerName },
        '*'
      );
      console.log('📤 Sent UID & Player Name to Unity:', uid, playerName);
    }
  }

  private handleUnityAck(event: MessageEvent) {
    if (event.data === 'UNITY_ACK') {
      console.log("✅ Received UNITY_ACK from Unity");
      this.unityAcknowledged = true;
    }
  }

  async fetchGameDetails(gameId: string) {
    try {
      const database = this.firebaseService.getDatabase();
      const gameRef = ref(database, `games/${gameId}`);
      const snapshot = await get(gameRef);

      if (snapshot.exists()) {
        this.game = snapshot.val();
        this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.game.netlifyUrl);
        console.log('Game fetched:', this.game);
      } else {
        console.error('No game found with ID:', gameId);
      }
    } catch (error) {
      console.error('Error fetching game:', error);
    }
  }

  // handleHighScoreMessage(event: MessageEvent) {
  //   if (event.data.type === 'UPDATE_HIGHSCORE') {
  //     const highscoreData = event.data.data;

  //     console.log("🎯 Received high score data from Unity:", highscoreData);

  //     const userIdFromUnity = highscoreData.userId;
  //     const score = highscoreData.score;
  //     const storedUid = localStorage.getItem('uid');

  //     if (!storedUid || storedUid !== userIdFromUnity) {
  //       console.error('❌ Invalid userId received from Unity:', userIdFromUnity);
  //       return;
  //     }

  //     // TODO: Add your highscore logic here
  //   }
  // }
  submitScore() {
    const playerName = localStorage.getItem('playerName');
    const score = this.manualScore;
    const gameTitle = this.game?.title;
    const gameId = this.gameId;
  
    if (!playerName || !gameTitle || !gameId) {
      alert("Fejl: Mangler brugerdata eller spilinfo.");
      return;
    }
  
    if (!score || score <= 0) {
      alert("Score skal være større end 0.");
      return;
    }
  
    this.firebaseService.submitHighscore(playerName, gameTitle, score, gameId)
      .then(() => {
        alert("✅ Score sendt!");
        this.manualScore = 0;
      })
      .catch((err) => {
        console.error("❌ Fejl ved at sende score:", err);
        alert("Kunne ikke sende score.");
      });
  }
  
  
}
