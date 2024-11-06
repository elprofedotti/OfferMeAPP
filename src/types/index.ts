export interface User {
  id: string;
  type: 'buyer' | 'seller';
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  language: 'es' | 'en' | 'zh';
  createdAt: Date;
}

export interface Product {
  id: string;
  sellerId: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  images: string[];
  rating: number;
  reviews: Review[];
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  isSponsored: boolean;
  createdAt: Date;
}

export type ProductCategory =
  | 'real_estate'
  | 'logistics'
  | 'clothing'
  | 'electronics'
  | 'home'
  | 'services'
  | 'vehicles'
  | 'other';

export interface Review {
  id: string;
  userId: string;
  rating: number;
  comment: string;
  images?: string[];
  createdAt: Date;
}

export interface Chat {
  id: string;
  buyerId: string;
  sellerId: string;
  productId: string;
  messages: Message[];
  createdAt: Date;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'offer';
  createdAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  features: string[];
  startDate: Date;
  endDate: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'offer' | 'chat' | 'review' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}