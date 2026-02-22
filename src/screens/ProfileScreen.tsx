import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Switch,
    Alert,
    ScrollView,
    Dimensions,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import {
    User,
    ShieldCheck,
    Star,
    Clock,
    BookOpen,
    FileText,
    CheckCircle2,
    AlertCircle,
    Zap,
    Download,
    LogOut,
    MapPin,
    Edit2
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import AchievementModal from '../components/AchievementModal';

const { width } = Dimensions.get('window');

const MOCK_DATA = {
    heatmap: [
        [0, 0, 2], // Mon
        [1, 0, 2], // Tue
        [0, 1, 2], // Wed
        [2, 0, 1], // Thu
        [0, 2, 2], // Fri
        [2, 2, 2], // Sat
        [1, 2, 1], // Sun
    ],
    notes: [
        { id: 'n1', title: 'CS101 Final Review Guide.pdf', downloads: 124 },
        { id: 'n2', title: 'Data Structures Cheatsheet.pdf', downloads: 350 }
    ]
};

export default function ProfileScreen() {
    const { session, signOut } = useAuth();
    const navigation = useNavigation<any>();

    // Real Data State
    const [userData, setUserData] = useState<any>(null);
    const [isLive, setIsLive] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isGiverView, setIsGiverView] = useState(false);
    const [loadingInitial, setLoadingInitial] = useState(true);

    // Achievement Modal State
    const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

    // Reviews Data
    const [recentReviews, setRecentReviews] = useState<any[]>([]);
    const [avgRating, setAvgRating] = useState('0.0');
    const [totalReviews, setTotalReviews] = useState(0);

    // Edit Modal State
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editForm, setEditForm] = useState({
        full_name: '',
        age: '',
        department: '',
        year: '',
        phone_number: '',
        email_contact: '',
        skills: '',
        availability: MOCK_DATA.heatmap
    });

    const fetchProfileData = async () => {
        if (!session?.user?.id) return;
        try {
            const [profileRes, reviewsRes] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', session.user.id).single(),
                supabase.from('reviews').select('id, rating, comment, tasks(title)').eq('reviewee_id', session.user.id).order('created_at', { ascending: false })
            ]);

            if (profileRes.error) throw profileRes.error;
            const data = profileRes.data;
            setUserData(data);
            setIsLive(!!data.live_status);

            const userAvailability = data.availability || MOCK_DATA.heatmap;
            setEditForm(prev => ({ ...prev, availability: userAvailability }));

            if (reviewsRes.data) {
                setRecentReviews(reviewsRes.data.slice(0, 3));
                setTotalReviews(reviewsRes.data.length);
                if (reviewsRes.data.length > 0) {
                    const sum = reviewsRes.data.reduce((acc, r) => acc + r.rating, 0);
                    setAvgRating((sum / reviewsRes.data.length).toFixed(1));
                }
            }

        } catch (error: any) {
            console.error('Error fetching data:', error.message);
        } finally {
            setLoadingInitial(false);
        }
    };

    useEffect(() => {
        fetchProfileData();
    }, [session]);

    const handleToggleLive = async (newValue: boolean) => {
        if (!session?.user?.id) return;
        setIsLive(newValue);
        setIsUpdating(true);
        try {
            const { error } = await supabase.from('profiles').update({ live_status: newValue }).eq('id', session.user.id);
            if (error) throw error;
        } catch (error: any) {
            setIsLive(!newValue);
            Alert.alert('Update Failed', error.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const openEditModal = () => {
        setEditForm({
            full_name: userData?.full_name || '',
            age: userData?.age ? userData.age.toString() : '',
            department: userData?.department || '',
            year: userData?.year || '',
            phone_number: userData?.phone_number || '',
            email_contact: userData?.email_contact || '',
            skills: userData?.skills ? userData.skills.join(', ') : '',
            availability: userData?.availability || MOCK_DATA.heatmap
        });
        setIsEditModalVisible(true);
    };

    const handleToggleHeatmapCell = (colIdx: number, rowIdx: number) => {
        const newAvailability = [...editForm.availability];
        newAvailability[colIdx] = [...newAvailability[colIdx]];
        newAvailability[colIdx][rowIdx] = (newAvailability[colIdx][rowIdx] + 1) % 3;
        setEditForm({ ...editForm, availability: newAvailability });
    };

    const handleSaveProfile = async () => {
        if (!session?.user?.id) return;
        setIsUpdating(true);
        try {
            const skillsArray = editForm.skills
                ? editForm.skills.split(',').map(s => s.trim()).filter(s => s.length > 0)
                : [];

            const updates = {
                full_name: editForm.full_name,
                age: editForm.age ? parseInt(editForm.age, 10) : null,
                department: editForm.department,
                year: editForm.year,
                phone_number: editForm.phone_number,
                email_contact: editForm.email_contact,
                skills: skillsArray,
                availability: editForm.availability
            };

            const { error } = await supabase.from('profiles').update(updates).eq('id', session.user.id);
            if (error) throw error;

            setUserData({ ...userData, ...updates });
            setIsEditModalVisible(false);
        } catch (error: any) {
            Alert.alert('Save Failed', error.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const renderSkillChip = (skillName: string, index: number) => {
        const colorPalettes = [
            { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' },
            { bg: '#FAF5FF', text: '#9333EA', border: '#E9D5FF' },
            { bg: '#FFF7ED', text: '#EA580C', border: '#FED7AA' },
            { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
        ];
        const palette = colorPalettes[index % colorPalettes.length];

        return (
            <TouchableOpacity
                key={index}
                style={[styles.skillChip, { borderColor: palette.border, backgroundColor: palette.bg }]}
                onPress={() => setSelectedSkill(skillName)}
                activeOpacity={0.7}
            >
                <Text style={[styles.skillName, { color: palette.text }]}>{skillName}</Text>
            </TouchableOpacity>
        );
    };

    const renderHeatmap = (mapData: number[][], isInteractive: boolean = false) => {
        const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
        const times = ['Morning', 'Afternoon', 'Evening'];

        return (
            <View style={styles.heatmapWrapper}>
                <View style={styles.heatmapYAxis}>
                    {times.map((t, i) => <Text key={i} style={styles.heatmapLabelY}>{t}</Text>)}
                </View>
                <View style={styles.heatmapGrid}>
                    <View style={styles.heatmapHeaderRow}>
                        {days.map((d, i) => <Text key={i} style={styles.heatmapLabelX}>{d}</Text>)}
                    </View>
                    {[0, 1, 2].map((rowIndex) => (
                        <View key={rowIndex} style={styles.heatmapRow}>
                            {mapData.map((dayCol, colIndex) => {
                                const status = dayCol[rowIndex];
                                let color = '#EF4444'; // 0: Red
                                if (status === 1) color = '#EAB308'; // 1: Yellow
                                if (status === 2) color = '#22C55E'; // 2: Green

                                return isInteractive ? (
                                    <TouchableOpacity
                                        key={colIndex}
                                        style={[styles.heatmapCell, { backgroundColor: color }]}
                                        onPress={() => handleToggleHeatmapCell(colIndex, rowIndex)}
                                        activeOpacity={0.8}
                                    />
                                ) : (
                                    <View key={colIndex} style={[styles.heatmapCell, { backgroundColor: color }]} />
                                );
                            })}
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#E0E7FF', '#F3F4F6', '#EDE9FE']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* 1. Identity & Context */}
                    <BlurView intensity={80} tint="light" style={styles.glassCard}>
                        {!isGiverView && (
                            <TouchableOpacity style={styles.editIconWrapper} onPress={openEditModal} activeOpacity={0.7}>
                                <Edit2 size={20} color="#6B7280" />
                            </TouchableOpacity>
                        )}

                        <View style={styles.idCardHeader}>
                            <View style={[styles.avatarContainer, isLive && { borderColor: '#22C55E', borderWidth: 3 }]}>
                                <User size={45} color={isLive ? '#22C55E' : '#4F46E5'} />
                            </View>
                            <View style={styles.idCardInfo}>
                                <View style={styles.nameRow}>
                                    <Text style={styles.nameText}>
                                        {userData?.full_name || session?.user?.email?.split('@')[0] || 'Student Name'}
                                    </Text>
                                    <ShieldCheck size={18} color="#10B981" style={{ marginLeft: 6 }} />
                                </View>
                                <Text style={styles.verifiedText}>Verified Student</Text>

                                <View style={styles.contextRow}>
                                    <Text style={styles.contextText}>{userData?.age || '--'} y/o</Text>
                                    <Text style={styles.contextDivider}>•</Text>
                                    <Text style={styles.contextText} numberOfLines={1}>{userData?.department || 'Add Dept'}</Text>
                                </View>
                                <Text style={styles.contextText}>{userData?.year || 'Add Year'}</Text>
                            </View>
                        </View>

                        {!isGiverView && (
                            <View style={styles.liveToggleContainer}>
                                <View style={styles.liveToggleTextWrap}>
                                    <MapPin size={18} color={isLive ? '#22C55E' : '#6B7280'} />
                                    <Text style={[styles.liveToggleTitle, isLive && { color: '#22C55E' }]}>
                                        {isLive ? 'Available Now' : 'Offline'}
                                    </Text>
                                </View>
                                <Switch
                                    trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                                    thumbColor={isLive ? '#22C55E' : '#F9FAFB'}
                                    ios_backgroundColor="#D1D5DB"
                                    onValueChange={handleToggleLive}
                                    value={isLive}
                                    disabled={isUpdating}
                                />
                            </View>
                        )}
                    </BlurView>

                    {/* 1.5. Verified Contact Info */}
                    <BlurView intensity={80} tint="light" style={styles.glassCard}>
                        <View style={styles.sectionHeader}>
                            <ShieldCheck size={22} color="#10B981" />
                            <Text style={styles.sectionTitle}>Verified Contact</Text>
                        </View>
                        <Text style={{ fontSize: 14, color: '#4B5563', marginBottom: 4 }}>📞 {userData?.phone_number || 'Not provided'}</Text>
                        <Text style={{ fontSize: 14, color: '#4B5563' }}>✉️ {userData?.email_contact || 'Not provided'}</Text>
                        <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>Only visible to collaborators on active tasks.</Text>
                    </BlurView>

                    {/* 2. Trust Meter (Pruned Version) */}
                    <View style={styles.trustGrid}>
                        <BlurView intensity={80} tint="light" style={[styles.glassCard, styles.trustBox]}>
                            <View style={styles.trustHeader}>
                                <Star size={20} color="#F59E0B" fill="#F59E0B" />
                                <Text style={styles.trustTitle}>Rating</Text>
                            </View>
                            <Text style={styles.ratingNumber}>{avgRating}</Text>
                            <Text style={styles.ratingSub}>{totalReviews} tasks</Text>
                        </BlurView>

                        <BlurView intensity={80} tint="light" style={[styles.glassCard, styles.trustBox]}>
                            <View style={styles.trustHeader}>
                                <AlertCircle size={20} color="#EF4444" />
                                <Text style={styles.trustTitle}>Strikes</Text>
                            </View>
                            <View style={styles.strikeMeter}>
                                {[1, 2, 3].map((slot) => (
                                    <View key={slot} style={[styles.strikeSlot, (userData?.strikes || 0) >= slot && styles.strikeFilled]} />
                                ))}
                            </View>
                            <TouchableOpacity onPress={() => Alert.alert("Strike System", "Users with 3 strikes are suspended.")}>
                                <Text style={styles.trustSubLink}>What is this?</Text>
                            </TouchableOpacity>
                        </BlurView>
                    </View>

                    {/* 3. Skill Cloud */}
                    <BlurView intensity={80} tint="light" style={styles.glassCard}>
                        <View style={styles.sectionHeader}>
                            <Zap size={22} color="#4F46E5" />
                            <Text style={styles.sectionTitle}>Expertise & Abilities</Text>
                        </View>
                        <View style={styles.skillsCloud}>
                            {userData?.skills && userData.skills.length > 0 ? (
                                userData.skills.map((skill: string, idx: number) => renderSkillChip(skill, idx))
                            ) : (
                                <Text style={styles.emptyText}>No skills added yet. Tap Edit to add some!</Text>
                            )}
                        </View>
                    </BlurView>

                    {/* 4. The Weekly Availability Heatmap */}
                    <BlurView intensity={80} tint="light" style={styles.glassCard}>
                        <View style={styles.sectionHeader}>
                            <Clock size={22} color="#10B981" />
                            <Text style={styles.sectionTitle}>Weekly Availability</Text>
                        </View>
                        <View style={styles.heatmapLegend}>
                            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} /><Text style={styles.legendText}>Free</Text></View>
                            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#EAB308' }]} /><Text style={styles.legendText}>Flexible</Text></View>
                            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} /><Text style={styles.legendText}>Busy</Text></View>
                        </View>
                        {renderHeatmap(userData?.availability || MOCK_DATA.heatmap, false)}
                    </BlurView>

                    {/* 5. Past Tasks */}
                    <BlurView intensity={80} tint="light" style={styles.glassCard}>
                        <View style={styles.sectionHeader}>
                            <CheckCircle2 size={22} color="#3B82F6" />
                            <Text style={styles.sectionTitle}>Recent Reviews</Text>
                        </View>
                        {recentReviews.length > 0 ? recentReviews.map((rev, index) => (
                            <View key={rev.id} style={[styles.reviewItem, index !== recentReviews.length - 1 && styles.borderBottom]}>
                                <View style={styles.reviewHeaderRow}>
                                    <Text style={styles.reviewTaskName} numberOfLines={1}>
                                        {rev.tasks?.title || 'Campus Task'}
                                    </Text>
                                    <View style={styles.reviewRatingWrap}>
                                        <Star size={14} color="#F59E0B" fill="#F59E0B" />
                                        <Text style={styles.reviewRatingText}>{rev.rating}</Text>
                                    </View>
                                </View>
                                <Text style={styles.reviewSnippet}>"{rev.comment}"</Text>
                            </View>
                        )) : <Text style={styles.emptyText}>No reviews yet.</Text>}
                    </BlurView>

                    {/* Action Center */}
                    <TouchableOpacity style={isGiverView ? styles.handpickButton : styles.logoutButton} onPress={isGiverView ? undefined : signOut} activeOpacity={0.8}>
                        {!isGiverView && <LogOut size={20} color="#FFFFFF" style={{ marginRight: 8 }} />}
                        <Text style={isGiverView ? styles.handpickButtonText : styles.logoutButtonText}>
                            {isGiverView ? "Handpick This Student" : "Disconnect & Log Out"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.devToggle} onPress={() => setIsGiverView(!isGiverView)} activeOpacity={0.8}>
                        <Text style={styles.devToggleText}>[Dev Tool] Switch to {isGiverView ? "Student" : "Giver"} View</Text>
                    </TouchableOpacity>

                </ScrollView>
            </SafeAreaView>

            {/* ---------------- Edit Profile Modal ---------------- */}
            <Modal visible={isEditModalVisible} animationType="slide" transparent onRequestClose={() => setIsEditModalVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <BlurView intensity={90} tint="light" style={StyleSheet.absoluteFill} />
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Profile</Text>
                            <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                                <Text style={styles.modalCloseText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.inputLabel}>Full Name</Text>
                            <TextInput style={styles.textInput} placeholder="E.g. Jane Doe" placeholderTextColor="#9CA3AF" value={editForm.full_name} onChangeText={(text) => setEditForm({ ...editForm, full_name: text })} />

                            <Text style={styles.inputLabel}>Phone Number</Text>
                            <TextInput style={styles.textInput} placeholder="+1 (555) 000-0000" keyboardType="phone-pad" value={editForm.phone_number} onChangeText={(text) => setEditForm({ ...editForm, phone_number: text })} />

                            <Text style={styles.inputLabel}>Email Address</Text>
                            <TextInput style={styles.textInput} placeholder="your.email@example.com" keyboardType="email-address" autoCapitalize="none" value={editForm.email_contact} onChangeText={(text) => setEditForm({ ...editForm, email_contact: text })} />

                            <View style={styles.modalRow}>
                                <View style={{ flex: 1, marginRight: 8 }}>
                                    <Text style={styles.inputLabel}>Age</Text>
                                    <TextInput style={styles.textInput} placeholder="21" keyboardType="numeric" value={editForm.age} onChangeText={(text) => setEditForm({ ...editForm, age: text })} />
                                </View>
                                <View style={{ flex: 1, marginLeft: 8 }}>
                                    <Text style={styles.inputLabel}>Year</Text>
                                    <TextInput style={styles.textInput} placeholder="3rd Year" value={editForm.year} onChangeText={(text) => setEditForm({ ...editForm, year: text })} />
                                </View>
                            </View>

                            <Text style={styles.inputLabel}>Department</Text>
                            <TextInput style={styles.textInput} placeholder="Computer Science" value={editForm.department} onChangeText={(text) => setEditForm({ ...editForm, department: text })} />

                            <Text style={styles.inputLabel}>Skills (comma separated)</Text>
                            <TextInput style={[styles.textInput, { height: 80 }]} placeholder="React, Delivery, Excel" multiline numberOfLines={3} value={editForm.skills} onChangeText={(text) => setEditForm({ ...editForm, skills: text })} />

                            <Text style={[styles.inputLabel, { marginTop: 24 }]}>Weekly Schedule (Tap cells to toggle)</Text>
                            <View style={{ marginBottom: 16 }}>
                                <View style={styles.heatmapLegend}>
                                    <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} /><Text style={styles.legendText}>Free</Text></View>
                                    <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#EAB308' }]} /><Text style={styles.legendText}>Flexible</Text></View>
                                    <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} /><Text style={styles.legendText}>Busy</Text></View>
                                </View>
                                {renderHeatmap(editForm.availability, true)}
                            </View>

                            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile} disabled={isUpdating}>
                                <Text style={styles.saveButtonText}>{isUpdating ? 'Saving...' : 'Save Profile'}</Text>
                            </TouchableOpacity>
                            {/* Extra padding for scroll padding */}
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* ---------------- Achievement Portfolio Modal ---------------- */}
            <AchievementModal
                isVisible={!!selectedSkill}
                onClose={() => setSelectedSkill(null)}
                skill={selectedSkill || ''}
                userId={session?.user?.id || ''}
                isOwner={!isGiverView} // Can add achievements if viewing their own profile
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 40 },
    glassCard: { backgroundColor: 'rgba(255, 255, 255, 0.65)', borderRadius: 24, padding: 20, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.8)' },
    editIconWrapper: { position: 'absolute', top: 16, right: 16, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.7)', padding: 8, borderRadius: 20 },
    idCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    avatarContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 16, borderWidth: 1, borderColor: '#E5E7EB' },
    idCardInfo: { flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center' },
    nameText: { fontSize: 22, fontWeight: '800', color: '#111827' },
    verifiedText: { fontSize: 13, color: '#10B981', fontWeight: '700', marginTop: 2, marginBottom: 6 },
    contextRow: { flexDirection: 'row', alignItems: 'center' },
    contextText: { fontSize: 13, color: '#4B5563', fontWeight: '500' },
    contextDivider: { marginHorizontal: 6, color: '#9CA3AF' },
    liveToggleContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.7)', padding: 12, borderRadius: 16, marginTop: 8 },
    liveToggleTextWrap: { flexDirection: 'row', alignItems: 'center' },
    liveToggleTitle: { fontSize: 16, fontWeight: '700', marginLeft: 8, color: '#374151' },
    trustGrid: { flexDirection: 'row', justifyContent: 'center', marginBottom: 16, marginHorizontal: -4 },
    trustBox: { flex: 1, padding: 12, marginBottom: 0, marginHorizontal: 4, alignItems: 'center' },
    trustHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    trustTitle: { fontSize: 12, fontWeight: '700', color: '#4B5563', marginLeft: 4 },
    ratingNumber: { fontSize: 24, fontWeight: '900', color: '#111827' },
    ratingSub: { fontSize: 11, color: '#6B7280', marginTop: 2, fontWeight: '500' },
    strikeMeter: { flexDirection: 'row', gap: 4, marginVertical: 6 },
    strikeSlot: { width: 16, height: 6, backgroundColor: '#E5E7EB', borderRadius: 3 },
    strikeFilled: { backgroundColor: '#EF4444' },
    trustSubLink: { fontSize: 10, color: '#6366F1', fontWeight: '600', marginTop: 4, textDecorationLine: 'underline' },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginLeft: 8 },
    skillsCloud: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    skillChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    skillName: { fontSize: 14, fontWeight: '700' },
    emptyText: { fontSize: 14, color: '#6B7280', fontStyle: 'italic' },
    heatmapLegend: { flexDirection: 'row', marginBottom: 12, gap: 12 },
    legendItem: { flexDirection: 'row', alignItems: 'center' },
    legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    legendText: { fontSize: 12, color: '#4B5563', fontWeight: '600' },
    heatmapWrapper: { flexDirection: 'row', marginTop: 4 },
    heatmapYAxis: { justifyContent: 'space-around', paddingRight: 8, paddingTop: 24 },
    heatmapLabelY: { fontSize: 10, color: '#6B7280', fontWeight: '600' },
    heatmapGrid: { flex: 1 },
    heatmapHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 4 },
    heatmapLabelX: { fontSize: 11, color: '#4B5563', fontWeight: '700', width: 24, textAlign: 'center' },
    heatmapRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    heatmapCell: { width: 30, height: 24, borderRadius: 6, backgroundColor: '#E5E7EB' },
    reviewItem: { paddingVertical: 12 },
    borderBottom: { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    reviewHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    reviewTaskName: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1F2937' },
    reviewRatingWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginLeft: 8 },
    reviewRatingText: { fontSize: 12, fontWeight: '800', color: '#B45309', marginLeft: 4 },
    reviewSnippet: { fontSize: 13, color: '#4B5563', fontStyle: 'italic', marginTop: 4 },
    handpickButton: { backgroundColor: '#111827', paddingVertical: 18, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 6, marginTop: 10 },
    handpickButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
    logoutButton: { flexDirection: 'row', backgroundColor: '#EF4444', paddingVertical: 18, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#EF4444', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 6, marginTop: 10 },
    logoutButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
    devToggle: { marginTop: 24, alignSelf: 'center', padding: 8 },
    devToggleText: { fontSize: 12, color: '#9CA3AF', textDecorationLine: 'underline' },
    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
    modalCloseText: { fontSize: 16, color: '#6B7280', fontWeight: '600' },
    inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 12 },
    textInput: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, padding: 14, fontSize: 16, color: '#111827' },
    modalRow: { flexDirection: 'row', justifyContent: 'space-between' },
    saveButton: { backgroundColor: '#4F46E5', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 24, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }
});
