//martin 25-03-2025
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
import { leaderboardComponent } from './leaderboard/leaderboard.component';
import { HomeComponent } from './home/home.component';
import { ChatComponent } from './chat/chat.component';

@NgModule({
  imports: [
    BrowserModule,
    CommonModule, 
    FormsModule,  
    RouterModule,  
    AppComponent,  
    SignupComponent,
    LoginComponent,
    AdminDashboardComponent, 
    NavbarComponent,
    GamesComponent,
    leaderboardComponent,
    HomeComponent,
    ChatComponent,
  ],
  providers: [],
})
export class AppModule { }

bootstrapApplication(AppComponent);
//martin 25-03-2025
