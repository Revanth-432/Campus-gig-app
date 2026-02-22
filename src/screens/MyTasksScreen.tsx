import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Dimensions,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ClipboardX, Clock, Eye, CheckCircle2, Megaphone, Briefcase } from 'lucide-react-native';
import TaskCard, { TaskType } from '../components/TaskCard';

type TabType = 'active' | 'review' | 'done';

import { RefreshControl, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
export default function MyTasksScreen() {
    const { session } = useAuth();
    const [viewMode, setViewMode] = useState<'posting' | 'doing'>('posting');
    const [activeTab, setActiveTab] = useState<TabType>('active');

    const [postedTasks, setPostedTasks] = useState<TaskType[]>([]);
    const [assignedTasks, setAssignedTasks] = useState<TaskType[]>([]);
    const [appliedTasks, setAppliedTasks] = useState<any[]>([]); // type for joined task_applications

    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchMyTasks = async () => {
        if (!session?.user?.id) return;
        try {
            const [postedRes, assignedRes, appliedRes] = await Promise.all([
                supabase
                    .from('tasks')
                    .select('*, profiles!creator_id(full_name, avatar_url, phone_number, email_contact)')
                    .eq('creator_id', session.user.id)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('tasks')
                    .select('*, profiles!creator_id(full_name, avatar_url, phone_number, email_contact)')
                    .eq('assigned_to', session.user.id)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('task_applications')
                    .select('*, tasks(*, profiles!creator_id(full_name, avatar_url, phone_number, email_contact))')
                    .eq('applicant_id', session.user.id)
                    .order('created_at', { ascending: false })
            ]);

            if (postedRes.error) throw postedRes.error;
            if (assignedRes.error) throw assignedRes.error;
            if (appliedRes.error) throw appliedRes.error;

            setPostedTasks(postedRes.data || []);
            setAssignedTasks(assignedRes.data || []);
            setAppliedTasks(appliedRes.data || []);

        } catch (error: any) {
            console.error('Error fetching my tasks:', error.message);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    React.useEffect(() => {
        fetchMyTasks();
    }, [session]);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchMyTasks();
    }, [session]);

    const displayedTasks = (() => {
        if (viewMode === 'posting') {
            if (activeTab === 'active') return postedTasks.filter(t => t.status === 'open');
            // Review tab should NOT show completed tasks
            if (activeTab === 'review') return postedTasks.filter(t => t.status === 'in_progress' || t.status === 'pending_payment' || (t.verification === 'handpick' && t.status === 'open'));
            // Done tab MUST ONLY show completed tasks
            if (activeTab === 'done') return postedTasks.filter(t => t.status === 'completed');
        } else {
            if (activeTab === 'active') return assignedTasks.filter(t => t.status === 'in_progress');
            if (activeTab === 'review') return [
                ...assignedTasks.filter(t => t.status === 'pending_payment'),
                ...appliedTasks.map(app => app.tasks).filter(t => t !== null && t.status === 'open')
            ] as TaskType[];
            if (activeTab === 'done') return assignedTasks.filter(t => t.status === 'completed');
        }
        return [];
    })();

    const hasReviewTasks = viewMode === 'posting'
        ? postedTasks.some(t => t.status === 'in_progress' || t.verification === 'handpick')
        : appliedTasks.length > 0;

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
                <ClipboardX size={48} color="#94A3B8" strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>
                {viewMode === 'posting' ? "You haven't posted any tasks." : "You haven't accepted any jobs."}
            </Text>
            <Text style={styles.emptySubtitle}>
                {viewMode === 'posting' ? "Tasks you post to the campus board will appear here." : "Tasks you accept or apply for will appear here."}
            </Text>
        </View>
    );

    const renderTaskCard = ({ item }: { item: TaskType }) => {
        return (
            <TaskCard
                task={item}
                showActionButton={true}
                onActionComplete={fetchMyTasks} // Refresh list immediately after status changes
            />
        );
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
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>My Tasks</Text>
                    <Text style={styles.headerSubtitle}>Track, review, and manage your work</Text>
                </View>

                {/* MASTER TOGGLE: Posting vs Doing */}
                <View style={styles.toggleContainer}>
                    <TouchableOpacity
                        style={[styles.toggleButton, viewMode === 'posting' && styles.toggleButtonActive]}
                        onPress={() => { setViewMode('posting'); setActiveTab('active'); }}
                        activeOpacity={0.9}
                    >
                        <Megaphone size={18} color={viewMode === 'posting' ? '#FFF' : '#64748B'} />
                        <Text style={[styles.toggleText, viewMode === 'posting' && styles.toggleTextActive]}>My Posts</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.toggleButton, viewMode === 'doing' && styles.toggleButtonActive]}
                        onPress={() => { setViewMode('doing'); setActiveTab('active'); }}
                        activeOpacity={0.9}
                    >
                        <Briefcase size={18} color={viewMode === 'doing' ? '#FFF' : '#64748B'} />
                        <Text style={[styles.toggleText, viewMode === 'doing' && styles.toggleTextActive]}>My Jobs</Text>
                    </TouchableOpacity>
                </View>

                {/* Segmented Tabs */}
                <View style={styles.tabsContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'active' && styles.tabActive]}
                        onPress={() => setActiveTab('active')}
                        activeOpacity={0.8}
                    >
                        <Clock size={16} color={activeTab === 'active' ? '#4F46E5' : '#64748B'} />
                        <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>Active</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'review' && styles.tabActive]}
                        onPress={() => setActiveTab('review')}
                        activeOpacity={0.8}
                    >
                        <View style={styles.reviewTabContent}>
                            <Eye size={16} color={activeTab === 'review' ? '#4F46E5' : '#64748B'} />
                            <Text style={[styles.tabText, activeTab === 'review' && styles.tabTextActive]}>Review</Text>
                            {hasReviewTasks && <View style={styles.notificationDot} />}
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'done' && styles.tabActive]}
                        onPress={() => setActiveTab('done')}
                        activeOpacity={0.8}
                    >
                        <CheckCircle2 size={16} color={activeTab === 'done' ? '#4F46E5' : '#64748B'} />
                        <Text style={[styles.tabText, activeTab === 'done' && styles.tabTextActive]}>Done</Text>
                    </TouchableOpacity>
                </View>

                {isLoading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color="#4F46E5" />
                    </View>
                ) : (
                    <FlatList
                        data={displayedTasks}
                        keyExtractor={item => item.id}
                        renderItem={renderTaskCard}
                        contentContainerStyle={styles.listContent}
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
        paddingTop: 16,
        paddingBottom: 20,
    },
    headerTitle: {
        fontSize: 34,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#64748B',
        fontWeight: '500',
        marginTop: 6,
    },
    toggleContainer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        marginBottom: 20,
        gap: 8,
    },
    toggleButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.9)',
        gap: 8,
    },
    toggleButtonActive: {
        backgroundColor: '#4F46E5', // Indigo
        borderColor: '#4F46E5',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6,
    },
    toggleText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#64748B',
    },
    toggleTextActive: {
        color: '#FFFFFF',
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        marginBottom: 20,
        gap: 12,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.9)',
        gap: 6,
    },
    tabActive: {
        backgroundColor: '#FFFFFF',
        borderColor: '#E0E7FF',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    tabTextActive: {
        color: '#4F46E5',
        fontWeight: '800',
    },
    reviewTabContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    notificationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
        position: 'absolute',
        top: -2,
        right: -10,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100, // Space for bottom nav
        flexGrow: 1,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        flex: 1,
    },
    emptyIconContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        boxShadow: '0px 8px 24px rgba(148, 163, 184, 0.15)',
    },
    emptyTitle: {
        fontSize: 22,
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
        paddingHorizontal: 32,
    },
});
