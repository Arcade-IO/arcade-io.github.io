import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { environment } from './app/environments/environment';

const firebaseApp = initializeApp(environment.firebaseConfig);
const auth = getAuth(firebaseApp);
const database = getDatabase(firebaseApp);

// Beregn om farven er mørk eller lys (returnerer true hvis mørk)
function isDark(hexColor: string): boolean {
  if (!hexColor.startsWith('#') || hexColor.length !== 7) return false;
  const r = parseInt(hexColor.substr(1, 2), 16);
  const g = parseInt(hexColor.substr(3, 2), 16);
  const b = parseInt(hexColor.substr(5, 2), 16);
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance < 128;
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const themeRef = ref(database, `users/${user.uid}/theme`);
    try {
      const snapshot = await get(themeRef);
      if (snapshot.exists()) {
        const theme = snapshot.val();

        // 🎨 Global baggrund + font
        if (theme.backgroundColor) {
          const isBgDark = isDark(theme.backgroundColor);
          document.body.style.backgroundColor = theme.backgroundColor;
          document.body.style.color = isBgDark ? 'white' : 'black';
        }

        // 🎨 Sidebar styling
        if (theme.navbarColor) {
          const isSidebarDark = isDark(theme.navbarColor);
          const sidebar = document.querySelector('.sidebar') as HTMLElement;
          if (sidebar) {
            sidebar.style.backgroundColor = theme.navbarColor;
            sidebar.style.color = isSidebarDark ? 'white' : 'black';

            sidebar.querySelectorAll('a, span, button, li').forEach((el) => {
              (el as HTMLElement).style.color = isSidebarDark ? 'white' : 'black';
            });

            // Ikoner (billeder) skal inverteres for at matche lyshed
            sidebar.querySelectorAll('img.icon').forEach((img) => {
              (img as HTMLElement).style.filter = isSidebarDark ? 'invert(1)' : 'invert(0)';
            });
          }
        }
      }
    } catch (err) {
      console.error('❌ Kunne ikke hente theme fra Firebase:', err);
    }
  }

  bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
});
