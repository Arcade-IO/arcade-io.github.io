import { CommonModule } from '@angular/common';
import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FirebaseService } from '../services/firebase.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { get, ref } from 'firebase/database';
import { ChatComponent } from '../chat/chat.component';

@Component({
  selector: 'app-game-interface',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatComponent],
  templateUrl: './game-interface.component.html',
  styleUrls: ['./game-interface.component.css']
})
export class GameInterfaceComponent implements AfterViewInit, OnDestroy {
  /* ---------- Spildata ---------- */
  gameId: string = '';
  game: any = null;
  safeUrl: SafeResourceUrl | null = null;

  /* ---------- Unity-håndtering ---------- */
  private resendAttempts = 0;
  private maxAttempts = 3;
  private resendInterval: any;
  private unityAcknowledged = false;

  showChat: boolean = true;

  /* ---------- Admin-relateret ---------- */
  isAdmin: boolean = false;      // sættes efter login
  showEditor: boolean = false;   // styrer overlay-panelet
  editedGame: any = {};          // to-vej-binding til formularen

  constructor(
    private route: ActivatedRoute,
    private firebaseService: FirebaseService,
    private sanitizer: DomSanitizer
  ) {}

  /* ---------- Livscyklus ---------- */
  ngAfterViewInit() {
    this.gameId = this.route.snapshot.paramMap.get('gameId') || '';
    if (this.gameId) this.fetchGameDetails(this.gameId);
  
    const uid = localStorage.getItem('uid') || '';
    if (uid) {
      this.firebaseService.checkIfAdmin(uid).then(isAdm => (this.isAdmin = isAdm));
    }
  
    window.addEventListener('message', this.handleUnityMessages.bind(this));
    document.addEventListener('fullscreenchange', this.onFullscreenChange);
  
    setTimeout(() => {
      this.sendStoredDataToUnity();
      this.beginResendLoop();
      this.syncColumnHeights(); // 💡 her
    }, 3000);
  }
  
  get formattedDescription(): string {
    return this.game?.description?.replace(/\n/g, '<br>') || '';
  }
  
  ngOnDestroy() {
    clearInterval(this.resendInterval);
    window.removeEventListener('message', this.handleUnityMessages.bind(this));
    document.removeEventListener('fullscreenchange', this.onFullscreenChange);
  }
  private syncColumnHeights() {
    setTimeout(() => {
      const gameContainer = document.querySelector('.game-container') as HTMLElement;
      const description = document.querySelector('.game-description') as HTMLElement;
      const chat = document.querySelector('.chat') as HTMLElement;
  
      if (gameContainer && description) {
        const height = gameContainer.offsetHeight;
        description.style.height = height + 'px';
      }
  
      // Kun sæt chat-højde, hvis den eksisterer (dvs. showChat === true)
      if (gameContainer && chat) {
        const height = gameContainer.offsetHeight;
        chat.style.height = height + 'px';
      }
    }, 100); // brug et lille delay for at sikre rendering er færdig
  }
  
  /* ---------- Vis/skjul chat ---------- */
  toggleChat() {
    this.showChat = !this.showChat;
    if (this.showChat) {
      // Vent kort, så Angular kan render chat-komponenten først
      setTimeout(() => this.syncColumnHeights(), 100);
    }
  }
  

  /* ---------- Fuldskærm ---------- */
  isFullscreen: boolean = false;

  goFullscreen() {
    const iframe = document.getElementById('unityGame') as HTMLIFrameElement;
    if (!iframe) return;

    const requestFullscreen =
      iframe.requestFullscreen ||
      (iframe as any).webkitRequestFullscreen ||
      (iframe as any).mozRequestFullScreen ||
      (iframe as any).msRequestFullscreen;

    if (requestFullscreen) {
      requestFullscreen.call(iframe);
    } else {
      console.warn('Fuldskærm ikke understøttet');
    }
  }

  onFullscreenChange = () => {
    this.isFullscreen = !!document.fullscreenElement;
  };

  /* ---------- Resend-loop til Unity ---------- */
  private beginResendLoop() {
    this.resendInterval = setInterval(() => {
      if (this.unityAcknowledged || this.resendAttempts >= this.maxAttempts) {
        clearInterval(this.resendInterval);
        if (!this.unityAcknowledged)
          console.warn('⚠️ Unity never acknowledged player data after 3 attempts.');
        return;
      }
      this.resendAttempts++;
      console.log(`🔁 Attempt #${this.resendAttempts} to resend UID & playerName to Unity...`);
      this.sendStoredDataToUnity();
    }, 5000);
  }

  /* ---------- Send UID + navn til Unity ---------- */
  private sendStoredDataToUnity() {
    const uid = localStorage.getItem('uid');
    const playerName = localStorage.getItem('playerName');

    if (!uid || !playerName) {
      console.warn('No UID or Player Name found in localStorage');
      return;
    }

    const iframe = document.querySelector('iframe') as HTMLIFrameElement;
    iframe?.contentWindow?.postMessage({ type: 'SET_PLAYER_DATA', uid, name: playerName }, '*');
    console.log('📤 Sent UID & Player Name to Unity:', uid, playerName);
  }

