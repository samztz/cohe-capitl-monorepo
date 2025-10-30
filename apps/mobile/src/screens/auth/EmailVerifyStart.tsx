/**
 * Email Verification - Step 1: Enter Email
 * Matches design: docs/designs/邮箱验证1.png
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'EmailVerifyStart'>;

// Mock data
const MOCK_EMAIL = 'cohecapitl@gmail.com';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmailVerifyStart({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Validate email format
  const isEmailValid = EMAIL_REGEX.test(email);
  const isButtonEnabled = email.length > 0 && isEmailValid && !isSending;

  const handleSendCode = async () => {
    if (!isEmailValid) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    try {
      setIsSending(true);

      // Mock API call - simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Show success toast
      Alert.alert(
        'Code Sent',
        `Verification code sent to ${email}`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to code entry screen
              navigation.navigate('EmailVerifyCode', { email });
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send verification code');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F111A" />

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Email Verification</Text>
          <Text style={styles.subtitle}>
            Enter your email address to receive a verification code
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={[
                styles.input,
                !isEmailValid && email.length > 0 && styles.inputError,
              ]}
              placeholder="Enter your email"
              placeholderTextColor="#6B7280"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSending}
            />
            {!isEmailValid && email.length > 0 && (
              <Text style={styles.errorText}>Please enter a valid email</Text>
            )}
          </View>

          {/* Mock hint */}
          <View style={styles.hintContainer}>
            <Text style={styles.hintText}>
              Mock: Try "{MOCK_EMAIL}"
            </Text>
          </View>

          {/* Send Button */}
          <TouchableOpacity
            style={[
              styles.sendButton,
              !isButtonEnabled && styles.sendButtonDisabled,
            ]}
            onPress={handleSendCode}
            disabled={!isButtonEnabled}
            activeOpacity={0.8}
          >
            <Text style={styles.sendButtonText}>
              {isSending ? 'Sending...' : 'Send Code'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F111A',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    marginTop: 48,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#9CA3AF',
    lineHeight: 22,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    marginTop: 6,
  },
  hintContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 32,
  },
  hintText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  sendButton: {
    backgroundColor: '#FFD54F',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD54F',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  sendButtonDisabled: {
    backgroundColor: '#374151',
    shadowOpacity: 0,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F111A',
  },
});
