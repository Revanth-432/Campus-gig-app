import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Globe, MapPin, ChevronRight, Lock, Zap } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

export default function TasksScreen() {
    const navigation = useNavigation<any>();

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#F8FAFC', '#EFF6FF', '#EEF2FF']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Browse Tasks</Text>
                        <Text style={styles.subtitle}>Choose your preferred mode</Text>
                    </View>

                    {/* Mode Selectors */}
                    <View style={styles.cardsContainer}>

                        {/* Online Card */}
                        <TouchableOpacity
                            style={styles.cardWrapper}
                            activeOpacity={0.9}
                            onPress={() => navigation.navigate('OnlineTasks')}
                        >
                            <BlurView intensity={80} tint="light" style={styles.card}>
                                <View style={styles.cardIconContainer}>
                                    <View style={[styles.iconBox, { backgroundColor: '#EEF2FF' }]}>
                                        <Globe size={32} color="#4F46E5" />
                                    </View>
                                </View>
                                <View style={styles.cardContent}>
                                    <Text style={styles.cardTitle}>Online</Text>
                                    <Text style={styles.cardDescription}>
                                        PPT, Video Editing, Coding, Design & more digital work.
                                    </Text>
                                </View>
                                <View style={styles.cardFooter}>
                                    <Text style={styles.enterText}>Enter</Text>
                                    <ChevronRight size={16} color="#4F46E5" />
                                </View>
                            </BlurView>
                        </TouchableOpacity>

                        {/* Offline Card */}
                        <TouchableOpacity
                            style={styles.cardWrapper}
                            activeOpacity={0.9}
                            onPress={() => navigation.navigate('OfflineTasks')}
                        >
                            <BlurView intensity={80} tint="light" style={styles.card}>
                                <View style={styles.cardIconContainer}>
                                    <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
                                        <MapPin size={32} color="#16A34A" />
                                    </View>
                                </View>
                                <View style={styles.cardContent}>
                                    <Text style={styles.cardTitle}>On Campus</Text>
                                    <Text style={styles.cardDescription}>
                                        Delivery, Printouts, Food runs & physical campus tasks.
                                    </Text>
                                </View>
                                <View style={styles.cardFooter}>
                                    <Text style={[styles.enterText, { color: '#16A34A' }]}>Enter</Text>
                                    <ChevronRight size={16} color="#16A34A" />
                                </View>
                            </BlurView>
                        </TouchableOpacity>

                    </View>

                    {/* Legend */}
                    <View style={styles.legendContainer}>
                        <View style={styles.legendPill}>
                            <Zap size={14} color="#EF4444" fill="#EF4444" style={styles.legendIcon} />
                            <Text style={styles.legendText}>1-Step: Instant</Text>
                        </View>
                        <View style={styles.legendDivider} />
                        <View style={styles.legendPill}>
                            <Lock size={14} color="#D97706" style={styles.legendIcon} />
                            <Text style={styles.legendText}>2-Step: Review</Text>
                        </View>
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 100, // Space for nav bar
    },
    header: {
        marginBottom: 32,
    },
    title: {
        fontSize: 36,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B',
        fontWeight: '500',
        marginTop: 6,
    },
    cardsContainer: {
        gap: 20,
        marginBottom: 40,
    },
    cardWrapper: {
        width: '100%',
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.75)',
        borderRadius: 28,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.9)',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 5,
        overflow: 'hidden',
    },
    cardIconContainer: {
        marginBottom: 16,
    },
    iconBox: {
        width: 64,
        height: 64,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardContent: {
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 8,
    },
    cardDescription: {
        fontSize: 15,
        color: '#475569',
        lineHeight: 22,
        fontWeight: '500',
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    enterText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#4F46E5',
        marginRight: 4,
    },
    legendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 100,
        alignSelf: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.9)',
    },
    legendPill: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendIcon: {
        marginRight: 6,
    },
    legendText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#475569',
    },
    legendDivider: {
        width: 1,
        height: 16,
        backgroundColor: '#CBD5E1',
        marginHorizontal: 16,
    }
});
