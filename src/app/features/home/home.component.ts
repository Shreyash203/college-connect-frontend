import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CurrentUserService } from '../../core/services/current-user.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './home.component.html',
  styles: []
})
export class HomeComponent {
  public currentUser = inject(CurrentUserService);
}


