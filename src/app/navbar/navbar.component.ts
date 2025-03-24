import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../services/firebase.service';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  imports: [CommonModule, RouterModule],
})
export class NavbarComponent implements OnInit {
  isLoggedIn = false;
  isAdmin = false;

  constructor(private firebaseService: FirebaseService, private router: Router) {}

  ngOnInit(): void {
    // Subscribe to auth state changes so that the component updates once Firebase restores auth state.
    this.firebaseService.getAuthStateListener((user: any) => {
      this.isLoggedIn = !!user;
      if (user) {
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
      }
    });
  }

  // Logout function: logs out and then navigates to /home.
  async logout(): Promise<void> {
    await this.firebaseService.logout();
    this.isLoggedIn = false;
    this.isAdmin = false;
    this.router.navigate(['/home']);
  }
}
