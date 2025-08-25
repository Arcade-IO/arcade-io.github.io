/* Martin 25-03-2025 – OPDATERET 11-07-2025 */
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  /**
   * Venter maksimalt 3 sekunder på, at Firebase loader den
   * persisterede session. Giver TRUE hvis bruger findes,
   * ellers redirect til /login og giver FALSE.
   */
  canActivate(): Promise<boolean> {
    const auth = getAuth();

    return new Promise<boolean>((resolve) => {
      let resolved = false;

      const finish = (allowed: boolean) => {
        if (!resolved) {
          resolved = true;
          resolve(allowed);
        }
      };

      /* Lyt på auth-state */
      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          if (user) {
            unsubscribe();
            finish(true);
          }
        },
        (error) => {
          console.error('AuthGuard-fejl:', error);
          unsubscribe();
          this.router.navigate(['/login']);
          finish(false);
        }
      );

      /* Fallback-timeout på 3 sek. */
      setTimeout(() => {
        unsubscribe();
        if (auth.currentUser) {
          finish(true);
        } else {
          this.router.navigate(['/login']);
          finish(false);
        }
      }, 3000);
    });
  }
}
