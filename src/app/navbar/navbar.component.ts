import { Component, OnInit, Renderer2 } from '@angular/core';
import { FirebaseService } from '../services/firebase.service';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { getAuth, signOut } from 'firebase/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  imports: [CommonModule, RouterModule],
})
export class NavbarComponent implements OnInit {
  isLoggedIn = false;
  isAdmin = false;
  displayName: string = '';
  isMinimized = false;

  constructor(
    private firebaseService: FirebaseService,
    private router: Router,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.firebaseService.getAuthStateListener((user: any) => {
      this.isLoggedIn = !!user;

      if (user) {
        this.firebaseService.updateDisplayName(user.uid)
          .then(() => {
            this.displayName = this.firebaseService.currentDisplayName;
          })
          .catch(() => this.displayName = 'Bruger');

        this.firebaseService.checkIfAdmin(user.uid)
          .then(adminStatus => this.isAdmin = adminStatus)
          .catch(() => this.isAdmin = false);

        this.firebaseService.getUserbyUID(user.uid)
          .then(userData => {
            const navbarColor = userData?.theme?.navbarColor;
            if (navbarColor) {
              this.applyNavbarTheme(navbarColor);
            }
          })
          .catch(err => console.error('Fejl ved hentning af navbarColor:', err));
      } else {
        this.isAdmin = false;
        this.displayName = '';
      }

      this.updateBodyPadding();
    });

    // Lyt til route-skift og opdater padding dynamisk
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.updateBodyPadding();
      }
    });

    this.updateBodyPadding();
  }

  toggleSidebar(): void {
    this.isMinimized = !this.isMinimized;
    this.updateBodyPadding();
  }

  updateBodyPadding(): void {
    const hiddenRoutes = ['/login', '/home'];
    const currentRoute = this.router.url;

    if (hiddenRoutes.includes(currentRoute)) {
      this.renderer.removeStyle(document.body, 'padding-left');
      return;
    }

    const width = this.isMinimized ? '60px' : '200px';
    this.renderer.setStyle(document.body, 'padding-left', width);
  }

  logout(): void {
    const auth = getAuth();
    signOut(auth)
      .then(() => {
        localStorage.clear();
        this.router.navigate(['/login']);
      })
      .catch((error) => console.error('Logout error:', error));
  }

  private applyNavbarTheme(navbarColor: string): void {
    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    if (!sidebar) return;

    sidebar.style.backgroundColor = navbarColor;

    const isDark = this.isDarkColor(navbarColor);
    const textColor = isDark ? 'white' : 'black';

    sidebar.style.color = textColor;
    sidebar.querySelectorAll('a, span, button, li').forEach(el => {
      (el as HTMLElement).style.color = textColor;
    });

    sidebar.querySelectorAll('img.icon').forEach(img => {
      (img as HTMLElement).style.filter = isDark ? 'invert(1)' : 'invert(0)';
    });
  }

  private isDarkColor(hex: string): boolean {
    if (!hex || hex.length !== 7 || !hex.startsWith('#')) return false;
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance < 140;
  }
}
