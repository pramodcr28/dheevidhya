import { inject, Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import { BehaviorSubject } from 'rxjs';
import SockJS from 'sockjs-client/dist/sockjs.js';
import { environment } from '../../../environments/environment';
import { ApplicationConfigService } from './application-config.service';

@Injectable({
    providedIn: 'root'
})
export class WebSocketService {
    private client: Client;
    private messageSubject = new BehaviorSubject<string>('');
    protected readonly applicationConfigService = inject(ApplicationConfigService);
    private baseUrl = window.location.origin + '/';
    protected resourceUrl = this.applicationConfigService.getEndpointFor(this.baseUrl + environment.NOTIFICATION_BASE_URL + 'ws-notifications');

    constructor() {
        this.initializeWebSocketConnection();
    }

    private initializeWebSocketConnection() {
        this.client = new Client({
            webSocketFactory: () => new SockJS(this.resourceUrl),
            onConnect: () => {
                console.log('Connected to WebSocket');
                this.client.subscribe('/topic/notifications', (message) => {
                    this.messageSubject.next(message.body);
                });
            },
            onDisconnect: () => {
                console.log('Disconnected from WebSocket');
            },
            onStompError: (frame) => {
                console.error('STOMP error:', frame);
            }
        });

        this.client.activate();
    }

    getMessages() {
        return this.messageSubject.asObservable();
    }

    sendMessage(destination: string, message: any) {
        if (this.client.connected) {
            this.client.publish({
                destination: destination,
                body: JSON.stringify(message)
            });
        }
    }

    disconnect() {
        if (this.client) {
            this.client.deactivate();
        }
    }
}
