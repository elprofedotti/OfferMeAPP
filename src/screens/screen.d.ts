// screen.d.ts
import React from 'react';
import { NavigationProp } from '@react-navigation/native'; 

interface ScreenProps {
  navigation: NavigationProp<any>; 
}

declare const Screen: React.FC<ScreenProps>;

export default Screen;