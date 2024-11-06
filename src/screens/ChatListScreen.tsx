import * as React from "react";
import { useState, useEffect } from "react";
import { StyleSheet } from "react-nativescript";
import { ChatService } from "../services/ChatService";
import { AuthService } from "../services/AuthService";
import { ProductService } from "../services/ProductService";
import { Chat, Product, User } from "../types";

export function ChatListScreen({ navigation }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [chatDetails, setChatDetails] = useState<{
    [chatId: string]: {
      product: Product;
      otherUser: User;
    };
  }>({});

  const chatService = ChatService.getInstance();
  const authService = AuthService.getInstance();
  const productService = ProductService.getInstance();

  useEffect(() => {
    const userSubscription = authService.getCurrentUser().subscribe({
      next: (user) => {
        if (user) {
          setCurrentUser(user);
          subscribeToChats(user.id);
        }
      },
      error: console.error
    });

    return () => userSubscription.unsubscribe();
  }, []);

  const subscribeToChats = (userId: string) => {
    const chatSubscription = chatService.getUserChats(userId).subscribe({
      next: async (newChats) => {
        setChats(newChats);
        await loadChatDetails(newChats);
        setLoading(false);
      },
      error: (error) => {
        console.error(error);
        setLoading(false);
      }
    });

    return () => chatSubscription.unsubscribe();
  };

  const loadChatDetails = async (chats: Chat[]) => {
    const details: typeof chatDetails = {};

    for (const chat of chats) {
      try {
        const product = await productService.getProductById(chat.productId);
        if (!product) continue;

        const otherUserId = chat.buyerId === currentUser?.id ? chat.sellerId : chat.buyerId;
        const userDoc = await firebase.firestore()
          .collection('users')
          .doc(otherUserId)
          .get();
        
        if (!userDoc.exists) continue;

        details[chat.id] = {
          product,
          otherUser: userDoc.data() as User
        };
      } catch (error) {
        console.error(`Error loading details for chat ${chat.id}:`, error);
      }
    }

    setChatDetails(details);
  };

  if (loading) {
    return <activityIndicator busy={true} />;
  }

  return (
    <scrollView style={styles.container}>
      <stackLayout>
        {chats.map((chat) => {
          const details = chatDetails[chat.id];
          if (!details) return null;

          return (
            <gridLayout
              key={chat.id}
              columns="auto, *, auto"
              style={styles.chatItem}
              onTap={() => navigation.navigate('Chat', {
                productId: chat.productId,
                sellerId: chat.sellerId
              })}
            >
              <image
                col={0}
                src={details.product.images[0]}
                style={styles.productImage}
              />
              <stackLayout col={1} style={styles.chatInfo}>
                <label style={styles.productName}>
                  {details.product.name}
                </label>
                <label style={styles.userName}>
                  {details.otherUser.name}
                </label>
              </stackLayout>
              <stackLayout col={2} style={styles.priceInfo}>
                <label style={styles.price}>
                  ${details.product.price}
                </label>
              </stackLayout>
            </gridLayout>
          );
        })}
      </stackLayout>
    </scrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ECE5DD",
  },
  chatItem: {
    backgroundColor: "white",
    padding: 12,
    margin: 8,
    borderRadius: 8,
    elevation: 2,
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 4,
    marginRight: 12,
  },
  chatInfo: {
    justifyContent: "center",
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#075E54",
  },
  userName: {
    fontSize: 14,
    color: "#4A4A4A",
    marginTop: 4,
  },
  priceInfo: {
    justifyContent: "center",
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#128C7E",
  },
});