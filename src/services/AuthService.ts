import { User } from '../types';
import { Observable } from 'rxjs';
import { firebase } from '@nativescript/firebase-core';
import '@nativescript/firebase-auth';

export class AuthService {
  private static instance: AuthService;
  private auth: firebase.Auth;

  private constructor() {
    this.auth = firebase.auth();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async register(email: string, password: string, userData: Partial<User>): Promise<User> {
    try {
      const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
      const user: User = {
        id: userCredential.user.uid,
        email,
        ...userData,
        createdAt: new Date(),
      } as User;
      
      // Store additional user data in Firestore
      await firebase.firestore()
        .collection('users')
        .doc(user.id)
        .set(user);

      return user;
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  async login(email: string, password: string): Promise<User> {
    try {
      const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
      const userDoc = await firebase.firestore()
        .collection('users')
        .doc(userCredential.user.uid)
        .get();

      return userDoc.data() as User;
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  async logout(): Promise<void> {
    try {
      await this.auth.signOut();
    } catch (error) {
      throw new Error(`Logout failed: ${error.message}`);
    }
  }

  getCurrentUser(): Observable<User | null> {
    return new Observable(subscriber => {
      return this.auth.onAuthStateChanged(async firebaseUser => {
        if (firebaseUser) {
          const userDoc = await firebase.firestore()
            .collection('users')
            .doc(firebaseUser.uid)
            .get();
          subscriber.next(userDoc.data() as User);
        } else {
          subscriber.next(null);
        }
      });
    });
  }

  async updateProfile(userId: string, data: Partial<User>): Promise<void> {
    try {
      await firebase.firestore()
        .collection('users')
        .doc(userId)
        .update(data);
    } catch (error) {
      throw new Error(`Profile update failed: ${error.message}`);
    }
  }
}