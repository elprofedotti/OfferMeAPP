import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { StyleSheet } from "react-nativescript";
import { ChatService } from "../services/ChatService";
import { AuthService } from "../services/AuthService";
import { ProductService } from "../services/ProductService";
import { Chat, Message, Product, User } from "../types";

export function ChatScreen({ route, navigation }) {
  const { productId, sellerId } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chat, setChat] = useState<Chat | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const chatService = ChatService.getInstance();
  const authService = AuthService.getInstance();
  const productService = ProductService.getInstance();
  
  const scrollView = useRef<any>(null);

  useEffect(() => {
    initializeChat();
  }, []);

  const initializeChat = async () => {
    try {
      const user = await new Promise<User>((resolve, reject) => {
        const subscription = authService.getCurrentUser().subscribe({
          next: (user) => {
            if (user) {
              resolve(user);
              subscription.unsubscribe();
            }
          },
          error: reject
        });
      });

      setCurrentUser(user);

      const newChat = await chatService.createChat(user.id, sellerId, productId);
      setChat(newChat);

      // Load product details
      const productData = await productService.getProductById(productId);
      setProduct(productData);

      // Subscribe to messages
      const messageSubscription = chatService
        .getChatMessages(newChat.id)
        .subscribe(newMessages => {
          setMessages(newMessages);
          scrollToBottom();
        });

      return () => messageSubscription.unsubscribe();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    if (scrollView.current) {
      scrollView.current.scrollToVerticalOffset(
        scrollView.current.scrollableHeight,
        false
      );
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chat || !currentUser) return;

    try {
      await chatService.sendMessage(chat.id, {
        senderId: currentUser.id,
        content: newMessage.trim(),
        type: 'text'
      });
      setNewMessage("");
    } catch (error) {
      console.error(error);
    }
  };

  const handleMakeOffer = async () => {
    if (!chat || !currentUser || !product) return;

    const offerDialog = await prompt(
      "Make an offer",
      "Enter your offer amount:",
      product.price.toString()
    );

    if (offerDialog.result) {
      const amount = parseFloat(offerDialog.text);
      if (!isNaN(amount) && amount > 0) {
        try {
          await chatService.sendOffer(chat.id, currentUser.id, amount);
        } catch (error) {
          console.error(error);
        }
      }
    }
  };

  if (loading) {
    return <activityIndicator busy={true} />;
  }

  return (
    <gridLayout rows="auto, *, auto" style={styles.container}>
      {/* Product Info */}
      {product && (
        <gridLayout columns="auto, *" row={0} style={styles.productInfo}>
          <image
            col={0}
            src={product.images[0]}
            style={styles.productImage}
          />
          <stackLayout col={1} style={styles.productDetails}>
            <label style={styles.productName}>{product.name}</label>
            <label style={styles.productPrice}>${product.price}</label>
          </stackLayout>
        </gridLayout>
      )}

      {/* Messages */}
      <scrollView ref={scrollView} row={1} style={styles.messagesContainer}>
        <stackLayout>
          {messages.map((message, index) => (
            <gridLayout
              key={message.id}
              style={[
                styles.messageWrapper,
                message.senderId === currentUser?.id
                  ? styles.sentMessage
                  : styles.receivedMessage
              ]}
            >
              {message.type === 'offer' ? (
                <stackLayout style={styles.offerMessage}>
                  <label style={styles.offerLabel}>Offer</label>
                  <label style={styles.offerAmount}>
                    ${parseFloat(message.content).toFixed(2)}
                  </label>
                </stackLayout>
              ) : (
                <label
                  style={[
                    styles.message,
                    message.senderId === currentUser?.id
                      ? styles.sentMessageText
                      : styles.receivedMessageText
                  ]}
                >
                  {message.content}
                </label>
              )}
            </gridLayout>
          ))}
        </stackLayout>
      </scrollView>

      {/* Input Area */}
      <gridLayout
        row={2}
        columns="*, auto, auto"
        style={styles.inputContainer}
      >
        <textField
          col={0}
          style={styles.input}
          hint="Type a message..."
          text={newMessage}
          onTextChange={(args) => setNewMessage(args.value)}
          returnKeyType="send"
          onReturnPress={handleSendMessage}
        />
        <button
          col={1}
          className="primary-button"
          style={styles.sendButton}
          onTap={handleSendMessage}
        >
          Send
        </button>
        <button
          col={2}
          className="secondary-button"
          style={styles.offerButton}
          onTap={handleMakeOffer}
        >
          CQP
        </button>
      </gridLayout>
    </gridLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ECE5DD",
  },
  productInfo: {
    backgroundColor: "white",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#128C7E",
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 4,
    margin: 4,
  },
  productDetails: {
    padding: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#075E54",
  },
  productPrice: {
    fontSize: 14,
    color: "#128C7E",
  },
  messagesContainer: {
    padding: 8,
  },
  messageWrapper: {
    marginVertical: 4,
  },
  message: {
    padding: 8,
    borderRadius: 8,
    maxWidth: "80%",
  },
  sentMessage: {
    horizontalAlignment: "right",
  },
  receivedMessage: {
    horizontalAlignment: "left",
  },
  sentMessageText: {
    backgroundColor: "#DCF8C6",
    color: "#000000",
  },
  receivedMessageText: {
    backgroundColor: "white",
    color: "#000000",
  },
  offerMessage: {
    backgroundColor: "#FFE4B5",
    padding: 8,
    borderRadius: 8,
    maxWidth: "80%",
  },
  offerLabel: {
    fontSize: 12,
    color: "#666666",
  },
  offerAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
  },
  inputContainer: {
    padding: 8,
    backgroundColor: "white",
  },
  input: {
    backgroundColor: "#FFFFFF",
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#128C7E",
  },
  sendButton: {
    marginLeft: 8,
    borderRadius: 20,
  },
  offerButton: {
    marginLeft: 8,
    borderRadius: 20,
  },
});