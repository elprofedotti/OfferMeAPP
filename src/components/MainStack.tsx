import { BaseNavigationContainer } from '@react-navigation/core';
import * as React from "react";
import { stackNavigatorFactory } from "react-nativescript-navigation";
import { AuthScreen } from '../screens/AuthScreen';
// import { HomeScreen } from '../screens/HomeScreen';
import { ProductListScreen } from '../screens/ProductListScreen';
import { ProductDetailScreen } from '../screens/ProductDetailScreen';
import { ChatScreen } from '../screens/ChatScreen';
// import { ProfileScreen } from '../screens/ProfileScreen';
// import { SettingsScreen } from '../screens/SettingsScreen';


const StackNavigator = stackNavigatorFactory();

export const MainStack = () => {
  return (
    <BaseNavigationContainer>
      <StackNavigator.Navigator
        initialRouteName="Auth"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#128C7E',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <StackNavigator.Screen
          name="Auth"
          component={AuthScreen}
          options={{ headerShown: false }}
        />
        <StackNavigator.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'OFFER ME' }}
        />
        <StackNavigator.Screen
          name="ProductList"
          component={ProductListScreen}
          options={{ title: 'Products' }}
        />
        <StackNavigator.Screen
          name="ProductDetail"
          component={ProductDetailScreen}
          options={{ title: 'Product Details' }}
        />
        <StackNavigator.Screen
          name="Chat"
          component={ChatScreen}
          options={{ title: 'Chat' }}
        />
        <StackNavigator.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: 'Profile' }}
        />
        <StackNavigator.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: 'Settings' }}
        />
      </StackNavigator.Navigator>
    </BaseNavigationContainer>
  );
};