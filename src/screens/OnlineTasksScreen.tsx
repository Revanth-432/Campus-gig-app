import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Globe, Zap, Clock } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import TaskCard, { TaskType } from '../components/TaskCard';

import { RefreshControl, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { checkAvailabilityMatch } from '../utils/timeHelpers';
type FilterType = 'newest' | 'pay' | 'skills' | 'quick' | 'smart';

export default function OnlineTasksScreen() {
    const navigation = useNavigation<any>();
    const { session } = useAuth();
    const [activeFilter, setActiveFilter] = useState<FilterType>('newest');

    const [tasks, setTasks] = useState<TaskType[]>([]);
    const [availabilityMap, setAvailabilityMap] = useState<number[][] | null>(null);
    const [userSkills, setUserSkills] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOnlineTasks = async () => {
        try {
            if (!session?.user?.id) return;

            // Step 1: Fetch Profile for availability and skills
            const { data: profileData } = await supabase
                .from('profiles')
                .select('availability, skills')
                .eq('id', session.user.id)
                .single();

            // Step 2: Build dynamic Task query
            let query = supabase
                .from('tasks')
                .select('*, profiles!creator_id(full_name, avatar_url, phone_number, email_contact)')
                .eq('type', 'online')
                .eq('status', 'open')
                .neq('creator_id', session.user.id)
                .gt('deadline', new Date().toISOString());

            // Apply Filters
            if (activeFilter === 'newest') query = query.order('created_at', { ascending: false });
            if (activeFilter === 'pay') query = query.order('amount', { ascending: false });
            if (activeFilter === 'quick') {
                query = query.eq('urgency', 'immediate').order('created_at', { ascending: false });
            }
            if (activeFilter === 'skills' && profileData?.skills && profileData.skills.length > 0) {
                // If they have skills, filter where task requires at least one of their skills
                // Supabase array overlap operator 'cd' or 'ov' for exact matches. Since tasks.skills is text[], we use contains/overlaps if supported.
                // Assuming `skills` is text[], we use `.overlaps()`
                query = query.overlaps('skills', profileData.skills);
            } else if (activeFilter === 'skills') {
                // Fallback if no skills are set on profile
                query = query.order('created_at', { ascending: false });
            }

            const { data: rawTasks, error } = await query;
            if (error) throw error;

            const avMap = profileData?.availability || null;
            setAvailabilityMap(avMap);

            let finalTasks = rawTasks || [];
            if (activeFilter === 'smart' && avMap) {
                finalTasks = finalTasks.filter(task => checkAvailabilityMatch(task.date, task.time, avMap));
            }

            setTasks(finalTasks);
        } catch (error: any) {
            console.error('Error fetching online tasks:', error.message);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    React.useEffect(() => {
        fetchOnlineTasks();
    }, [session, activeFilter]);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchOnlineTasks();
    }, [session, activeFilter]);

    const renderFilterPill = (id: FilterType, label: string, Icon?: any, color?: string) => {
        const isActive = activeFilter === id;
        return (
            <TouchableOpacity
                style={[
                    styles.filterPill,
                    isActive && styles.filterPillActive,
                ]}
                onPress={() => setActiveFilter(id)}
                activeOpacity={0.8}
            >
                {Icon && <Icon size={14} color={isActive ? color : '#64748B'} style={{ marginRight: 6 }} />}
                <Text style={[
                    styles.filterText,
                    isActive && styles.filterTextActive,
                    isActive && { color: color || '#4F46E5' }
                ]}>
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderEmptyState = () => {
        if (tasks.length === 0 && !isLoading) {
            return (
                <View style={styles.emptyContainer}>
                    <Globe size={48} color="#94A3B8" style={{ marginBottom: 16 }} />
                    <Text style={styles.emptyTitle}>No Matched Tasks</Text>
                    <Text style={styles.emptySubtitle}>
                        No tasks match your availability. Adjust your schedule in Profile!
                    </Text>
                    <TouchableOpacity
                        style={styles.emptyButton}
                        onPress={() => navigation.navigate('Profile')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.emptyButtonText}>Update Availability</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return null;
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#F8FAFC', '#EFF6FF', '#EEF2FF']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ChevronLeft size={28} color="#0F172A" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleRow}>
                        <View style={styles.iconBox}>
                            <Globe size={24} color="#4F46E5" />
                        </View>
                        <View>
                            <Text style={styles.headerTitle}>Online Tasks</Text>
                            <Text style={styles.headerSubtitle}>Digital work from anywhere.</Text>
                        </View>
                    </View>
                </View>

                {/* Filter Scroll */}
                <View style={styles.filterContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                        {renderFilterPill('newest', 'Newest', Clock, '#4F46E5')}
                        {renderFilterPill('smart', 'Smart Match', Zap, '#10B981')}
                        {renderFilterPill('pay', 'Top Pay', Zap, '#F59E0B')}
                        {renderFilterPill('skills', 'My Skills', Globe, '#8B5CF6')}
                        {renderFilterPill('quick', 'Quick Tasks', Clock, '#EF4444')}
                    </ScrollView>
                </View>

                {/* Task List */}
                {isLoading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color="#4F46E5" />
                    </View>
                ) : (
                    <FlatList
                        data={tasks}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <TaskCard
                                task={item}
                                showActionButton={true}
                                isSmartMatch={!!item.date && !!item.time && checkAvailabilityMatch(item.date, item.time, availabilityMap)}
                            />
                        )}
                        contentContainerStyle={[styles.listContent, tasks.length === 0 && { flex: 1 }]}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={renderEmptyState}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />
                        }
                    />
                )}
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
    header: {
        paddingHorizontal: 24,
        paddingTop: 10,
        paddingBottom: 20,
    },
    backButton: {
        marginBottom: 16,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 15,
        color: '#64748B',
        fontWeight: '500',
        marginTop: 2,
    },
    filterContainer: {
        marginBottom: 20,
    },
    filterScroll: {
        paddingHorizontal: 24,
        gap: 12,
    },
    filterPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.9)',
    },
    filterPillActive: {
        backgroundColor: '#FFFFFF',
        borderColor: '#E0E7FF',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    filterTextActive: {
        fontWeight: '800',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        marginTop: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 15,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    emptyButton: {
        backgroundColor: '#4F46E5',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 16,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    emptyButtonText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '700',
    },
});
