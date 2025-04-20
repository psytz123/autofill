import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Button from "../components/Button";
import Card from "../components/Card";
import { auth } from "../utils/api";
import { LoginScreenProps } from "../types/navigation";

const LoginScreen: React.FC<Partial<LoginScreenProps>> = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Please enter both email and password");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const user = await auth.login(username, password);
      console.log("Login successful:", user);
      navigation?.navigate("Home");
    } catch (err) {
      console.error("Login error:", err);
      setError("Invalid login credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            {/* App logo would go here */}
            <Text style={styles.title}>AutoFill</Text>
            <Text style={styles.subtitle}>Mobile Fuel Delivery</Text>
          </View>

          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="email@example.com"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                testID="login-email"
                editable={!loading}
              />

              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
                testID="login-password"
                editable={!loading}
              />

              {error && <Text style={styles.errorText}>{error}</Text>}

              <Button
                title="Log In"
                loading={loading}
                disabled={loading}
                onPress={handleLogin}
                style={styles.loginButton}
              />

              <TouchableOpacity style={styles.forgotPasswordLink}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>

          <View style={styles.registerSection}>
            <Text style={styles.registerText}>Don't have an account?</Text>
            <TouchableOpacity>
              <Text style={styles.registerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    padding: 20,
    flex: 1,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#f97316",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: "#64748b",
    textAlign: "center",
    marginTop: 8,
  },
  card: {
    marginVertical: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    color: "#1e293b",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
    fontSize: 16,
  },
  loginButton: {
    marginTop: 10,
  },
  errorText: {
    color: "#ef4444",
    marginBottom: 16,
    fontSize: 14,
  },
  forgotPasswordLink: {
    alignItems: "center",
    marginTop: 16,
    padding: 8,
  },
  forgotPasswordText: {
    color: "#64748b",
    fontSize: 14,
  },
  registerSection: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
    gap: 4,
  },
  registerText: {
    color: "#64748b",
    fontSize: 14,
  },
  registerLink: {
    color: "#f97316",
    fontWeight: "600",
    fontSize: 14,
  },
});

export default LoginScreen;
