import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import AuthScreen from './src/screens/AuthScreen';
import TabNavigator from './src/navigation/TabNavigator';
import SkillHistoryScreen from './src/screens/SkillHistoryScreen';
import AsapTasksScreen from './src/screens/AsapTasksScreen';
import OnlineTasksScreen from './src/screens/OnlineTasksScreen';
import OfflineTasksScreen from './src/screens/OfflineTasksScreen';
import TaskDetailsScreen from './src/screens/TaskDetailsScreen';
import ReviewApplicantsScreen from './src/screens/ReviewApplicantsScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';

const Stack = createNativeStackNavigator();

const AppContent = () => {
    const { session, isOnboarded, loading } = useAuth();

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4F46E5" />
            </View>
        );
    }

    if (!session) {
        return (
            <NavigationContainer>
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="Auth" component={AuthScreen} />
                </Stack.Navigator>
            </NavigationContainer>
        );
    }

    if (session && !isOnboarded) {
        return (
            <NavigationContainer>
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                </Stack.Navigator>
            </NavigationContainer>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="MainTabs" component={TabNavigator} />
                <Stack.Screen
                    name="SkillHistory"
                    component={SkillHistoryScreen}
                    options={{
                        headerShown: true,
                        headerTitle: '',
                        headerBackTitle: 'Back',
                        headerTintColor: '#111827',
                        headerStyle: { backgroundColor: '#F3F4F6' },
                        headerShadowVisible: false,
                    }}
                />
                <Stack.Screen
                    name="AsapTasks"
                    component={AsapTasksScreen}
                    options={{
                        headerShown: false, // We will build a custom header inside the screen
                    }}
                />
                <Stack.Screen
                    name="OnlineTasks"
                    component={OnlineTasksScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="OfflineTasks"
                    component={OfflineTasksScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="TaskDetails"
                    component={TaskDetailsScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="ReviewApplicants"
                    component={ReviewApplicantsScreen}
                    options={{ headerShown: false }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
    }
});