  /* ---------- Unity-events ---------- */
  private handleUnityMessages(event: MessageEvent) {
    if (event.data === 'UNITY_ACK') {
      console.log('✅ Received UNITY_ACK from Unity');
      this.unityAcknowledged = true;
      return;
    }

    if (event.data?.type === 'UPDATE_HIGHSCORE') {
      console.log('🎯 Received high score data from Unity:', event.data.data);
      this.pushHighscoreToFirebase(event.data.data);
    }
  }

  /* ---------- Gem highscore ---------- */
  private async pushHighscoreToFirebase(highscoreData: { userId: string; score: number }) {
    const { userId, score } = highscoreData;
    const storedUid = localStorage.getItem('uid');
    if (!storedUid || storedUid !== userId) {
      console.error('❌ Invalid userId received from Unity:', userId);
      return;
    }

    const gameTitle = this.game?.title;
    const gameId = this.gameId;
    if (!gameTitle || !gameId) {
      console.error('❌ Missing game information – cannot save highscore.');
      return;
    }

    try {
      const userData = await this.firebaseService.getUserbyUID(userId);
      const playerName = userData.displayName || 'Ukendt Spiller';
      const email = userData.email || 'ukendt@email.dk';

      await this.firebaseService.submitHighscore(
        playerName,
        email,
        gameTitle,
        score,
        gameId
      );
      console.log('✅ Highscore saved to Firebase (automatic)');
    } catch (err) {
      console.error('❌ Error while saving highscore:', err);
    }
  }

  
  /* ---------- Hent spil-detaljer ---------- */
  async fetchGameDetails(gameId: string) {
    try {
      const database = this.firebaseService.getDatabase();
      const gameRef = ref(database, `games/${gameId}`);
      const snapshot = await get(gameRef);
  
      if (!snapshot.exists()) {
        console.error('⚠️ No game found with ID:', gameId);
        return;
      }
  
      this.game = snapshot.val();
      this.updateSafeUrl();
  
      // 🔥 Registrer ét view/spil
      await this.firebaseService.incrementPlays(gameId);
  
      console.log('✅ Game fetched:', this.game);
    } catch (error) {
      console.error('❌ Error fetching game:', error);
    }
  }
  

  /* ---------- Opdatér iframe-URL ---------- */
  private updateSafeUrl() {
    if (!this.game) return;
    const uid = localStorage.getItem('uid') || '';
    const playerName = localStorage.getItem('playerName') || '';
    const baseUrl = this.game.netlifyUrl;
    const urlWithParams =
      `${baseUrl}?uid=${encodeURIComponent(uid)}&name=${encodeURIComponent(playerName)}`;
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(urlWithParams);
    console.log('🔗 iframe URL:', urlWithParams);
  }

  /* ===================================================
     Admin-editor
     =================================================== */
  openEditor() {
    if (!this.game) return;
    this.editedGame = { ...this.game };   // kopi til formularen
    this.showEditor = true;
  }

saveEdits() {
  const { title, description, netlifyUrl, imageUrl } = this.editedGame;

  this.firebaseService
    .updateGame(this.gameId, { title, description, netlifyUrl, imageUrl })
    .then(() => {
      Object.assign(this.game, { title, description, netlifyUrl, imageUrl });
      this.updateSafeUrl();         // opdatér iframe hvis URL blev ændret
      this.showEditor = false;
      console.log('✅ Game changes saved');
    })
    .catch(err => console.error('❌ Kunne ikke gemme spil-redigering:', err));
}


  cancelEdits() {
    this.showEditor = false;
  }

    /* ===================================================
     🗑️  Ryd CacheStorage (kun admin-knap)
     =================================================== */
     public async clearUnityCacheStorage(prefix = 'UnityCache_'): Promise<void> {

      /* 0. Understøttelse */
      if (!('caches' in window)) {
        console.warn('CacheStorage er ikke understøttet i denne browser.');
        return;
      }
  
      /* 1. Alle cache-nøgler */
      const keys = await caches.keys();
  
      /* 2. Filtrér – ryd kun Unity-mapper eller alt, som du vil */
      const targets = keys.filter(k => k.startsWith(prefix));
  
      /* 3. Slet */
      await Promise.all(targets.map(k => caches.delete(k)));
      console.log(`🗑️  Slettede ${targets.length} CacheStorage-mapper`, targets);
  
      /* 4. (Valgfrit) afregistrér service-workers */
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
        console.log('⛔️  Afregistrerede service-workers');
      }
  
      /* 5. (Valgfrit) ryd IndexedDB “UnityCache” */
      if ('indexedDB' in window && (indexedDB as any).databases) {
        const dbs = await (indexedDB as any).databases();
        await Promise.all(
          dbs
            .filter((d: any) => d.name?.startsWith('UnityCache'))
            .map((d: any) => indexedDB.deleteDatabase(d.name))
        );
        console.log('🗑️  Slettede Unity IndexedDB-databaser');
      }
  
      /* 6. Genindlæs */
      location.reload();
    }
}
