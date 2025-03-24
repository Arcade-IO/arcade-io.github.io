import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';  // Import CommonModule
import { FormsModule } from '@angular/forms'; // Import FormsModule for ngModel binding
import { RouterModule } from '@angular/router';  // Import RouterModule
import { AppComponent } from './app.component';  // Import standalone component
import { SignupComponent } from './signup/signup.component';  // Import standalone component
import { LoginComponent } from './login/login.component';  // Import standalone component
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';  // Import standalone component
import { bootstrapApplication } from '@angular/platform-browser';
import { NavbarComponent } from './navbar/navbar.component';
import { GamesComponent } from './games/games.component';
import { LeaderboardComponent } from './leaderboard/leaderboard.component';
import { HomeComponent } from './home/home.component';
import { ChatComponent } from './chat/chat.component';

@NgModule({
  imports: [
    BrowserModule,
    CommonModule,  // Add CommonModule here
    FormsModule,  
    RouterModule,  // Add RouterModule here
    AppComponent,  // Import standalone component
    SignupComponent,  // Import standalone component
    LoginComponent,  // Import standalone component
    AdminDashboardComponent,  // Import standalone component
    NavbarComponent,
    GamesComponent,
    LeaderboardComponent,
    HomeComponent,
    ChatComponent,
  ],
  providers: [],
})
export class AppModule { }

bootstrapApplication(AppComponent);
