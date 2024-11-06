import * as React from "react";
import { useState, useEffect } from "react";
import { StyleSheet } from "react-nativescript";
import { ProductService } from "../services/ProductService";
import { Product, Review } from "../types";

export function ProductDetailScreen({ route, navigation }) {
  const { productId } = route.params;
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const productService = ProductService.getInstance();

  useEffect(() => {
    loadProductData();
  }, [productId]);

  const loadProductData = async () => {
    try {
      const productData = await productService.getProductById(productId);
      if (productData) {
        setProduct(productData);
        const reviewsData = await productService.getProductReviews(productId);
        setReviews(reviewsData);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChat = () => {
    if (product) {
      navigation.navigate('Chat', {
        productId: product.id,
        sellerId: product.sellerId
      });
    }
  };

  if (loading) {
    return <activityIndicator busy={true} />;
  }

  if (!product) {
    return (
      <stackLayout style={styles.container}>
        <label>Product not found</label>
      </stackLayout>
    );
  }

  return (
    <scrollView style={styles.container}>
      <stackLayout>
        {/* Product Images Carousel */}
        <scrollView orientation="horizontal" style={styles.imageCarousel}>
          {product.images.map((image, index) => (
            <image
              key={index}
              src={image}
              style={styles.productImage}
            />
          ))}
        </scrollView>

        {/* Product Info */}
        <stackLayout style={styles.infoContainer}>
          <label style={styles.name}>{product.name}</label>
          <label style={styles.price}>${product.price}</label>
          <label style={styles.rating}>★ {product.rating.toFixed(1)}</label>
          <label style={styles.description}>{product.description}</label>

          {/* Action Buttons */}
          <gridLayout columns="*, *" style={styles.actionButtons}>
            <button
              col={0}
              className="primary-button"
              onTap={handleChat}
            >
              Chat with Seller
            </button>
            <button
              col={1}
              className="secondary-button"
              onTap={() => {/* Handle CQP */}}
            >
              Make Offer (CQP)
            </button>
          </gridLayout>

          {/* Reviews */}
          <label style={styles.reviewsTitle}>Reviews</label>
          {reviews.map((review) => (
            <stackLayout key={review.id} style={styles.reviewCard}>
              <label style={styles.reviewRating}>★ {review.rating}</label>
              <label style={styles.reviewComment}>{review.comment}</label>
              <label style={styles.reviewDate}>
                {new Date(review.createdAt).toLocaleDateString()}
              </label>
            </stackLayout>
          ))}
        </stackLayout>
      </stackLayout>
    </scrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ECE5DD",
  },
  imageCarousel: {
    height: 300,
  },
  productImage: {
    height: 300,
    width: 300,
  },
  infoContainer: {
    padding: 16,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#075E54",
  },
  price: {
    fontSize: 20,
    color: "#128C7E",
    marginTop: 8,
  },
  rating: {
    fontSize: 18,
    color: "#FFD700",
    marginTop: 4,
  },
  description: {
    fontSize: 16,
    color: "#4A4A4A",
    marginTop: 12,
  },
  actionButtons: {
    marginTop: 16,
    marginBottom: 16,
  },
  reviewsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  reviewCard: {
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  reviewRating: {
    fontSize: 16,
    color: "#FFD700",
  },
  reviewComment: {
    fontSize: 14,
    color: "#4A4A4A",
    marginTop: 4,
  },
  reviewDate: {
    fontSize: 12,
    color: "#6C757D",
    marginTop: 4,
  },
});