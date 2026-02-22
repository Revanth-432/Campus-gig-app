import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Dimensions,
    Animated,
    Switch,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
    Home,
    Plus,
    ListTodo,
    ClipboardList,
    User,
    Search,
    Wallet,
    Laptop,
    MapPin,
    ChevronLeft,
    Clock
} from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const { session } = useAuth();

    const [activeVibe, setActiveVibe] = useState<'online' | 'campus' | null>(null);

    // Real Data State
    const [onlineTasks, setOnlineTasks] = useState<any[]>([]);
    const [campusTasks, setCampusTasks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [urgentCount, setUrgentCount] = useState(0);

    // Animations
    const fadeAnim = useState(new Animated.Value(1))[0];
    const slideAnim = useState(new Animated.Value(0))[0];
    const typeAnim = useState(new Animated.Value(0))[0];
    const blinkAnim = useState(new Animated.Value(1))[0];

    const fetchLiveTasks = async () => {
        try {
            let query = supabase
                .from('tasks')
                .select('*, profiles!creator_id(full_name, avatar_url, phone_number, email_contact)')
                .eq('status', 'open')
                .gt('deadline', new Date().toISOString())
                .order('created_at', { ascending: false });

            // Ensure students don't see their own tasks
            if (session?.user?.id) {
                query = query.neq('creator_id', session.user.id);
            }

            const { data, error } = await query;

            if (error) throw error;

            if (data) {
                const online = data.filter(task => task.type === 'online');
                const campus = data.filter(task => task.type === 'on_campus');
                const today = new Date();
                const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
                const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();

                const urgent = data.filter(t => t.deadline && t.deadline >= startOfDay && t.deadline <= endOfDay);

                setOnlineTasks(online);
                setCampusTasks(campus);
                setUrgentCount(urgent.length);
            }
        } catch (error: any) {
            console.error('Error fetching live tasks:', error.message);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchLiveTasks();
        }, [])
    );

    useEffect(() => {
        // Start Typewriter
        Animated.timing(typeAnim, {
            toValue: width * 0.9,
            duration: 2000,
            useNativeDriver: false
        }).start();

        // Start Cursor Blink
        Animated.loop(
            Animated.sequence([
                Animated.timing(blinkAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
                Animated.timing(blinkAnim, { toValue: 1, duration: 500, useNativeDriver: true })
            ])
        ).start();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchLiveTasks();
    }, []);

    const triggerTransition = (vibe: 'online' | 'campus') => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: -50, duration: 250, useNativeDriver: true })
        ]).start(() => {
            setActiveVibe(vibe);
            slideAnim.setValue(50);
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true })
            ]).start();
        });
    };

    const goBackToHub = () => {
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
            setActiveVibe(null);
            Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        });
    };

    const handleAsapToggle = (val: boolean) => {
        if (val) {
            navigation.navigate('AsapTasks');
        }
    };

    // --- Online Content (Grid) ---
    const renderOnlineGrid = () => (
        <Animated.View style={[styles.contentArea, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.contentHeader}>
                <TouchableOpacity onPress={goBackToHub} style={styles.backButton}>
                    <ChevronLeft size={28} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.contentTitle}>Online Tasks</Text>
            </View>

            {isLoading ? (
                <View style={styles.centerLoad}><ActivityIndicator size="large" color="#4F46E5" /></View>
            ) : (
                <FlatList
                    data={onlineTasks}
                    keyExtractor={item => item.id}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />}
                    ListEmptyComponent={
                        <View style={styles.emptyWrap}>
                            <Text style={styles.emptyText}>No online tasks available right now.</Text>
                        </View>
                    }
                    contentContainerStyle={{ paddingBottom: 100 }} // padding for footer
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View>
                                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                                {item.skills && item.skills.length > 0 && (
                                    <View style={styles.tagsContainer}>
                                        {item.skills.slice(0, 3).map((skill: string) => (
                                            <View key={skill} style={styles.tagBadge}>
                                                <Text style={styles.tagText}>{skill}</Text>
                                            </View>
                                        ))}
                                        {item.skills.length > 3 && (
                                            <View style={styles.tagBadge}>
                                                <Text style={styles.tagText}>+{item.skills.length - 3}</Text>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </View>
                            <View style={styles.cardFooter}>
                                <Text style={styles.cardPrice}>${item.amount?.toFixed(2) || '0.00'}</Text>
                                <Text style={styles.cardCreator} numberOfLines={1}>
                                    {item.profiles?.full_name || 'Student'}
                                </Text>
                            </View>
                        </View>
                    )}
                />
            )}
        </Animated.View>
    );

    // --- Campus Content (Map + Horizontal List) ---
    const renderCampusMap = () => (
        <Animated.View style={[styles.mapContentArea, { opacity: fadeAnim }]}>
            <TouchableOpacity onPress={goBackToHub} style={[styles.backButtonMap, { top: insets.top + 20 }]}>
                <View style={styles.mapBackButtonGlass}>
                    <ChevronLeft size={28} color="#111827" />
                </View>
            </TouchableOpacity>

            <MapView
                style={StyleSheet.absoluteFillObject}
                provider={PROVIDER_DEFAULT}
                initialRegion={{
                    latitude: 37.78825,
                    longitude: -122.4324,
                    latitudeDelta: 0.015,
                    longitudeDelta: 0.0121,
                }}
            >
                {campusTasks.map((task) => {
                    const offsetLat = 37.78825 + (Math.random() - 0.5) * 0.01;
                    const offsetLng = -122.4324 + (Math.random() - 0.5) * 0.01;
                    return (
                        <Marker
                            key={task.id}
                            coordinate={{ latitude: offsetLat, longitude: offsetLng }}
                            title={task.title}
                            description={`$${task.amount?.toFixed(2) || '0.00'}`}
                        />
                    );
                })}
            </MapView>

            {!isLoading && campusTasks.length > 0 && (
                <View style={[styles.horizontalListOverlay, { paddingBottom: 100 }]}>
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={campusTasks}
                        keyExtractor={item => item.id}
                        contentContainerStyle={{ paddingHorizontal: 20 }}
                        snapToInterval={280 + 16}
                        decelerationRate="fast"
                        renderItem={({ item }) => (
                            <BlurView intensity={90} tint="light" style={styles.campusCard}>
                                <View style={styles.campusCardHeader}>
                                    <Text style={styles.campusCardTitle} numberOfLines={1}>{item.title}</Text>
                                    <Text style={styles.campusCardPrice}>${item.amount?.toFixed(2)}</Text>
                                </View>
                                <View style={styles.campusCardRow}>
                                    <MapPin size={14} color="#6B7280" style={{ marginRight: 4 }} />
                                    <Text style={styles.campusCardLocation} numberOfLines={1}>{item.location || 'Campus'}</Text>
                                </View>
                                <View style={[styles.campusCardRow, { marginTop: 4 }]}>
                                    <Clock size={14} color="#6B7280" style={{ marginRight: 4 }} />
                                    <Text style={styles.campusCardTime}>ASAP • {item.profiles?.full_name || 'Student'}</Text>
                                </View>
                                <TouchableOpacity style={styles.claimButton}>
                                    <Text style={styles.claimButtonText}>View Task</Text>
                                </TouchableOpacity>
                            </BlurView>
                        )}
                    />
                </View>
            )}
        </Animated.View>
    );

    // Welcome Animations
    const welcomeFade = useRef(new Animated.Value(0)).current;
    const welcomeSlide = useRef(new Animated.Value(20)).current;

    // Pulse Animation for Available Now
    const [isAvailable, setIsAvailable] = useState(false);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isAvailable) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.05,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isAvailable]);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(welcomeFade, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(welcomeSlide, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // --- Hub View ---
    const renderHub = () => (
        <Animated.View style={[styles.hubContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

            <View style={[styles.topBar, { marginTop: insets.top + 10, paddingBottom: 10 }]}>
                <View style={styles.logoWrap}>
                    <Text style={styles.logoText}>Campus<Text style={{ color: '#10B981' }}>Gig ⚡</Text></Text>
                </View>
                {/* Available Now toggle moved down into Hero */}
            </View>

            <View style={[styles.heroContainer, { marginTop: 10 }]}>

                {/* Main Prominent "Available Now" Toggle Card */}
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => {
                        setIsAvailable(!isAvailable);
                        if (!isAvailable) {
                            navigation.navigate('AsapTasks');
                        }
                    }}
                    style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 24,
                        padding: 20,
                        marginBottom: 32,
                        shadowColor: isAvailable ? '#10B981' : '#94A3B8',
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: isAvailable ? 0.3 : 0.1,
                        shadowRadius: isAvailable ? 20 : 12,
                        elevation: isAvailable ? 10 : 4,
                        borderWidth: 2,
                        borderColor: isAvailable ? 'rgba(16, 185, 129, 0.5)' : '#F1F5F9',
                    }}
                >
                    <Animated.View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transform: [{ scale: pulseAnim }]
                    }}>
                        <View style={{ flex: 1, paddingRight: 16 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                <Text style={{ fontSize: 22, fontWeight: '900', color: '#111827', letterSpacing: -0.5 }}>Available Now</Text>
                                {isAvailable && <View style={[styles.radarDotPulse, { width: 8, height: 8, borderRadius: 4, marginLeft: 8 }]} />}
                                {urgentCount > 0 && !isAvailable && (
                                    <View style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginLeft: 10, flexDirection: 'row', alignItems: 'center' }}>
                                        <View style={[styles.radarDotPulse, { backgroundColor: '#EF4444', shadowColor: '#EF4444', width: 6, height: 6, borderRadius: 3, marginRight: 6, position: 'relative', top: 0, left: 0 }]} />
                                        <Text style={{ color: '#B91C1C', fontSize: 11, fontWeight: '800' }}>{urgentCount} LIVE</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '500' }}>
                                Be visible for instant nearby tasks.
                            </Text>
                        </View>
                        <View pointerEvents="none">
                            <Switch
                                trackColor={{ false: '#E2E8F0', true: '#10B981' }}
                                thumbColor={'#FFFFFF'}
                                ios_backgroundColor="#E2E8F0"
                                value={isAvailable}
                                style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
                            />
                        </View>
                    </Animated.View>
                </TouchableOpacity>

                {/* Welcome Animated Header */}
                <Animated.View style={{ opacity: welcomeFade, transform: [{ translateY: welcomeSlide }], alignItems: 'center' }}>
                    <Text style={[styles.heroHeadline, { flexWrap: 'wrap', textAlign: 'center', marginBottom: 16 }]}>
                        Welcome to CampusGig!
                    </Text>
                    <Text style={{ fontSize: 16, color: '#64748B', textAlign: 'center', marginBottom: 32, paddingHorizontal: 20 }}>
                        Your central hub to post jobs and pick up quick gigs around campus.
                    </Text>

                    {/* Simulated Campus Activity Bar */}
                    <View style={{ backgroundColor: '#FFFBEB', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#FEF3C7' }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#D97706' }}>🔥  12 tasks posted in the last hour</Text>
                    </View>
                </Animated.View>

                {/* Vertical Action Stack */}
                <View style={{ flexDirection: 'column', gap: 16 }}>
                    <TouchableOpacity
                        style={{ width: '100%', backgroundColor: '#4F46E5', paddingVertical: 18, paddingHorizontal: 24, borderRadius: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 }}
                        onPress={() => navigation.navigate('PostTask')}
                        activeOpacity={0.8}
                    >
                        <View style={{ width: 48, height: 48, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                            <Text style={{ fontSize: 24 }}>📝</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 18, marginBottom: 4 }}>CREATE A TASK</Text>
                            <Text style={{ color: '#E0E7FF', fontSize: 13 }}>Need a hand? Post your requirement.</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={{ width: '100%', backgroundColor: '#FFFFFF', paddingVertical: 18, paddingHorizontal: 24, borderRadius: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: '#4F46E5', shadowColor: '#94A3B8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }}
                        onPress={() => navigation.navigate('Tasks')}
                        activeOpacity={0.8}
                    >
                        <View style={{ width: 48, height: 48, backgroundColor: '#EEF2FF', borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                            <Text style={{ fontSize: 24 }}>💰</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: '#4F46E5', fontWeight: '800', fontSize: 18, marginBottom: 4 }}>WORK FOR A TASK</Text>
                            <Text style={{ color: '#6366F1', fontSize: 13 }}>Browse gigs and earn rewards.</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </Animated.View>
    );

    return (
        <View style={styles.rootContainer}>
            <View style={styles.mainContent}>
                {activeVibe === null && renderHub()}
                {activeVibe === 'online' && renderOnlineGrid()}
                {activeVibe === 'campus' && renderCampusMap()}
            </View>

            {/* Nav Footer moved to TabNavigator */}

        </View>
    );
}

const styles = StyleSheet.create({
    rootContainer: { flex: 1, backgroundColor: '#F9FAFB' },
    mainContent: { flex: 1 },
    hubContainer: { flex: 1, paddingHorizontal: 20 },
    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, zIndex: 10 },
    logoWrap: { justifyContent: 'center' },
    logoText: { fontSize: 20, fontWeight: '900', color: '#111827' },
    radarContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.7)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.9)', overflow: 'hidden', gap: 8 },
    radarTextRow: { alignItems: 'flex-end', justifyContent: 'center' },
    radarText: { fontSize: 15, fontWeight: '800', color: '#111827', textTransform: 'uppercase', letterSpacing: 0.5 },
    radarDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D1D5DB', marginTop: -2, marginLeft: 6, position: 'absolute', right: -10, top: 2 },
    radarDotPulse: { backgroundColor: '#10B981', shadowColor: '#10B981', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4, elevation: 4 },
    heroContainer: { flex: 1, justifyContent: 'center', paddingBottom: 80 },
    heroHeadline: { fontSize: 32, fontWeight: '900', color: '#111827', marginBottom: 24, letterSpacing: -0.5 },
    heroWrapper: { marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 8 },
    heroCard: { borderRadius: 24, padding: 24, height: 180, justifyContent: 'space-between', overflow: 'hidden' },
    heroBadge: { position: 'absolute', top: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    heroBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
    heroIconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255, 255, 255, 0.2)', alignItems: 'center', justifyContent: 'center' },
    heroTextStack: { marginTop: 10 },
    heroCardTitle: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
    heroCardSub: { fontSize: 14, fontWeight: '500', color: 'rgba(255, 255, 255, 0.85)' },
    contentArea: { flex: 1, paddingHorizontal: 20, paddingTop: 60 },
    contentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    backButton: { marginRight: 10, padding: 4 },
    contentTitle: { fontSize: 28, fontWeight: '900', color: '#111827' },
    mapContentArea: { flex: 1 },
    backButtonMap: { position: 'absolute', left: 20, zIndex: 100 },
    mapBackButtonGlass: { backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 20, padding: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
    row: { justifyContent: 'space-between' },
    centerLoad: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyWrap: { flex: 1, alignItems: 'center', marginTop: 40 },
    emptyText: { color: '#6B7280', fontStyle: 'italic' },
    card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, width: (width - 50) / 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2, minHeight: 140, justifyContent: 'space-between' },
    cardTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 8, lineHeight: 18 },
    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 12 },
    tagBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8 },
    tagText: { fontSize: 9, fontWeight: '700', color: '#4F46E5', textTransform: 'uppercase' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    cardPrice: { fontSize: 16, fontWeight: '900', color: '#10B981' },
    cardCreator: { fontSize: 10, color: '#9CA3AF', fontWeight: '500', maxWidth: 60 },
    horizontalListOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 100 },
    campusCard: { width: 280, backgroundColor: 'rgba(255, 255, 255, 0.85)', borderRadius: 20, padding: 16, marginRight: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)' },
    campusCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    campusCardTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: '#111827', marginRight: 10 },
    campusCardPrice: { fontSize: 18, fontWeight: '900', color: '#10B981' },
    campusCardRow: { flexDirection: 'row', alignItems: 'center' },
    campusCardLocation: { fontSize: 13, color: '#4B5563', fontWeight: '600', flex: 1 },
    campusCardTime: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
    claimButton: { backgroundColor: '#4F46E5', borderRadius: 12, paddingVertical: 10, alignItems: 'center', marginTop: 12 },
    claimButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 }
});
