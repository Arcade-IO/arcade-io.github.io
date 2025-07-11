/***********************************************************************************************
 *  dashboard.component.ts
 *  Re-skrevet 11-07-2025 for at fjerne dobbelt login-prompt i Dashboard-visningen
 ***********************************************************************************************/

 import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
 import { FirebaseService } from '../services/firebase.service';
 import { CommonModule } from '@angular/common';
 import { RouterModule } from '@angular/router';
 import { get, ref, update } from 'firebase/database';
 import { getAuth } from 'firebase/auth';
 
 @Component({
   selector: 'app-dashboard',
   standalone: true,
   imports: [CommonModule, RouterModule],
   templateUrl: './dashboard.component.html',
   styleUrls: ['./dashboard.component.css']
 })
 export class DashboardComponent implements OnInit {
   /* --------------- Fjernet isLoggedIn ---------------- */
   isAdmin = false;
 
   games: any[] = [];
   latestGames: any[] = [];
   popularGames: any[] = [];
 
   @ViewChild('scrollContainer', { static: false }) scrollContainer!: ElementRef;
 
   constructor(private firebaseService: FirebaseService) {}
 
   /* --------------------------------------------------- */
   /* Life-cycle                                          */
   /* --------------------------------------------------- */
   ngOnInit(): void {
     this.initializeAdminStatus();      /* NY metode               */
     this.loadGamesFromFirebase();      /* Som før                 */
     this.addMissingPlaysField();       /* Som før                 */
   }
 
   /* --------------------------------------------------- */
   /* Admin check – enkelt og synkront                    */
   /* --------------------------------------------------- */
   private initializeAdminStatus(): void {
     const current = getAuth().currentUser;
 
     if (current) {
       this.firebaseService.checkIfAdmin(current.uid)
         .then(status => this.isAdmin = status)
         .catch(err => {
           console.error('Error checking admin status in Dashboard:', err);
           this.isAdmin = false;
         });
     } else {
       /* Skulle aldrig ske – AuthGuard garanterer logget ind */
       this.isAdmin = false;
     }
   }
 
   /* --------------------------------------------------- */
   /* Firebase-operationer (uændrede)                      */
   /* --------------------------------------------------- */
   async loadGamesFromFirebase() {
     try {
       const db = this.firebaseService.getDatabase();
       const gamesRef = ref(db, 'games');
       const snapshot = await get(gamesRef);
 
       if (snapshot.exists()) {
         const data = snapshot.val();
         const allGames = Object.keys(data).map((key) => ({
           id: key,
           ...data[key],
         }));
 
         this.games = allGames;
 
         this.latestGames = allGames
           .slice()
           .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
           .slice(0, 1);
 
         this.popularGames = allGames
           .filter(game => typeof game.plays === 'number')
           .sort((a, b) => b.plays - a.plays)
           .slice(0, 10);
 
         console.log('Hentede spil fra Firebase:', this.games);
       } else {
         console.log('Ingen spil fundet i databasen.');
       }
     } catch (error) {
       console.error('Fejl ved indlæsning af spil:', error);
     }
   }
 
   scrollLeft(): void {
     if (this.scrollContainer) {
       this.scrollContainer.nativeElement.scrollBy({
         left: -200,
         behavior: 'smooth'
       });
     }
   }
 
   scrollRight(): void {
     if (this.scrollContainer) {
       this.scrollContainer.nativeElement.scrollBy({
         left: 200,
         behavior: 'smooth'
       });
     }
   }
 
   deleteGame(gameId: string): void {
     if (confirm("Er du sikker på, at du vil slette dette spil?")) {
       this.firebaseService.deleteGame(gameId)
         .then(() => {
           this.games = this.games.filter(game => game.id !== gameId);
           this.latestGames = this.latestGames.filter(game => game.id !== gameId);
           this.popularGames = this.popularGames.filter(game => game.id !== gameId);
           console.log("Spillet blev slettet.");
         })
         .catch(error => {
           console.error("Fejl ved sletning af spil:", error);
         });
     }
   }
 
   async addMissingPlaysField(): Promise<void> {
     try {
       const db = this.firebaseService.getDatabase();
       const gamesRef = ref(db, 'games');
       const snapshot = await get(gamesRef);
 
       if (snapshot.exists()) {
         const data = snapshot.val();
         const updates: Promise<void>[] = [];
 
         for (const gameId in data) {
           const game = data[gameId];
           if (typeof game.plays !== 'number') {
             const gameRef = ref(db, `games/${gameId}`);
             updates.push(update(gameRef, { plays: 0 }));
             console.log(`✅ Tilføjede 'plays: 0' til spillet ${game.title}`);
           }
         }
 
         await Promise.all(updates);
 
         if (updates.length === 0) {
           console.log('Alle spil har allerede feltet "plays".');
         } else {
           console.log(`🎉 Tilføjede 'plays' til ${updates.length} spil.`);
         }
 
       } else {
         console.log('⚠️ Der findes ingen spil i databasen.');
       }
 
     } catch (error) {
       console.error('❌ Fejl ved tilføjelse af "plays"-felter:', error);
     }
   }
 }
 