import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Rydder localStorage hver gang HomeComponent indlæses
        localStorage.clear();
        console.log('🧹 Cleared localStorage on HomeComponent load');
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToSignup(): void {
    this.router.navigate(['/signup']);
  }

  goToAdmin(): void {
    this.router.navigate(['/admin-login']);
  }
}
