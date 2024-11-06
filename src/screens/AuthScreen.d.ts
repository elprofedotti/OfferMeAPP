// AuthScreen.d.ts
import React from 'react';
import { NavigationProp } from '@react-navigation/native'; 

interface AuthScreenProps {
  navigation: NavigationProp<any>; 
}

declare const AuthScreen: React.FC<AuthScreenProps>;

export default AuthScreen;