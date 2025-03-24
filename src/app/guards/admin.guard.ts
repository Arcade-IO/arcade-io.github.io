import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { FirebaseService } from '../services/firebase.service';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

@Injectable({
  providedIn: 'root',
})
export class AdminGuard implements CanActivate {
  constructor(private firebaseService: FirebaseService, private router: Router) {}

  async canActivate(): Promise<boolean> {
    const auth = getAuth();
    return new Promise<boolean>((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        unsubscribe(); // Clean up the listener once we have the user info

        // If there is no user, redirect to admin login page
        if (!user) {
          this.router.navigate(['/admin-login']);
          resolve(false);
          return;
        }

        // If the user is logged in, check if they have admin privileges
        const isAdmin = await this.firebaseService.checkIfAdmin(user.uid);
        if (!isAdmin) {
          // Optionally, redirect non-admins to another page (here, the homepage)
          this.router.navigate(['/']);
          resolve(false);
          return;
        }

        // The user is logged in and is an admin
        resolve(true);
      });
    });
  }
}
