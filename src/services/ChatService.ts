import { Observable } from 'rxjs';
import { firebase } from '@nativescript/firebase-core';
import { Chat, Message } from '../types';

export class ChatService {
  private static instance: ChatService;
  private db: firebase.firestore.Firestore;

  private constructor() {
    this.db = firebase.firestore();
  }

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  async createChat(buyerId: string, sellerId: string, productId: string): Promise<Chat> {
    try {
      // Check if chat already exists
      const existingChat = await this.getChatByParticipants(buyerId, sellerId, productId);
      if (existingChat) return existingChat;

      const chatData: Omit<Chat, 'id'> = {
        buyerId,
        sellerId,
        productId,
        messages: [],
        createdAt: new Date()
      };

      const chatRef = await this.db.collection('chats').add(chatData);
      return {
        id: chatRef.id,
        ...chatData
      } as Chat;
    } catch (error) {
      throw new Error(`Failed to create chat: ${error.message}`);
    }
  }

  private async getChatByParticipants(
    buyerId: string,
    sellerId: string,
    productId: string
  ): Promise<Chat | null> {
    try {
      const snapshot = await this.db.collection('chats')
        .where('buyerId', '==', buyerId)
        .where('sellerId', '==', sellerId)
        .where('productId', '==', productId)
        .get();

      if (snapshot.empty) return null;
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Chat;
    } catch (error) {
      throw new Error(`Failed to get chat: ${error.message}`);
    }
  }

  getUserChats(userId: string): Observable<Chat[]> {
    return new Observable(subscriber => {
      const unsubscribe = this.db.collection('chats')
        .where(firebase.firestore.Filter.or(
          firebase.firestore.Filter.where('buyerId', '==', userId),
          firebase.firestore.Filter.where('sellerId', '==', userId)
        ))
        .orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
          const chats = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Chat[];
          subscriber.next(chats);
        }, error => {
          subscriber.error(error);
        });

      return () => unsubscribe();
    });
  }

  getChatMessages(chatId: string): Observable<Message[]> {
    return new Observable(subscriber => {
      const unsubscribe = this.db.collection('chats')
        .doc(chatId)
        .collection('messages')
        .orderBy('createdAt', 'asc')
        .onSnapshot(snapshot => {
          const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Message[];
          subscriber.next(messages);
        }, error => {
          subscriber.error(error);
        });

      return () => unsubscribe();
    });
  }

  async sendMessage(chatId: string, message: Omit<Message, 'id' | 'createdAt'>): Promise<void> {
    try {
      const messageData = {
        ...message,
        createdAt: new Date()
      };

      await this.db.collection('chats')
        .doc(chatId)
        .collection('messages')
        .add(messageData);

      // Update chat's last message timestamp
      await this.db.collection('chats')
        .doc(chatId)
        .update({
          lastMessageAt: new Date()
        });
    } catch (error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  async sendOffer(chatId: string, senderId: string, amount: number): Promise<void> {
    const offerMessage: Omit<Message, 'id' | 'createdAt'> = {
      senderId,
      type: 'offer',
      content: amount.toString()
    };

    await this.sendMessage(chatId, offerMessage);
  }

  async markChatAsRead(chatId: string, userId: string): Promise<void> {
    try {
      await this.db.collection('chats')
        .doc(chatId)
        .update({
          [`readBy.${userId}`]: new Date()
        });
    } catch (error) {
      throw new Error(`Failed to mark chat as read: ${error.message}`);
    }
  }
}