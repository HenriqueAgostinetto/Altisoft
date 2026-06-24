// Henrique Agostinetto Piva
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private socket?: WebSocket;
  private readonly messagesSubject = new BehaviorSubject<string[]>([]);
  readonly messages$ = this.messagesSubject.asObservable();

  connect(): void {
    if (this.socket && this.socket.readyState <= WebSocket.OPEN) return;
    this.socket = new WebSocket('ws://127.0.0.1:8000/ws/notificacoes');
    this.socket.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      this.messagesSubject.next([payload.message, ...this.messagesSubject.value].slice(0, 4));
    };
  }

  dismiss(index: number): void {
    const messages = [...this.messagesSubject.value];
    messages.splice(index, 1);
    this.messagesSubject.next(messages);
  }
}
