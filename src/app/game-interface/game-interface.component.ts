import { CommonModule } from '@angular/common';
import { Component, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FirebaseService } from '../services/firebase.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { get, ref } from 'firebase/database';
import { AngularFireAuth } from '@angular/fire/compat/auth'; // Husk at installere og konfigurere AngularFire

@Component({
  selector: 'app-game-interface',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './game-interface.component.html',
  styleUrls: ['./game-interface.component.css']
})
export class GameInterfaceComponent implements AfterViewInit {
  /* hazel 25-03-2025 */
  gameId: string = '';
  game: any = null;
  safeUrl: SafeResourceUrl | null = null;
  manualScore: number = 0;  // Ny variabel til den manuelt indtastede score

  constructor(
    private route: ActivatedRoute,
    private firebaseService: FirebaseService,
    private sanitizer: DomSanitizer,
    private afAuth: AngularFireAuth // Injekt AngularFireAuth
  ) {}

  ngAfterViewInit() {
    this.gameId = this.route.snapshot.paramMap.get('gameId') || '';

    if (this.gameId) {
      console.log('Fetching game with ID:', this.gameId);
      this.fetchGameDetails(this.gameId);
    } else {
      console.error('Invalid game ID');
    }

    // Lyt efter Unitys highscore beskeder
    window.addEventListener('message', this.handleHighScoreMessage.bind(this));

    // Abonner på auth-state og send brugerdata, når brugeren er logget ind
    this.afAuth.authState.subscribe(user => {
      if (user) {
        // Gem UID og displayName i localStorage
        localStorage.setItem('uid', user.uid);
        if (user.displayName) {
          localStorage.setItem('playerName', user.displayName);
        }
        console.log('Brugerdata gemt i localStorage:', { uid: user.uid, playerName: user.displayName });
        this.sendStoredDataToUnity();
      } else {
        console.warn('Bruger ikke logget ind endnu');
      }
    });
  }

  private sendStoredDataToUnity() {
    const uid = localStorage.getItem('uid'); // Retrieve UID from localStorage
    const playerName = localStorage.getItem('playerName'); // Retrieve Player Name from localStorage

    if (!uid || !playerName) {
      console.warn('No UID or Player Name found in localStorage');
      return;
    }

    console.log('Stored UID:', uid);
    console.log('Stored Player Name:', playerName);

    const iframe = document.querySelector('iframe') as HTMLIFrameElement;

    if (iframe) {
      // Lyt efter Unity's "READY" event
      window.addEventListener('message', (event) => {
        if (event.data === 'UNITY_READY') {
          this.sendUIDAndPlayerName(iframe, uid, playerName);
        }
      });

      // Send UID og Player Name efter en forsinkelse (fallback)
      setTimeout(() => {
        this.sendUIDAndPlayerName(iframe, uid, playerName);
      }, 3000);
    }
  }

  private sendUIDAndPlayerName(iframe: HTMLIFrameElement, uid: string, playerName: string) {
    if (iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        { type: 'SET_PLAYER_DATA', uid: uid, playerName: playerName },
        '*' // Udskift '*' med Unity-buildens origin for øget sikkerhed
      );
      console.log('Sent UID:', uid);
      console.log('Sent Player Name:', playerName);
    } else {
      console.error('Failed to send UID or Player Name: iframe contentWindow is null.');
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

  // Hvis Unity sender score, modtages den her
  handleHighScoreMessage(event: MessageEvent) {
    if (event.data.type === 'UPDATE_HIGHSCORE') {
      const highscoreData = event.data.data;

      console.log("Received high score data from Unity:", highscoreData);

      const userIdFromUnity = highscoreData.userId;
      const score = highscoreData.score;

      const storedUid = localStorage.getItem('uid');
      if (!storedUid || storedUid !== userIdFromUnity) {
        console.error('❌ Invalid userId received from Unity:', userIdFromUnity);
        return;
      }

      this.onGameOver(score);
    }
  }

  // Funktion til at sende den manuelt indtastede score
  submitScore() {
    if (this.manualScore > 0) {
      this.onGameOver(this.manualScore);
    } else {
      console.error("Score skal være større end 0.");
    }
  }

  async onGameOver(score: number) {
    try {
      const uid = localStorage.getItem('uid');
      if (!uid) {
        console.error('❌ No UID found in localStorage!');
        return;
      }

      const gameId = this.gameId;
      // Metoden henter automatisk brugerens displayName og spillets titel fra Firebase
      await this.firebaseService.createOrUpdateHighscore(uid, gameId, score);
      console.log("Highscore processed!");
    } catch (error) {
      console.error("Error processing highscore:", error);
    }
  }
  /* hazel 25-03-2025 */
}
