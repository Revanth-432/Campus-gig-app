import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ScrollView,
    Modal,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, MapPin, Zap, Clock, X, ZoomIn, ZoomOut } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import TaskCard, { TaskType } from '../components/TaskCard';

const { width, height } = Dimensions.get('window');

const CAMPUS_NODES = [
    { id: '1', name: 'B-Block', top: '20%', left: '30%' },
    { id: '2', name: 'C-Block', top: '20%', left: '50%' },
    { id: '3', name: 'D-Block', top: '35%', left: '70%' },
    { id: '4', name: 'E-Block', top: '50%', left: '80%' },
    { id: '5', name: 'PG-Block', top: '65%', left: '80%' },
    { id: '6', name: 'SAC Stage', top: '35%', left: '40%' },
    { id: '7', name: 'Bike Parking', top: '80%', left: '20%' },
    { id: '8', name: 'PEB Canteen', top: '50%', left: '25%' },
    { id: '9', name: 'Bus Parking', top: '85%', left: '45%' },
    { id: '10', name: 'Basketball Court', top: '65%', left: '30%' },
    { id: '11', name: 'VNR Circle', top: '70%', left: '55%' },
    { id: '12', name: 'Main Gate', top: '90%', left: '55%' },
    { id: '13', name: 'Hostel Mess', top: '15%', left: '75%' },
];

