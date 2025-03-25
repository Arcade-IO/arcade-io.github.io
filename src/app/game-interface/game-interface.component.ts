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
  styleUrl: './game-interface.component.css'
})
export class GameInterfaceComponent implements AfterViewInit, OnDestroy {
/* hazel 25-03-2025 */

  gameId: string = '';
  game: any = null;
  safeUrl: SafeResourceUrl | null = null;
  private unityReady = false;

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

    // Listen for the UPDATE_HIGHSCORE message from Unity
    window.addEventListener('message', this.handleHighScoreMessage.bind(this));

    // Fetch user details and send them to Unity
    this.fetchUserDetailsAndSendToUnity();

    const iframe = document.querySelector('iframe') as HTMLIFrameElement;
    const uid = localStorage.getItem('uid');
    const playerName = localStorage.getItem('playerName');

    if (uid && playerName) {
      console.log('Stored UID:', uid);
      console.log('Stored Player Name:', playerName);

      if (iframe) {
        window.addEventListener('message', (event) => {
          if (event.data === 'UNITY_READY') {
            this.unityReady = true;
            this.sendUIDAndPlayerName(iframe, uid, playerName);
          }
        });

        setTimeout(() => {
          if (!this.unityReady) {
            this.sendUIDAndPlayerName(iframe, uid, playerName);
          }
        }, 3000);
      }
    } else {
      console.warn('No UID or Player Name found in localStorage');
    }
  }

  ngOnDestroy() {
    window.removeEventListener('message', this.handleHighScoreMessage.bind(this));
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

  async fetchUserDetailsAndSendToUnity() {
    try {
      const currentUser = await new Promise<any>((resolve) => {
        this.firebaseService.getAuthStateListener((user) => resolve(user));
      });

      if (currentUser) {
        localStorage.setItem('uid', currentUser.uid);
        const uid = localStorage.getItem('uid');

        const database = this.firebaseService.getDatabase();
        const userRef = ref(database, `users/${uid}`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
          const userData = snapshot.val();
          localStorage.setItem('playerName', userData.name);
          const name = localStorage.getItem('playerName') || "Guest";

          console.log('✅ Sending UID & Player Name to Unity:', uid, name);
          if (uid && name) {
            this.sendPlayerDataToUnity(uid, name);
          } else {
            console.error('❌ UID or Player Name is null');
          }
        } else {
          console.error('❌ No user data found for UID:', uid);
        }
      } else {
        console.error('❌ No authenticated user found!');
      }
    } catch (error) {
      console.error('❌ Error fetching user data:', error);
    }
  }

  sendPlayerDataToUnity(uid: string, playerName: string) {
    window.postMessage(
      {
        type: "SET_PLAYER_DATA",
        uid: uid,
        playerName: playerName, 
      },
      "*"
    );
  }

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

  async onGameOver(score: number) {
    try {
      const uid = localStorage.getItem('uid');
      if (!uid) {
        console.error('❌ No UID found in localStorage!');
        return;
      }

      const gameId = this.gameId;

      await this.firebaseService.createOrUpdateHighscore(uid, gameId, score);
      console.log("Highscore processed!");
    } catch (error) {
      console.error("Error processing highscore:", error);
    }
  }

  private sendUIDAndPlayerName(iframe: HTMLIFrameElement, uid: string | null, playerName: string | null) {
    if (iframe.contentWindow && uid && playerName) {
      iframe.contentWindow.postMessage(
        { type: 'SET_PLAYER_DATA', uid: uid, playerName: playerName },
        '*' // Replace '*' with your Unity build's origin for security
      );
      console.log('Sent UID:', uid);
      console.log('Sent Player Name:', playerName);
    } else {
      console.error('Failed to send UID or Player Name: One or both values are missing.');
    }
  }
}
/* hazel 25-03-2025 */
