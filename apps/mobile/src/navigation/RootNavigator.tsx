/**
 * Root Navigator
 * Main navigation stack for the app
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { colors } from '../theme';

// Import screens
import ConnectScreen from '../screens/auth/ConnectScreen';
import EmailVerifyStart from '../screens/auth/EmailVerifyStart';
import EmailVerifyCode from '../screens/auth/EmailVerifyCode';
import ProductsScreen from '../screens/policy/ProductsScreen';
import PolicyDetailScreen from '../screens/policy/PolicyDetailScreen';
import PurchaseSuccessScreen from '../screens/policy/PurchaseSuccessScreen';
import PolicyFormScreen from '../screens/policy/PolicyFormScreen';
import ContractSignScreen from '../screens/policy/ContractSignScreen';
import PayScreen from '../screens/payment/PayScreen';
import TicketScreen from '../screens/policy/TicketScreen';
import PolicyStatusScreen from '../screens/policy/PolicyStatusScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="EmailVerifyStart"
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.primary,
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerBackVisible: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen
          name="Connect"
          component={ConnectScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="EmailVerifyStart"
          component={EmailVerifyStart}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="EmailVerifyCode"
          component={EmailVerifyCode}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Products"
          component={ProductsScreen}
          options={{ title: 'Insurance Products' }}
        />
        <Stack.Screen
          name="PolicyDetail"
          component={PolicyDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PurchaseSuccess"
          component={PurchaseSuccessScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PolicyForm"
          component={PolicyFormScreen}
          options={{ title: 'Policy Details' }}
        />
        <Stack.Screen
          name="ContractSign"
          component={ContractSignScreen}
          options={{ title: 'Sign Contract' }}
        />
        <Stack.Screen
          name="Pay"
          component={PayScreen}
          options={{ title: 'Payment' }}
        />
        <Stack.Screen
          name="Ticket"
          component={TicketScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PolicyStatus"
          component={PolicyStatusScreen}
          options={{ title: 'Policy Status' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
