import { ComponentFixture, TestBed } from '@angular/core/testing';

import { leaderboardComponent } from './leaderboard.component';

describe('LeaderboardComponent', () => {
  let component: leaderboardComponent;
  let fixture: ComponentFixture<leaderboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [leaderboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(leaderboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
