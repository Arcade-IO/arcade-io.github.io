import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../services/firebase.service';
import { get, ref, onValue } from 'firebase/database';  // Importer onValue til realtidsopdateringer
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'leaderboard-app',
  imports: [FormsModule, CommonModule],
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.css']
})
//usama 25-05-2025
export class leaderboardComponent implements OnInit {
  // selectedGameId: string | null = null;
  highscores: any[] = [];
  games: any[] = [];
  selectedGameId: string = "";


  constructor(private firebaseService: FirebaseService) {}

  ngOnInit(): void {
    this.loadGames();
  }

  // Funktion til at hente spil fra Firebase (kan tilføjes i FirebaseService)
  async loadGames() {
    const gamesRef = ref(this.firebaseService.getDatabase(), 'games/');
    const snapshot = await get(gamesRef);

    if (snapshot.exists()) {
      this.games = Object.keys(snapshot.val()).map(key => {
        return { id: key, name: snapshot.val()[key].title };
      });
    } else {
      console.log("Ingen spil fundet i Firebase.");
    }
  }

  // Funktion til at hente highscores baseret på valgt spil
  async loadHighscores() {
    if (this.selectedGameId) {
      this.firebaseService.getHighscoresForGame(this.selectedGameId)
        .then(highscores => {
          this.highscores = highscores;
        });
    }
  }

  // **NY KODE**: Realtidsopdatering af highscores for det valgte spil
  listenForHighscoreUpdates() {
    if (this.selectedGameId) {
      const highscoresRef = ref(this.firebaseService.getDatabase(), `highscores/`);
      
      // Lyt efter ændringer i highscore-databasen i realtid
      onValue(highscoresRef, (snapshot) => {
        if (snapshot.exists()) {
          const highscoresData = snapshot.val();
          this.highscores = [];
          
          for (let highscoreId in highscoresData) {
            if (highscoresData[highscoreId].games_Id === this.selectedGameId) {
              this.highscores.push({
                username: highscoresData[highscoreId].users_Id,
                gameTitle: highscoresData[highscoreId].score,
                score: highscoresData[highscoreId].score,
              });
            }
          }
        }
      });
    }
  }
}
//usama 25-05-2025
