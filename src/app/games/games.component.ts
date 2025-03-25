import { Component } from '@angular/core';
import { FirebaseService } from '../services/firebase.service';

@Component({
  selector: 'app-games',
  templateUrl: './games.component.html',
  styleUrls: ['./games.component.css']
})
export class GamesComponent {
/* Martin 25-03-2025 */
  // Komponentens properties, som opdateres via input events
  title: string = '';
  description: string = '';
  imageUrl: string = '';
  netlifyUrl: string = '';
  platform: string = ''; // Fx "Web", "Android" eller "Both"
  constructor(private firebaseService: FirebaseService) {}
  // Opdaterer title
  updateTitle(event: any): void {
    this.title = event.target.value;
  }
  // Opdaterer description
  updateDescription(event: any): void {
    this.description = event.target.value;
  }
  // Opdaterer imageUrl
  updateImageUrl(event: any): void {
    this.imageUrl = event.target.value;
  }
  // Opdaterer netlifyUrl
  updateNetlifyUrl(event: any): void {
    this.netlifyUrl = event.target.value;
  }
  // Opdaterer platform
  updatePlatform(event: any): void {
    this.platform = event.target.value;
  }
  // Opretter et nyt spil og sender dataen til Firebase
  createNewGame(): void {
    // Generer et unikt gameId
    const gameId = 'game_' + Date.now();
    // Hent det nuværende bruger-id fra FirebaseService
    const currentUser = this.firebaseService.getCurrentUser();
    if (!currentUser || !currentUser.uid) {
      console.error('Ingen bruger logget ind');
      return;
    }
    const userId = currentUser.uid;
    this.firebaseService.createGame(
      gameId,
      this.title,
      this.description,
      this.imageUrl,
      this.netlifyUrl,
      this.platform,
      userId
    )
    .then(() => {
      console.log('Spillet er oprettet!');
      this.resetForm();
    })
    .catch((error: any) => {
      console.error('Fejl ved oprettelse af spil:', error);
    });
  }
  // Nulstil formularfelterne
  resetForm(): void {
    this.title = '';
    this.description = '';
    this.imageUrl = '';
    this.netlifyUrl = '';
    this.platform = '';
  }
}
/* Martin 25-03-2025 */
