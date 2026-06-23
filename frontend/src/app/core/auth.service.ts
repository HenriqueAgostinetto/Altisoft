import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, tap } from 'rxjs';
import { AuthUser, Role } from './models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = 'http://localhost:8000/api';
  private readonly storageKey = 'altisoft_user';
  private readonly userSubject = new BehaviorSubject<AuthUser | null>(this.loadUser());
  readonly user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {}

  get currentUser(): AuthUser | null {
    return this.userSubject.value;
  }

  login(username: string, password: string, role: Role) {
    return this.http.post<AuthUser>(`${this.apiUrl}/auth/login`, { username, password, role }).pipe(
      tap((user) => {
        localStorage.setItem(this.storageKey, JSON.stringify(user));
        this.userSubject.next(user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
    this.userSubject.next(null);
  }

  hasRole(...roles: Role[]): boolean {
    const role = this.currentUser?.role;
    return !!role && roles.includes(role);
  }

  getToken(): string | null {
    return this.currentUser?.access_token ?? null;
  }

  private loadUser(): AuthUser | null {
    const raw = localStorage.getItem(this.storageKey);
    return raw ? JSON.parse(raw) as AuthUser : null;
  }
}
