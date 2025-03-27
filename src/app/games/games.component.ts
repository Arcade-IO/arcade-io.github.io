import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FirebaseService } from '../services/firebase.service';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-games',
  templateUrl: './games.component.html',
  styleUrls: ['./games.component.css'],
  imports: [CommonModule, ReactiveFormsModule],
})
export class GamesComponent implements OnInit {
  gameForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private firebaseService: FirebaseService
  ) {}

  ngOnInit(): void {
    this.gameForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      imageUrl: ['', Validators.required],
      netlifyUrl: ['', Validators.required],
      platform: ['', Validators.required],
    });
  }

  createNewGame(): void {
    if (this.gameForm.invalid) {
      return; // or show a warning message
    }

    const { title, description, imageUrl, netlifyUrl, platform } = this.gameForm.value;
    const gameId = 'game_' + Date.now();
    const currentUser = this.firebaseService.getCurrentUser();

    if (!currentUser || !currentUser.uid) {
      console.error('Ingen bruger logget ind');
      return;
    }

    const userId = currentUser.uid;
    this.firebaseService.createGame(
      gameId,
      title,
      description,
      imageUrl,
      netlifyUrl,
      platform,
      userId
    )
    .then(() => {
      console.log('Spillet er oprettet!');
      this.gameForm.reset();
    })
    .catch((error: any) => {
      console.error('Fejl ved oprettelse af spil:', error);
    });
  }
}
