import * as React from "react";
import { useState } from "react";
import { StyleSheet } from "react-nativescript";
import { AuthService } from "../services/AuthService";
import ScreenProps from "./screen"; // Importa la interfaz ScreenProps

// Extiende la interfaz ScreenProps con las props específicas de AuthScreen
interface AuthScreenProps extends ScreenProps {
  navigation: NavigationProp<any>; // Usa NavigationProp aquí
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ navigation }) => {
  // ... tu código aquí
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);

  const authService = AuthService.getInstance();

  const handleAuth = async () => {
    try {
      if (isLogin) {
        await authService.login(email, password);
      } else {
        await authService.register(email, password, {
          type: 'buyer',
          name: '',
          language: 'en'
        });
      }
      navigation.replace('Home');
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <flexboxLayout style={styles.container}>
      <label className="text-2xl font-bold mb-8">OFFER ME</label>
      
      <textField
        style={styles.input}
        hint="Email"
        keyboardType="email"
        text={email}
        onTextChange={(args) => setEmail(args.value)}
      />
      
      <textField
        style={styles.input}
        hint="Password"
        secure={true}
        text={password}
        onTextChange={(args) => setPassword(args.value)}
      />
      
      <button
        className="primary-button"
        onTap={handleAuth}
      >
        {isLogin ? 'Login' : 'Register'}
      </button>
      
      <button
        style={styles.switchButton}
        onTap={() => setIsLogin(!isLogin)}
      >
        {isLogin ? 'Need an account? Register' : 'Have an account? Login'}
      </button>
    </flexboxLayout>
  );
}


const styles = StyleSheet.create({
  container: {
    height: "100%",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#ECE5DD",
  },
  input: {
    width: "80%",
    height: 40,
    borderWidth: 1,
    borderColor: "#128C7E",
    borderRadius: 8,
    padding: 8,
    margin: 8,
  },
  switchButton: {
    marginTop: 16,
    color: "#128C7E",
    fontSize: 16,
  },
});