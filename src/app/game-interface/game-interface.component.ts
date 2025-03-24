import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
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
export class GameInterfaceComponent implements OnInit, OnDestroy {
  gameId: string = '';
  game: any = null;
  safeUrl: SafeResourceUrl | null = null;

  constructor(
    private route: ActivatedRoute,
    private firebaseService: FirebaseService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
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
  }

  ngOnDestroy() {
    // Clean up the event listener when the component is destroyed
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
      const database = this.firebaseService.getDatabase();
      const userRef = ref(database, `users/currentUser`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const userData = snapshot.val();
        const uid = userData.uid;
        const playerName = userData.playerName;
        localStorage.setItem('uid', uid);
        localStorage.setItem('playerName', playerName);
        
        console.log('✅ Sending UID & Player Name to Unity:', uid, playerName);
        this.sendPlayerDataToUnity(uid, playerName);
      } else {
        console.error('❌ No user data found!');
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

  // Event listener to handle the message from Unity
  handleHighScoreMessage(event: MessageEvent) {
    if (event.data.type === 'UPDATE_HIGHSCORE') {
      const highscoreData = event.data.data;

      console.log("Received high score data from Unity:", highscoreData);

      // Now, handle the received high score data
      const userId = highscoreData.userId;
      const score = highscoreData.score;
      const gameId = highscoreData.gameId;

      this.onGameOver(userId, score);  // Call the method to update or create the high score
    }
  }

  async onGameOver(userId: string, score: number) {
    try {
      const gameId = this.gameId; // The current game ID
      await this.firebaseService.createOrUpdateHighscore(userId, gameId, score); // Update or create highscore
      console.log("Highscore processed!");
    } catch (error) {
      console.error("Error processing highscore:", error);
    }
  }
}
