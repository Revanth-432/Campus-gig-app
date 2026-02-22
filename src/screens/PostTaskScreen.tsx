import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Laptop, Zap, Users, Clock, Calendar } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const CAMPUS_LOCATIONS = [
    'B-Block', 'C-Block', 'D-Block', 'E-Block', 'PG-Block',
    'SAC Stage', 'Bike Parking', 'PEB Canteen', 'Bus Parking',
    'Basketball Court', 'VNR Circle', 'Main Gate', 'Hostel Mess'
];

export default function PostTaskScreen() {
    const { session } = useAuth();
    const navigation = useNavigation<any>();

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'on_campus' | 'online'>('on_campus');
    const [verification, setVerification] = useState<'instant' | 'handpick'>('instant');
    const [location, setLocation] = useState(CAMPUS_LOCATIONS[0]);
    const [skills, setSkills] = useState<string[]>([]);

    // New Fields matching original spec
    const [urgency, setUrgency] = useState<'immediate' | 'feasible'>('feasible');
    const [deadlineDate, setDeadlineDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const [minBonus, setMinBonus] = useState('');
    const [maxBonus, setMaxBonus] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handlePostTask = async () => {
        // 1. Validation
        if (!title.trim() || !description.trim() || !amount.trim()) {
            Alert.alert('Missing Fields', 'Please fill in the title, description, and compensation amount.');
            return;
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid monetary amount greater than 0.');
            return;
        }

        if (type === 'on_campus' && !location.trim()) {
            Alert.alert('Missing Location', 'Please specify a campus location.');
            return;
        }

        if (!session?.user?.id) {
            Alert.alert('Not Authenticated', 'You must be logged in to post a task.');
            return;
        }

        setIsSubmitting(true);

        try {
            // 2. Prepare Data
            const skillsArray = type === 'online' && skills.length > 0
                ? skills
                : null;

            const newTask = {
                creator_id: session.user.id,
                title: title.trim(),
                description: description.trim(),
                amount: parsedAmount,
                type: type,
                verification: verification,
                location: type === 'on_campus' ? location.trim() : null,
                skills: type === 'online' ? skillsArray : null,
                deadline: deadlineDate.toISOString(),
                status: 'open',
                urgency: urgency,
                min_bonus: minBonus ? parseFloat(minBonus) : null,
                max_bonus: maxBonus ? parseFloat(maxBonus) : null,
            };

            // 3. Insert into Supabase
            const { error } = await supabase
                .from('tasks')
                .insert([newTask]);

            if (error) throw error;

            // 4. Success handling & Routing
            Alert.alert('Success!', 'Your task has been posted to the campus board.', [
                {
                    text: 'Awesome',
                    onPress: () => {
                        // Reset form
                        setTitle('');
                        setDescription('');
                        setAmount('');
                        setType('on_campus');
                        setVerification('instant');
                        setLocation('');
                        setSkills([]);
                        setUrgency('feasible');
                        setDeadlineDate(new Date());
                        setMinBonus('');
                        setMaxBonus('');
                        // Route back
                        navigation.navigate('Dashboard');
                    }
                }
            ]);

        } catch (error: any) {
            console.error('Post task error:', error);
            Alert.alert('Error', error.message || 'Could not post the task. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleSkill = (skill: string) => {
        setSkills(prev =>
            prev.includes(skill)
                ? prev.filter(s => s !== skill)
                : [...prev, skill]
        );
    };

    const PRESET_SKILLS = ['Editor', 'Coder', 'Artist', 'Writer', 'Runner', 'Presenter', 'Designer', 'Tutor'];

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setDeadlineDate(selectedDate);
        }
    };

    const onTimeChange = (event: any, selectedTime?: Date) => {
        setShowTimePicker(Platform.OS === 'ios');
        if (selectedTime) {
            const newDate = new Date(deadlineDate);
            newDate.setHours(selectedTime.getHours());
            newDate.setMinutes(selectedTime.getMinutes());
            setDeadlineDate(newDate);
        }
    };

    // Dynamic Theme Variables
    const isOnline = type === 'online';
    const activeGradient = isOnline
        ? ['#0F172A', '#1E293B', '#334155'] as const
        : ['#EFF6FF', '#DBEAFE', '#BFDBFE'] as const;
    const activeBlurTint = isOnline ? 'dark' : 'light';
    const activeTextColor = isOnline ? '#F8FAFC' : '#111827';
    const activeSubTextColor = isOnline ? '#94A3B8' : '#6B7280';
    const activeGlassBg = isOnline ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.65)';
    const activeGlassBorder = isOnline ? '#334155' : 'rgba(255, 255, 255, 0.8)';
    const activeInputBg = isOnline ? '#1E293B' : '#FFFFFF';
    const activeInputBorder = isOnline ? '#334155' : 'rgba(255, 255, 255, 0.9)';
    const activeSegmentBg = isOnline ? 'rgba(15, 23, 42, 0.5)' : 'rgba(229, 231, 235, 0.5)';
    const activeSegmentActiveBg = isOnline ? '#334155' : '#FFFFFF';
    const accentColor = isOnline ? '#A855F7' : '#3B82F6'; // Electric Purple vs Vivid Blue

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={activeGradient}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    style={styles.keyboardView}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.header}>
                            <Text style={[styles.headerTitle, { color: activeTextColor }]}>Create a Task</Text>
                            <Text style={[styles.headerSubtitle, { color: activeSubTextColor }]}>Get help from verified students on campus.</Text>
                        </View>

                        {/* Glassmorphism Form Container */}
                        <BlurView
                            intensity={isOnline ? 40 : 80}
                            tint={activeBlurTint}
                            style={[
                                styles.glassCard,
                                { backgroundColor: activeGlassBg, borderColor: activeGlassBorder }
                            ]}
                        >

                            {/* Form Fields */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: activeTextColor }]}>Task Title</Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        { backgroundColor: activeInputBg, borderColor: activeInputBorder, color: activeTextColor }
                                    ]}
                                    placeholder="E.g. Coffee Run to Library"
                                    placeholderTextColor={activeSubTextColor}
                                    value={title}
                                    onChangeText={setTitle}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: activeTextColor }]}>Description</Text>
                                <TextInput
                                    style={[
                                        styles.input, styles.textArea,
                                        { backgroundColor: activeInputBg, borderColor: activeInputBorder, color: activeTextColor }
                                    ]}
                                    placeholder="Describe what you need help with in detail..."
                                    placeholderTextColor={activeSubTextColor}
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                    value={description}
                                    onChangeText={setDescription}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: activeTextColor }]}>Compensation (rupees)</Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        { backgroundColor: activeInputBg, borderColor: activeInputBorder, color: activeTextColor }
                                    ]}
                                    placeholder="e.g., 200"
                                    placeholderTextColor={activeSubTextColor}
                                    keyboardType="decimal-pad"
                                    value={amount}
                                    onChangeText={setAmount}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: activeTextColor }]}>Performance Bonus Range (optional)</Text>
                                <Text style={[styles.helperText, { marginTop: 0, marginBottom: 12, marginLeft: 4, color: activeSubTextColor }]}>
                                    Offer extra compensation based on quality. Students see this as an incentive.
                                </Text>
                                <View style={styles.row}>
                                    <TextInput
                                        style={[
                                            styles.input, { flex: 1, marginRight: 8 },
                                            { backgroundColor: activeInputBg, borderColor: activeInputBorder, color: activeTextColor }
                                        ]}
                                        placeholder="Min bonus"
                                        placeholderTextColor={activeSubTextColor}
                                        keyboardType="decimal-pad"
                                        value={minBonus}
                                        onChangeText={setMinBonus}
                                    />
                                    <TextInput
                                        style={[
                                            styles.input, { flex: 1, marginLeft: 8 },
                                            { backgroundColor: activeInputBg, borderColor: activeInputBorder, color: activeTextColor }
                                        ]}
                                        placeholder="Max bonus"
                                        placeholderTextColor={activeSubTextColor}
                                        keyboardType="decimal-pad"
                                        value={maxBonus}
                                        onChangeText={setMaxBonus}
                                    />
                                </View>
                            </View>

                            {/* Type Segmented Control */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: activeTextColor }]}>Task Vibe</Text>
                                <View style={[styles.segmentedControl, { backgroundColor: activeSegmentBg }]}>
                                    <TouchableOpacity
                                        style={[
                                            styles.segmentButton,
                                            type === 'on_campus' && [styles.segmentActive, { backgroundColor: activeSegmentActiveBg }]
                                        ]}
                                        onPress={() => setType('on_campus')}
                                        activeOpacity={0.8}
                                    >
                                        <MapPin size={18} color={type === 'on_campus' ? accentColor : activeSubTextColor} />
                                        <Text style={[
                                            styles.segmentText, { color: activeSubTextColor },
                                            type === 'on_campus' && { color: accentColor, fontWeight: '700' }
                                        ]}>
                                            On Campus
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.segmentButton,
                                            type === 'online' && [styles.segmentActive, { backgroundColor: activeSegmentActiveBg }]
                                        ]}
                                        onPress={() => setType('online')}
                                        activeOpacity={0.8}
                                    >
                                        <Laptop size={18} color={type === 'online' ? accentColor : activeSubTextColor} />
                                        <Text style={[
                                            styles.segmentText, { color: activeSubTextColor },
                                            type === 'online' && { color: accentColor, fontWeight: '700' }
                                        ]}>
                                            Online
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {type === 'on_campus' ? (
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: activeTextColor }]}>Specific Campus Location</Text>
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        style={{ marginTop: 4, marginHorizontal: -24 }}
                                        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 4, gap: 10 }}
                                    >
                                        {CAMPUS_LOCATIONS.map(loc => {
                                            const isSelected = location === loc;
                                            return (
                                                <TouchableOpacity
                                                    key={loc}
                                                    activeOpacity={0.8}
                                                    onPress={() => setLocation(loc)}
                                                    style={[
                                                        styles.locationPill,
                                                        { backgroundColor: 'rgba(243, 244, 246, 0.5)', borderColor: activeInputBorder },
                                                        isSelected && { backgroundColor: accentColor, borderColor: accentColor }
                                                    ]}
                                                >
                                                    <Text style={[
                                                        styles.locationPillText, { color: activeSubTextColor },
                                                        isSelected && { color: '#FFFFFF', fontWeight: '800' }
                                                    ]}>
                                                        {loc}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>
                                </View>
                            ) : (
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: activeTextColor }]}>Skills Required</Text>
                                    <View style={styles.skillsGrid}>
                                        {PRESET_SKILLS.map(skill => {
                                            const isActive = skills.includes(skill);
                                            return (
                                                <TouchableOpacity
                                                    key={skill}
                                                    activeOpacity={0.8}
                                                    onPress={() => toggleSkill(skill)}
                                                    style={[
                                                        styles.skillPill,
                                                        { backgroundColor: isOnline ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255,255,255,0.7)', borderColor: activeInputBorder },
                                                        isActive && { backgroundColor: accentColor, borderColor: accentColor }
                                                    ]}
                                                >
                                                    <Text style={[
                                                        styles.skillPillText, { color: activeSubTextColor },
                                                        isActive && { color: '#FFFFFF' }
                                                    ]}>
                                                        {skill}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            )}

                            {/* Urgency Segmented Control */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: activeTextColor }]}>Urgency</Text>
                                <View style={[styles.segmentedControl, { backgroundColor: activeSegmentBg }]}>
                                    <TouchableOpacity
                                        style={[
                                            styles.segmentButton,
                                            urgency === 'immediate' && [styles.segmentActive, { backgroundColor: activeSegmentActiveBg }]
                                        ]}
                                        onPress={() => {
                                            setUrgency('immediate');
                                            // Lock date to today, but allow time choice
                                            setDeadlineDate(new Date());
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        <Zap size={18} color={urgency === 'immediate' ? '#10B981' : activeSubTextColor} />
                                        <Text style={[
                                            styles.segmentText, { color: activeSubTextColor },
                                            urgency === 'immediate' && { color: '#10B981', fontWeight: '700' }
                                        ]}>
                                            Immediate
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.segmentButton,
                                            urgency === 'feasible' && [styles.segmentActive, { backgroundColor: activeSegmentActiveBg }]
                                        ]}
                                        onPress={() => setUrgency('feasible')}
                                        activeOpacity={0.8}
                                    >
                                        <Clock size={18} color={urgency === 'feasible' ? '#10B981' : activeSubTextColor} />
                                        <Text style={[
                                            styles.segmentText, { color: activeSubTextColor },
                                            urgency === 'feasible' && { color: '#10B981', fontWeight: '700' }
                                        ]}>
                                            Feasible
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Dynamic Deadline Picker rendering beneath urgency */}
                                <View style={styles.dateTimeContainer}>
                                    <View style={{ flex: 1, marginRight: 8, opacity: urgency === 'immediate' ? 0.5 : 1 }}>
                                        <Text style={[styles.dateTimeLabel, { color: activeSubTextColor }]}>Date</Text>
                                        <TouchableOpacity
                                            disabled={urgency === 'immediate'}
                                            style={[styles.dateTimeButton, { backgroundColor: activeInputBg, borderColor: activeInputBorder }]}
                                            onPress={() => setShowDatePicker(true)}>
                                            <Calendar size={16} color={accentColor} style={{ marginRight: 6 }} />
                                            <Text style={[styles.dateTimeText, { color: activeTextColor }]}>{deadlineDate.toLocaleDateString()}</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <View style={{ flex: 1, marginLeft: 8 }}>
                                        <Text style={[styles.dateTimeLabel, { color: activeSubTextColor }]}>Time</Text>
                                        <TouchableOpacity
                                            style={[styles.dateTimeButton, { backgroundColor: activeInputBg, borderColor: activeInputBorder }]}
                                            onPress={() => setShowTimePicker(true)}>
                                            <Clock size={16} color={accentColor} style={{ marginRight: 6 }} />
                                            <Text style={[styles.dateTimeText, { color: activeTextColor }]}>
                                                {deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {showDatePicker && (
                                    <DateTimePicker
                                        value={deadlineDate}
                                        mode="date"
                                        display="default"
                                        onChange={onDateChange}
                                        minimumDate={new Date()}
                                    />
                                )}
                                {showTimePicker && (
                                    <DateTimePicker
                                        value={deadlineDate}
                                        mode="time"
                                        display="default"
                                        onChange={onTimeChange}
                                    />
                                )}

                            </View>

                            {/* Verification Segmented Control */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: activeTextColor }]}>Worker Selection</Text>
                                <View style={[styles.segmentedControl, { backgroundColor: activeSegmentBg }]}>
                                    <TouchableOpacity
                                        style={[
                                            styles.segmentButton,
                                            verification === 'instant' && [styles.segmentActive, { backgroundColor: activeSegmentActiveBg }]
                                        ]}
                                        onPress={() => setVerification('instant')}
                                        activeOpacity={0.8}
                                    >
                                        <Zap size={18} color={verification === 'instant' ? accentColor : activeSubTextColor} />
                                        <Text style={[
                                            styles.segmentText, { color: activeSubTextColor },
                                            verification === 'instant' && { color: accentColor, fontWeight: '700' }
                                        ]}>
                                            1-Step (Instant)
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.segmentButton,
                                            verification === 'handpick' && [styles.segmentActive, { backgroundColor: activeSegmentActiveBg }]
                                        ]}
                                        onPress={() => setVerification('handpick')}
                                        activeOpacity={0.8}
                                    >
                                        <Users size={18} color={verification === 'handpick' ? accentColor : activeSubTextColor} />
                                        <Text style={[
                                            styles.segmentText, { color: activeSubTextColor },
                                            verification === 'handpick' && { color: accentColor, fontWeight: '700' }
                                        ]}>
                                            2-Step (Review)
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <Text style={[styles.helperText, { color: activeSubTextColor }]}>
                                    {verification === 'instant'
                                        ? 'Anyone can claim and start immediately.'
                                        : 'Review and approve applicants before they start.'}
                                </Text>
                            </View>

                        </BlurView>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handlePostTask}
                            disabled={isSubmitting}
                            activeOpacity={0.8}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.submitButtonText}>Post Task to Board</Text>
                            )}
                        </TouchableOpacity>

                    </ScrollView>
                </KeyboardAvoidingView>
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
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 24,
        marginTop: 10,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: '#111827',
        marginBottom: 6,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
    },
    glassCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.65)',
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#111827',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    textArea: {
        height: 100,
    },
    segmentedControl: {
        flexDirection: 'row',
        backgroundColor: 'rgba(229, 231, 235, 0.5)', // slightly transparent gray
        borderRadius: 14,
        padding: 4,
    },
    segmentButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 10,
    },
    segmentActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    segmentText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginLeft: 6,
    },
    segmentTextActive: {
        color: '#4F46E5',
        fontWeight: '700',
    },
    helperText: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 8,
        marginLeft: 4,
        fontStyle: 'italic',
    },
    submitButton: {
        backgroundColor: '#14b8a6', // Cyber Teal glowing button
        borderRadius: 16,
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#14b8a6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.6,
        shadowRadius: 16,
        elevation: 10,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    skillsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 4,
    },
    skillPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    skillPillActive: {
        backgroundColor: '#4F46E5',
        borderColor: '#4F46E5',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    skillPillText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
    },
    skillPillTextActive: {
        color: '#FFFFFF',
    },
    dateTimeContainer: {
        flexDirection: 'row',
        marginTop: 16,
        justifyContent: 'space-between',
    },
    dateTimeLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 6,
        marginLeft: 4,
    },
    dateTimeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    dateTimeText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
    },
    locationPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
    },
    locationPillText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
