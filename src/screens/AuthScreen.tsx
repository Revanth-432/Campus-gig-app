import React, { useState } from 'react';
import {
    Alert,
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function AuthScreen() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const toggleAuthMode = () => {
        setIsLogin(!isLogin);
    };

    const handleAuth = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password.');
            return;
        }

        setLoading(true);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email: email.trim(),
                    password,
                });

                if (error) throw error;
            } else {
                const lowerEmail = email.trim().toLowerCase();
                if (!lowerEmail.endsWith('@vnrvjiet.in')) {
                    Alert.alert('Access Denied 🛑', 'Only @vnrvjiet.in college emails are allowed to join CampusGig.');
                    setLoading(false);
                    return;
                }

                const { data, error } = await supabase.auth.signUp({
                    email: lowerEmail,
                    password,
                });

                if (error) throw error;

                if (data?.user) {
                    const { error: profileError } = await supabase
                        .from('profiles')
                        .insert([
                            {
                                id: data.user.id,
                                role: 'student',
                                live_status: true,
                            }
                        ]);

                    if (profileError) {
                        console.error('Profile creation error:', profileError);
                        Alert.alert('Notice', 'User created, but profile initialization failed.');
                    } else {
                        Alert.alert('Success', 'Account created successfully!');
                    }
                }
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.card}>
                <Text style={styles.title}>CampusGig ⚡</Text>
                <Text style={styles.subtitle}>
                    {isLogin ? 'Sign in to access your campus task board.' : 'Sign up using your college email to start earning.'}
                </Text>

                <TextInput
                    style={styles.input}
                    placeholder="Email address"
                    placeholderTextColor="#888"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#888"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleAuth}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.primaryButtonText}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryButton} onPress={toggleAuthMode}>
                    <Text style={styles.secondaryButtonText}>
                        {isLogin
                            ? "Don't have an account? Sign Up"
                            : "Already have an account? Sign In"}
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: '#6B7280',
        marginBottom: 24,
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        padding: 16,
        borderRadius: 10,
        marginBottom: 16,
        fontSize: 16,
        color: '#111827',
    },
    primaryButton: {
        backgroundColor: '#4F46E5',
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 8,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#4F46E5',
        fontSize: 14,
        fontWeight: '500',
    },
});
