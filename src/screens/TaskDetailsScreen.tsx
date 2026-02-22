import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ChevronLeft, MapPin, Clock, ShieldCheck, Zap, Laptop, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function TaskDetailsScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { session } = useAuth();
    const taskId = route.params?.taskId;

    const [task, setTask] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTaskDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('*, profiles!creator_id(full_name, avatar_url, phone_number, email_contact)')
                .eq('id', taskId)
                .single();

            if (error) throw error;
            setTask(data);
        } catch (error: any) {
            console.error('Error fetching task details:', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (taskId) {
            fetchTaskDetails();
        }
    }, [taskId]);

    const getTimeAgo = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4F46E5" />
            </View>
        );
    }

    if (!task) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.errorText}>Task not found.</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonFallback}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const isOnline = task.type === 'online';
    const hasBonus = task.min_bonus !== null || task.max_bonus !== null;
    const isUrgent = task.urgency === 'immediate';

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={isOnline ? ['#F8FAFC', '#EFF6FF', '#EEF2FF'] : ['#F8FAFC', '#F0FDF4', '#ECFDF5']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ChevronLeft size={28} color="#0F172A" />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Top Tags */}
                    <View style={styles.tagsRow}>
                        {isUrgent && (
                            <View style={[styles.pill, { backgroundColor: '#FEF2F2', borderColor: '#FEE2E2' }]}>
                                <Zap size={12} color="#EF4444" fill="#EF4444" />
                                <Text style={[styles.pillText, { color: '#EF4444' }]}>URGENT</Text>
                            </View>
                        )}
                        <View style={[styles.pill, { backgroundColor: isOnline ? '#EEF2FF' : '#F0FDF4', borderColor: isOnline ? '#E0E7FF' : '#DCFCE7' }]}>
                            {isOnline ? <Laptop size={12} color="#4F46E5" /> : <MapPin size={12} color="#16A34A" />}
                            <Text style={[styles.pillText, { color: isOnline ? '#4F46E5' : '#16A34A' }]}>
                                {isOnline ? 'ONLINE' : 'CAMPUS'}
                            </Text>
                        </View>
                    </View>

                    {/* Title & Price */}
                    <View style={styles.titleSection}>
                        <Text style={styles.title}>{task.title}</Text>
                        <View style={styles.priceContainer}>
                            <Text style={styles.price}>₹ {task.amount}</Text>
                            {hasBonus && (
                                <View style={styles.bonusBadge}>
                                    <Star size={12} color="#16A34A" fill="#16A34A" />
                                    <Text style={styles.bonusText}>+ ₹{task.max_bonus || task.min_bonus} Possible</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Creator Info */}
                    <View style={styles.creatorRow}>
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>
                                {task.profiles?.full_name?.charAt(0) || 'U'}
                            </Text>
                        </View>
                        <View>
                            <Text style={styles.creatorName}>{task.profiles?.full_name || 'Student'}</Text>
                            <Text style={styles.timeAgo}>Posted {getTimeAgo(task.created_at)}</Text>
                        </View>
                    </View>

                    {/* Description */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Task Details</Text>
                        <Text style={styles.descriptionText}>{task.description}</Text>
                    </View>

                    {/* Skills / Location */}
                    {isOnline && task.skills && task.skills.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Required Skills</Text>
                            <View style={styles.skillsContainer}>
                                {task.skills.map((skill: string, index: number) => (
                                    <View key={index} style={styles.skillBadge}>
                                        <Text style={styles.skillText}>{skill}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {!isOnline && task.location && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Location</Text>
                            <View style={styles.locationBox}>
                                <MapPin size={20} color="#475569" />
                                <Text style={styles.locationText}>{task.location}</Text>
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/* Footer Action */}
                {task.creator_id !== session?.user?.id && (
                    <View style={styles.footer}>
                        <BlurView intensity={80} tint="light" style={styles.footerBlur}>
                            <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
                                <Text style={styles.actionButtonText}>Claim Task</Text>
                            </TouchableOpacity>
                        </BlurView>
                    </View>
                )}
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
    errorText: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 16 },
    backButtonFallback: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#4F46E5', borderRadius: 8 },
    backButtonText: { color: '#FFF', fontWeight: '600' },
    header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
    backButton: { width: 40, height: 40, justifyContent: 'center' },
    scrollContent: { paddingHorizontal: 24, paddingBottom: 120 },
    tagsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, gap: 4 },
    pillText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
    titleSection: { marginBottom: 24 },
    title: { fontSize: 26, fontWeight: '900', color: '#0F172A', lineHeight: 32, marginBottom: 12 },
    priceContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    price: { fontSize: 28, fontWeight: '900', color: '#16A34A' },
    bonusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 4 },
    bonusText: { fontSize: 13, fontWeight: '800', color: '#16A34A' },
    creatorRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.6)', padding: 16, borderRadius: 20, marginBottom: 24 },
    avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { fontSize: 18, fontWeight: '700', color: '#64748B' },
    creatorName: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 2 },
    timeAgo: { fontSize: 13, color: '#64748B', fontWeight: '500' },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
    descriptionText: { fontSize: 16, color: '#475569', lineHeight: 24, fontWeight: '400' },
    skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    skillBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
    skillText: { color: '#475569', fontWeight: '600', fontSize: 14 },
    locationBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', padding: 16, borderRadius: 16, gap: 12 },
    locationText: { fontSize: 16, fontWeight: '600', color: '#475569', flex: 1 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 40 },
    footerBlur: { borderRadius: 24, padding: 16, backgroundColor: 'rgba(255,255,255,0.85)', overflow: 'hidden' },
    actionButton: { backgroundColor: '#4F46E5', width: '100%', paddingVertical: 18, borderRadius: 16, alignItems: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    actionButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
});
