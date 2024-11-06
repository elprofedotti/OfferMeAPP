import { Observable } from 'rxjs';
import { firebase } from '@nativescript/firebase-core';
import '@nativescript/firebase-storage';
import { Product, ProductCategory } from '../types';

export class ProductService {
  private static instance: ProductService;
  private db: firebase.firestore.Firestore;
  private storage: firebase.storage.Storage;

  private constructor() {
    this.db = firebase.firestore();
    this.storage = firebase.storage();
  }

  static getInstance(): ProductService {
    if (!ProductService.instance) {
      ProductService.instance = new ProductService();
    }
    return ProductService.instance;
  }

  async createProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    try {
      const productRef = await this.db.collection('products').add({
        ...product,
        createdAt: new Date(),
      });

      return {
        id: productRef.id,
        ...product,
        createdAt: new Date(),
      } as Product;
    } catch (error) {
      throw new Error(`Failed to create product: ${error.message}`);
    }
  }

  async uploadProductImage(productId: string, imageUri: string): Promise<string> {
    try {
      const imagePath = `products/${productId}/${Date.now()}.jpg`;
      const reference = this.storage.ref(imagePath);
      await reference.putFile(imageUri);
      return await reference.getDownloadURL();
    } catch (error) {
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }

  getProducts(filters?: {
    category?: ProductCategory;
    sellerId?: string;
    minPrice?: number;
    maxPrice?: number;
    location?: {
      latitude: number;
      longitude: number;
      radius: number; // in kilometers
    };
  }): Observable<Product[]> {
    return new Observable(subscriber => {
      let query: firebase.firestore.Query = this.db.collection('products');

      if (filters) {
        if (filters.category) {
          query = query.where('category', '==', filters.category);
        }
        if (filters.sellerId) {
          query = query.where('sellerId', '==', filters.sellerId);
        }
        if (filters.minPrice !== undefined) {
          query = query.where('price', '>=', filters.minPrice);
        }
        if (filters.maxPrice !== undefined) {
          query = query.where('price', '<=', filters.maxPrice);
        }
        // Location filtering will be done in memory due to Firestore limitations
      }

      const unsubscribe = query
        .orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
          let products = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Product[];

          if (filters?.location) {
            products = this.filterByDistance(
              products,
              filters.location.latitude,
              filters.location.longitude,
              filters.location.radius
            );
          }

          subscriber.next(products);
        }, error => {
          subscriber.error(error);
        });

      return () => unsubscribe();
    });
  }

  private filterByDistance(
    products: Product[],
    lat: number,
    lon: number,
    radius: number
  ): Product[] {
    return products.filter(product => {
      const distance = this.calculateDistance(
        lat,
        lon,
        product.location.latitude,
        product.location.longitude
      );
      return distance <= radius;
    });
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  async getProductById(id: string): Promise<Product | null> {
    try {
      const doc = await this.db.collection('products').doc(id).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() } as Product;
    } catch (error) {
      throw new Error(`Failed to get product: ${error.message}`);
    }
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<void> {
    try {
      await this.db.collection('products').doc(id).update(data);
    } catch (error) {
      throw new Error(`Failed to update product: ${error.message}`);
    }
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      await this.db.collection('products').doc(id).delete();
    } catch (error) {
      throw new Error(`Failed to delete product: ${error.message}`);
    }
  }

  async addReview(productId: string, review: Omit<Review, 'id' | 'createdAt'>): Promise<void> {
    try {
      const reviewData = {
        ...review,
        createdAt: new Date(),
      };
      
      await this.db.collection('products')
        .doc(productId)
        .collection('reviews')
        .add(reviewData);

      // Update product rating
      const product = await this.getProductById(productId);
      if (product) {
        const reviews = await this.getProductReviews(productId);
        const newRating = reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length;
        await this.updateProduct(productId, { rating: newRating });
      }
    } catch (error) {
      throw new Error(`Failed to add review: ${error.message}`);
    }
  }

  async getProductReviews(productId: string): Promise<Review[]> {
    try {
      const snapshot = await this.db.collection('products')
        .doc(productId)
        .collection('reviews')
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];
    } catch (error) {
      throw new Error(`Failed to get reviews: ${error.message}`);
    }
  }
}