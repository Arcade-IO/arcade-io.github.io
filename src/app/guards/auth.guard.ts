import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}
/* Martin 25-03-2025 */

  async canActivate(): Promise<boolean> {
    const auth = getAuth();
    return new Promise<boolean>((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        if (user) {
          resolve(true);
        } else {
          this.router.navigate(['/login']); // Redirect to your login page
          resolve(false);
        }
      });
    });
  }
}
/* Martin 25-03-2025 */
