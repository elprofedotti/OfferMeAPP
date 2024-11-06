import * as React from "react";
import { useState, useEffect } from "react";
import { StyleSheet } from "react-nativescript";
import { ProductService } from "../services/ProductService";
import { Product, ProductCategory } from "../types";

export function ProductListScreen({ navigation, route }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | undefined>();
  
  const productService = ProductService.getInstance();

  useEffect(() => {
    const subscription = productService
      .getProducts({ category: selectedCategory })
      .subscribe({
        next: (fetchedProducts) => {
          setProducts(fetchedProducts);
          setLoading(false);
        },
        error: (error) => {
          console.error(error);
          setLoading(false);
        }
      });

    return () => subscription.unsubscribe();
  }, [selectedCategory]);

  const categories: ProductCategory[] = [
    'real_estate',
    'logistics',
    'clothing',
    'electronics',
    'home',
    'services',
    'vehicles',
    'other'
  ];

  return (
    <gridLayout rows="auto, *" style={styles.container}>
      <scrollView orientation="horizontal" row={0} style={styles.categoryBar}>
        <stackLayout orientation="horizontal">
          {categories.map((category) => (
            <button
              key={category}
              className={`category-button ${selectedCategory === category ? 'selected' : ''}`}
              onTap={() => setSelectedCategory(category)}
            >
              {category.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </stackLayout>
      </scrollView>

      {loading ? (
        <activityIndicator busy={true} row={1} />
      ) : (
        <scrollView row={1}>
          <stackLayout>
            {products.map((product) => (
              <gridLayout
                key={product.id}
                style={styles.productCard}
                onTap={() => navigation.navigate('ProductDetail', { productId: product.id })}
              >
                <image
                  src={product.images[0]}
                  style={styles.productImage}
                />
                <stackLayout style={styles.productInfo}>
                  <label style={styles.productName}>{product.name}</label>
                  <label style={styles.productPrice}>${product.price}</label>
                  <label style={styles.productRating}>★ {product.rating.toFixed(1)}</label>
                </stackLayout>
              </gridLayout>
            ))}
          </stackLayout>
        </scrollView>
      )}
    </gridLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ECE5DD",
  },
  categoryBar: {
    backgroundColor: "#128C7E",
    padding: 8,
  },
  productCard: {
    margin: 8,
    backgroundColor: "white",
    borderRadius: 8,
    elevation: 2,
  },
  productImage: {
    height: 200,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#075E54",
  },
  productPrice: {
    fontSize: 14,
    color: "#128C7E",
    marginTop: 4,
  },
  productRating: {
    fontSize: 14,
    color: "#FFD700",
    marginTop: 4,
  },
});