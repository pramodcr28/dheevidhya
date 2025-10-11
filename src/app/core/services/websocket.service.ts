import { inject, Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs.js';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApplicationConfigService } from './application-config.service';

@Injectable({
    providedIn: 'root'
})
export class WebSocketService {
    private client: Client;
    private messageSubject = new BehaviorSubject<string>('');
    protected readonly applicationConfigService = inject(ApplicationConfigService);

    protected resourceUrl = this.applicationConfigService.getEndpointFor(environment.NOTIFICATION_BASE_URL + 'ws-notifications');

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
