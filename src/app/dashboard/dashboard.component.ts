import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../services/firebase.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { get, ref } from 'firebase/database';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  isLoggedIn = false;
  isAdmin = false;

  // Tom liste, der bliver udfyldt, når vi henter spil fra Firebase
  games: any[] = [];

  constructor(private firebaseService: FirebaseService) {}

  ngOnInit(): void {
    // Overvåg om brugeren er logget ind
    this.firebaseService.getAuthStateListener((user: any) => {
      this.isLoggedIn = !!user;

      if (user) {
        this.firebaseService.checkIfAdmin(user.uid)
          .then((adminStatus) => {
            this.isAdmin = adminStatus;
          })
          .catch((error) => {
            console.error('Error checking admin status in Dashboard:', error);
            this.isAdmin = false;
          });
      } else {
        this.isAdmin = false;
      }
    });

    // Hent spil fra Firebase
    this.loadGamesFromFirebase();
  }

  async loadGamesFromFirebase() {
    try {
      const db = this.firebaseService.getDatabase();
      const gamesRef = ref(db, 'games');
      const snapshot = await get(gamesRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        // Konverterer det objekterede Firebase-output til en array
        this.games = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        console.log('Hentede spil fra Firebase:', this.games);
      } else {
        console.log('Ingen spil fundet i databasen.');
      }
    } catch (error) {
      console.error('Fejl ved indlæsning af spil:', error);
    }
  }

  // Slet spil-funktion
  deleteGame(gameId: string): void {
    if (confirm("Er du sikker på, at du vil slette dette spil?")) {
      this.firebaseService.deleteGame(gameId)
        .then(() => {
          // Fjern det slettede spil fra den lokale liste
          this.games = this.games.filter(game => game.id !== gameId);
          console.log("Spillet blev slettet.");
        })
        .catch(error => {
          console.error("Fejl ved sletning af spil:", error);
        });
    }
  }
}
