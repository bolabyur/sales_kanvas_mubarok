import { WebSocketGateway, WebSocketServer, OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection {
  @WebSocketServer() server!: Server;

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      // Ambil token dari query atau headers (dari Frontend)
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      
      if (!token) {
        console.warn(`⚠️ Client ${client.id} ditolak: Tidak ada token`);
        client.disconnect();
        return;
      }

      // Verifikasi Token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      const userId = payload.sub; 
      client.join(`user:${userId}`);
      console.log(`🔌 User ${userId} terautentikasi & connected (socket: ${client.id})`);
      
    } catch (error) {
      console.warn(`⚠️ Client ${client.id} ditolak: Token tidak valid`);
      client.disconnect();
    }
  }
}