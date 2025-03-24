import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { HomeComponent } from './home/home.component';  
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { AdminGuard } from './guards/admin.guard';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ChatComponent } from './chat/chat.component';
import { GamesComponent } from './games/games.component';
import { LeaderboardComponent } from './leaderboard/leaderboard.component';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from './navbar/navbar.component';
import { GameInterfaceComponent } from './game-interface/game-interface.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'admin-dashboard', component: AdminDashboardComponent, canActivate: [AdminGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard]},  // New route
  { path: 'chat', component: ChatComponent, canActivate: [AuthGuard]},  
  { path: 'games', component: GamesComponent, canActivate: [AdminGuard]},  
  { path: 'leaderboard', component: LeaderboardComponent, canActivate: [AuthGuard]},  
  { path: 'navbar', component: NavbarComponent, canActivate: [AuthGuard]},  
  { path: 'game/:gameId', component: GameInterfaceComponent }
];
//Add AdminGuard if you want the acces to be restricted so only Admins can acces 
//Add AuthGuard if you want the acces to be restricted so only Users can acces