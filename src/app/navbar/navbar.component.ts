import { Component, OnInit, Renderer2 } from '@angular/core';
import { FirebaseService } from '../services/firebase.service';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { getAuth, signOut } from 'firebase/auth';
import { Subscription } from 'rxjs';

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
  displayName = '';
  isMinimized = false;     // desktop: sidebar minimering
  isMobileOpen = false;    // mobil: burger toggle
  isMobile = false;        // opdateres i checkScreenWidth()

  private subscriptions: Subscription[] = [];

  constructor(
    private firebaseService: FirebaseService,
    private router: Router,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.checkScreenWidth();

    // 🔥 Subscribe to reactive displayName stream
    const sub = this.firebaseService.currentDisplayName$.subscribe(name => {
      this.displayName = name;
    });
    this.subscriptions.push(sub);

    this.firebaseService.getAuthStateListener(async user => {
      this.isLoggedIn = !!user;

      if (user) {
        // 🔥 Trigger refresh so the BehaviorSubject updates
        await this.firebaseService.refreshDisplayName(user.uid);

        this.firebaseService.checkIfAdmin(user.uid)
          .then(adminStatus => this.isAdmin = adminStatus)
          .catch(() => this.isAdmin = false);

        // 🟢 Hent og anvend brugerens theme direkte her
        try {
          const userData = await this.firebaseService.getUserbyUID(user.uid);
          if (userData?.theme) {
            const bg = userData.theme.backgroundColor;
            const nav = userData.theme.navbarColor;

            if (bg) {
              document.body.style.backgroundColor = bg;
            }
            if (nav) {
              const navEl = document.querySelector('.Navbar') as HTMLElement | null;
              if (navEl) {
                navEl.style.backgroundColor = nav;
              }
            }
          }
        } catch (err) {
          console.error("Error applying theme:", err);
        }

      } else {
        this.isAdmin = false;
        this.displayName = '';
      }

      this.updateBodyPadding();
    });

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.updateBodyPadding();
        this.isMobileOpen = false; // luk sidebar ved navigation
      }
    });

    window.addEventListener('resize', () => {
      this.checkScreenWidth();
    });
  }

  ngOnDestroy(): void {
    // clean up subscriptions
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  checkScreenWidth(): void {
    this.isMobile = window.innerWidth <= 768;
    this.updateBodyPadding();
  }

  toggleSidebarDesktop(): void {
    this.isMinimized = !this.isMinimized;
    this.updateBodyPadding();
  }

  toggleSidebarMobile(): void {
    this.isMobileOpen = !this.isMobileOpen;
  }

  updateBodyPadding(): void {
    const hiddenRoutes = ['/login', '/home'];
    const currentRoute = this.router.url;

    if (hiddenRoutes.includes(currentRoute)) {
      this.renderer.removeStyle(document.body, 'padding-left');
      return;
    }

    if (window.innerWidth > 768) {
      const width = this.isMinimized ? '60px' : '200px';
      this.renderer.setStyle(document.body, 'padding-left', width);
    } else {
      this.renderer.removeStyle(document.body, 'padding-left');
    }
  }

  logout(): void {
    const auth = getAuth();
    signOut(auth)
      .then(() => {
        localStorage.clear();
        this.router.navigate(['/login']);
      })
      .catch(console.error);
  }
}