import { RefreshControl, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { checkAvailabilityMatch } from '../utils/timeHelpers';

type FilterType = 'all' | 'immediate' | 'feasible';

export default function OfflineTasksScreen() {
    const navigation = useNavigation<any>();
    const { session } = useAuth();
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');

    const [tasks, setTasks] = useState<TaskType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Map States
    const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
    const [zoomLevel, setZoomLevel] = useState(1);

    const fetchOfflineTasks = async () => {
        try {
            let query = supabase
                .from('tasks')
                .select('*, profiles!creator_id(full_name, avatar_url, phone_number, email_contact)')
                .eq('type', 'on_campus')
                .eq('status', 'open')
                .gt('deadline', new Date().toISOString())
                .order('created_at', { ascending: false });

            if (session?.user?.id) {
                query = query.neq('creator_id', session.user.id);
            }

            const [tasksRes, profileRes] = await Promise.all([
                query,
                supabase.from('profiles').select('availability').eq('id', session?.user?.id).single()
            ]);

            if (tasksRes.error) throw tasksRes.error;

            const rawTasks = tasksRes.data || [];
            const availabilityMap = profileRes.data?.availability;

            const matchedTasks = rawTasks.filter(task =>
                checkAvailabilityMatch(task.date, task.time, availabilityMap)
            );

            console.log(`Filtered Offline Tasks: ${matchedTasks.length} / ${rawTasks.length}`);
            setTasks(matchedTasks);
        } catch (error: any) {
            console.error('Error fetching offline tasks:', error.message);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    React.useEffect(() => {
        fetchOfflineTasks();
    }, [session]);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchOfflineTasks();
    }, [session]);

    const displayedTasks = tasks.filter(t => {
        if (activeFilter === 'immediate') return t.urgency === 'immediate';
        if (activeFilter === 'feasible') return t.urgency === 'feasible';
        return true;
    });

    // Grouping tasks by location to plot on the map
    const groupedTasks = React.useMemo(() => {
        const groups: Record<string, { tasks: TaskType[], status: 'high' | 'normal' | 'low' }> = {};

        displayedTasks.forEach(task => {
            const loc = task.location || 'Campus';
            if (!groups[loc]) {
                groups[loc] = { tasks: [], status: 'low' };
            }
            groups[loc].tasks.push(task);

            // Determine highest urgency
            if (task.urgency === 'immediate') {
                groups[loc].status = 'high';
            } else if (groups[loc].status !== 'high' && task.amount > 100) { // arbitrary threshold for yellow
                groups[loc].status = 'normal';
            }
        });
        return groups;
    }, [displayedTasks]);

    const getPinColor = (status: 'high' | 'normal' | 'low') => {
        if (status === 'high') return '#EF4444'; // Red
        if (status === 'normal') return '#F59E0B'; // Yellow
        return '#10B981'; // Green
    };

    const renderFilterPill = (id: FilterType, label: string, Icon?: any, color?: string) => {
        const isActive = activeFilter === id;
        return (
            <TouchableOpacity
                style={[
                    styles.filterPill,
                    isActive && styles.filterPillActive,
                    isActive && id === 'immediate' && { borderColor: '#FECACA', backgroundColor: '#FEF2F2' },
                    isActive && id === 'feasible' && { borderColor: '#DCFCE7', backgroundColor: '#F0FDF4' },
                    isActive && id === 'all' && { borderColor: '#DCFCE7', backgroundColor: '#FFFFFF' }
                ]}
                onPress={() => setActiveFilter(id)}
                activeOpacity={0.8}
            >
                {Icon && <Icon size={14} color={isActive ? color : '#64748B'} style={{ marginRight: 6 }} fill={id === 'immediate' ? color : 'none'} />}
                <Text style={[
                    styles.filterText,
                    isActive && styles.filterTextActive,
                    isActive && { color: color || '#16A34A' }
                ]}>
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#F8FAFC', '#F0FDF4', '#ECFDF5']}
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
                            <MapPin size={24} color="#16A34A" />
                        </View>
                        <View>
                            <Text style={styles.headerTitle}>📍 On Campus Tasks</Text>
                            <Text style={styles.headerSubtitle}>Schematic live map.</Text>
                        </View>
                    </View>
                </View>

                {/* Filter Scroll */}
                <View style={styles.filterContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                        {renderFilterPill('all', 'All', undefined, '#16A34A')}
                        {renderFilterPill('immediate', 'Immediate', Zap, '#EF4444')}
                        {renderFilterPill('feasible', 'Feasible', Clock, '#16A34A')}
                    </ScrollView>
                </View>

                {/* Map Interface */}
                {isLoading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color="#16A34A" />
                    </View>
                ) : (
                    <ScrollView maximumZoomScale={3} minimumZoomScale={1} showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
                            <View style={[styles.mapContainer, { width: (width * 1.5) * zoomLevel, height: (height * 0.8) * zoomLevel }]}>
                                {tasks.length === 0 && (
                                    <View style={{ ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', padding: 24, zIndex: 10, backgroundColor: 'rgba(236, 253, 245, 0.85)' }}>
                                        <MapPin size={48} color="#94A3B8" style={{ marginBottom: 16 }} />
                                        <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 8 }}>No tasks nearby</Text>
                                        <Text style={{ fontSize: 15, color: '#4B5563', textAlign: 'center', marginBottom: 24, lineHeight: 22 }}>
                                            Check back later when students need help on campus!
                                        </Text>
                                        <TouchableOpacity
                                            style={{ backgroundColor: '#10B981', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12 }}
                                            onPress={() => navigation.navigate('Profile')}
                                            activeOpacity={0.8}
                                        >
                                            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>Update Availability</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {/* Schematic Background effect */}
                                <View style={styles.mapGridLineHorizontal} />
                                <View style={styles.mapGridLineVertical} />
                                <View style={styles.mapGridLineHorizontal2} />
                                <View style={styles.mapGridLineVertical2} />

                                {/* "You" Indicator */}
                                <View style={styles.youIndicator}>
                                    <View style={[styles.nodeOuterRing, { backgroundColor: 'rgba(6, 182, 212, 0.2)' }]}>
                                        <View style={[styles.nodeInnerDot, { backgroundColor: '#06B6D4' }]} />
                                    </View>
                                    <Text style={styles.nodeLabel}>You</Text>
                                </View>

                                {/* Render active pins */}
                                {CAMPUS_NODES.map((node) => {
                                    const group = groupedTasks[node.name];
                                    const taskCount = group ? group.tasks.length : 0;

                                    let priorityColor = '#D1D5DB'; // Gray (sleeping)
                                    if (group) {
                                        if (group.status === 'high') priorityColor = '#EF4444';
                                        else if (group.status === 'normal') priorityColor = '#F59E0B';
                                        else priorityColor = '#10B981';
                                    }

                                    // Convert hex to rgba for the outer ring glow
                                    let rgbaColor = 'rgba(209, 213, 219, 0.2)';
                                    if (priorityColor === '#EF4444') rgbaColor = 'rgba(239, 68, 68, 0.2)';
                                    else if (priorityColor === '#F59E0B') rgbaColor = 'rgba(245, 158, 11, 0.2)';
                                    else if (priorityColor === '#10B981') rgbaColor = 'rgba(16, 185, 129, 0.2)';

                                    return (
                                        <TouchableOpacity
                                            key={node.id}
                                            style={[styles.mapPinContainer, { top: node.top as any, left: node.left as any }]}
                                            onPress={() => { if (taskCount > 0) setSelectedLocation(node.name) }}
                                            activeOpacity={0.8}
                                        >
                                            <View style={[styles.nodeOuterRing, { backgroundColor: rgbaColor }]}>
                                                <View style={[styles.nodeInnerDot, { backgroundColor: priorityColor }]} />
                                            </View>

                                            {taskCount > 0 && (
                                                <View style={[styles.badgeContainer, { backgroundColor: priorityColor }]}>
                                                    <Text style={styles.badgeText}>{taskCount}</Text>
                                                </View>
                                            )}

                                            <Text style={styles.nodeLabel}>{node.name}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </ScrollView>
                    </ScrollView>
                )}

                {/* Zoom Controls */}
                <View style={styles.zoomControls}>
                    <TouchableOpacity style={styles.zoomButton} onPress={() => setZoomLevel(prev => Math.min(prev + 0.5, 3))}>
                        <ZoomIn size={24} color="#111827" />
                    </TouchableOpacity>
                    <View style={styles.zoomDivider} />
                    <TouchableOpacity style={styles.zoomButton} onPress={() => setZoomLevel(prev => Math.max(prev - 0.5, 1))}>
                        <ZoomOut size={24} color="#111827" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {/* Task List Modal */}
            <Modal
                visible={selectedLocation !== null}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setSelectedLocation(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{selectedLocation}</Text>
                            <TouchableOpacity onPress={() => setSelectedLocation(null)} style={styles.closeButton}>
                                <X size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={selectedLocation ? groupedTasks[selectedLocation]?.tasks || [] : []}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <TaskCard task={item} showActionButton={true} />
                            )}
                            contentContainerStyle={styles.modalListContent}
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                </View>
            </Modal>
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
        backgroundColor: '#DCFCE7',
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
        borderColor: '#DCFCE7',
        shadowColor: '#16A34A',
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
    mapContainer: {
        flex: 1,
        margin: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.6)', // Frosted glass aesthetic
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        shadowColor: '#16A34A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
        overflow: 'hidden',
    },
    // Schematic layout lines
    mapGridLineHorizontal: { position: 'absolute', top: '30%', left: 0, right: 0, height: 1, backgroundColor: 'rgba(22, 163, 74, 0.15)' },
    mapGridLineVertical: { position: 'absolute', top: 0, bottom: 0, left: '40%', width: 1, backgroundColor: 'rgba(22, 163, 74, 0.15)' },
    mapGridLineHorizontal2: { position: 'absolute', top: '70%', left: 0, right: 0, height: 1, backgroundColor: 'rgba(22, 163, 74, 0.15)' },
    mapGridLineVertical2: { position: 'absolute', top: 0, bottom: 0, left: '75%', width: 1, backgroundColor: 'rgba(22, 163, 74, 0.15)' },

    youIndicator: {
        position: 'absolute',
        bottom: '10%',
        alignSelf: 'center',
        alignItems: 'center',
        left: '45%' // approximate center
    },
    youDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#4F46E5', // Blue for User
        borderWidth: 2,
        borderColor: '#FFF',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
    },
    youText: {
        marginTop: 4,
        fontSize: 12,
        fontWeight: '800',
        color: '#4F46E5',
    },
    mapPinContainer: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        marginLeft: -16, // center pin on x axis
        marginTop: -16, // center pin on y axis
    },
    nodeOuterRing: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nodeInnerDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    nodeLabel: {
        position: 'absolute',
        bottom: -20,
        left: -24,
        width: 80,
        fontSize: 10,
        fontWeight: '600',
        color: '#4B5563',
        textAlign: 'center',
    },
    badgeContainer: {
        position: 'absolute',
        top: -4,
        right: -4,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 1.5,
        borderColor: '#FFF',
        zIndex: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: '900',
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#F8FAFC',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: '80%',
        paddingTop: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#0F172A',
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalListContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    zoomControls: {
        position: 'absolute',
        bottom: 40,
        right: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 12,
        shadowColor: '#16A34A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 5,
        overflow: 'hidden',
    },
    zoomButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    zoomDivider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        width: '100%',
    }
});
