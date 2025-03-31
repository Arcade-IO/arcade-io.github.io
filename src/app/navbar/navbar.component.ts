import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../services/firebase.service';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { getAuth, signOut } from 'firebase/auth';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  imports: [CommonModule, RouterModule],
})
export class NavbarComponent implements OnInit {
  isLoggedIn = false;
  isAdmin = false;
  displayName: string = '';

  constructor(private firebaseService: FirebaseService, private router: Router) {}

  ngOnInit(): void {
    this.firebaseService.getAuthStateListener((user: any) => {
      this.isLoggedIn = !!user;
      if (user) {
        this.firebaseService.updateDisplayName(user.uid).then(() => {
          this.displayName = this.firebaseService.currentDisplayName;
        }).catch((error) => {
          console.error("Error updating displayName in Navbar:", error);
          this.displayName = 'Bruger';
        });
        
        this.firebaseService.checkIfAdmin(user.uid)
          .then((adminStatus) => {
            this.isAdmin = adminStatus;
          })
          .catch((error) => {
            console.error("Error checking admin status in Navbar:", error);
            this.isAdmin = false;
          });
      } else {
        this.isAdmin = false;
        this.displayName = '';
      }
    });
  }

  logout(): void {
    const auth = getAuth();
    signOut(auth)
      .then(() => {
        // Fjern specifikke nøgler fra localStorage
        localStorage.removeItem('uid');
        localStorage.removeItem('playerName');
  
        // Alternativt, hvis du vil rydde alt:
        localStorage.clear();
  
        // Naviger brugeren til login- eller hjem-siden
        this.router.navigate(['/login']);
        console.log('User logged out and localStorage cleared.');
      })
      .catch((error) => {
        console.error('Error during logout:', error);
      });
  }
  
}