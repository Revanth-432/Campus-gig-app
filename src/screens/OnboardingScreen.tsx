import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Animated,
    Dimensions,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ChevronRight, ChevronLeft, GraduationCap, Clock, CheckCircle2, User, Sparkles } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Masters', 'PhD'];
const DEPARTMENTS = ['CSE', 'ECE', 'EEE', 'Mechanical', 'Civil', 'IT', 'AI/ML', 'Business', 'Design', 'Other'];
const SKILLS = [
    'Coder', 'Designer', 'Writer', 'Tutor', 'Video Editor',
    'Event Helper', 'Photographer', 'Marketing', 'Data Entry', 'Other'
];

export default function OnboardingScreen({ navigation }: any) {
    const { session, setIsOnboarded } = useAuth();
    const insets = useSafeAreaInsets();

    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const slideAnim = useRef(new Animated.Value(0)).current;

    // Form Data
    const [fullName, setFullName] = useState('');
    const [age, setAge] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [year, setYear] = useState('');
    const [department, setDepartment] = useState('');
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

    useEffect(() => {
        Animated.spring(slideAnim, {
            toValue: -(step - 1) * width,
            useNativeDriver: true,
            friction: 8,
            tension: 40
        }).start();
    }, [step]);

    const handleNext = () => {
        if (step === 1 && (!fullName || !age || !email || !phone)) return Alert.alert('Missing Info', 'Please fill in all basic details including email and phone number.');
        if (step === 2 && (!year || !department)) return Alert.alert('Missing Info', 'Please select your year and department.');
        if (step === 3 && selectedSkills.length === 0) return Alert.alert('Missing Info', 'Please select at least one skill.');

        if (step < 4) { // Now 4 is the final step (Finalize)
            setStep(prev => prev + 1);
        } else { // If step is 4 (Finalize), then submit
            submitProfile();
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(prev => prev - 1);
        }
    };

    const toggleSkill = (skill: string) => {
        setSelectedSkills(prev =>
            prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
        );
    };

    const submitProfile = async () => {
        if (!session?.user?.id) return;
        setIsSubmitting(true);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName.trim(),
                    age: parseInt(age),
                    email_contact: email.trim(),
                    phone_number: phone.trim(),
                    year: year,
                    department: department,
                    skills: selectedSkills,
                    onboarded: true
                })
                .eq('id', session.user.id);

            if (error) throw error;

            // Trigger AuthContext to instantly unlock the app
            setIsOnboarded(true);
        } catch (error: any) {
            Alert.alert('Error completing profile', error.message);
            setIsSubmitting(false);
        }
    };

    const renderProgressBar = () => {
        const progress = (step / 4) * 100; // Total steps are now 4
        return (
            <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <LinearGradient
                colors={['#F8FAFC', '#EFF6FF', '#EEF2FF']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <View style={[styles.header, { marginTop: insets.top + 20 }]}>
                {step > 1 && (
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <ChevronLeft size={24} color="#64748B" />
                    </TouchableOpacity>
                )}
                <Text style={styles.headerTitle}>Step {step} of 4</Text>
                {renderProgressBar()}
            </View>

            <Animated.View style={[styles.slider, { transform: [{ translateX: slideAnim }] }]}>

                {/* STEP 1: Basic Bio */}
                <View style={styles.slide}>
                    <BlurView intensity={80} tint="light" style={styles.card}>
                        <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
                            <View style={styles.iconCircle}>
                                <User size={32} color="#4F46E5" />
                            </View>
                            <Text style={styles.title}>Welcome to CampusGig! ⚡</Text>
                            <Text style={styles.subtitle}>Let's get your profile set up so you can start earning and posting tasks.</Text>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Full Name</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="John Doe"
                                    placeholderTextColor="#94A3B8"
                                    value={fullName}
                                    onChangeText={setFullName}
                                    autoCapitalize="words"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Age</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="20"
                                    placeholderTextColor="#94A3B8"
                                    value={age}
                                    onChangeText={setAge}
                                    keyboardType="numeric"
                                    maxLength={2}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Email Address</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="your.email@example.com"
                                    placeholderTextColor="#94A3B8"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Phone Number</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="+1 (555) 000-0000"
                                    placeholderTextColor="#94A3B8"
                                    value={phone}
                                    onChangeText={setPhone}
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </ScrollView>
                    </BlurView>
                </View>

                {/* STEP 2: Academic Info */}
                <View style={styles.slide}>
                    <BlurView intensity={80} tint="light" style={styles.card}>
                        <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
                            <View style={styles.iconCircle}>
                                <GraduationCap size={32} color="#4F46E5" />
                            </View>
                            <Text style={styles.title}>Academic Status 🎓</Text>
                            <Text style={styles.subtitle}>Help others know your academic level to match relevant gigs.</Text>

                            <Text style={[styles.label, { marginTop: 20 }]}>Year of Study</Text>
                            <View style={styles.pillContainer}>
                                {YEARS.map(y => (
                                    <TouchableOpacity
                                        key={y}
                                        style={[styles.pill, year === y && styles.pillActive]}
                                        onPress={() => setYear(y)}
                                    >
                                        <Text style={[styles.pillText, year === y && styles.pillTextActive]}>{y}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={[styles.label, { marginTop: 20 }]}>Department</Text>
                            <View style={styles.pillContainer}>
                                {DEPARTMENTS.map(d => (
                                    <TouchableOpacity
                                        key={d}
                                        style={[styles.pill, department === d && styles.pillActive]}
                                        onPress={() => setDepartment(d)}
                                    >
                                        <Text style={[styles.pillText, department === d && styles.pillTextActive]}>{d}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </BlurView>
                </View>

                {/* STEP 3: Expertise */}
                <View style={styles.slide}>
                    <BlurView intensity={80} tint="light" style={styles.card}>
                        <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
                            <View style={styles.iconCircle}>
                                <Sparkles size={32} color="#4F46E5" />
                            </View>
                            <Text style={styles.title}>Your Expertise ⚡</Text>
                            <Text style={styles.subtitle}>Select the skills you possess. This determines the tasks you see in your feed.</Text>

                            <View style={[styles.pillContainer, { marginTop: 20 }]}>
                                {SKILLS.map(skill => {
                                    const isSelected = selectedSkills.includes(skill);
                                    return (
                                        <TouchableOpacity
                                            key={skill}
                                            style={[styles.pill, isSelected && styles.pillActive]}
                                            onPress={() => toggleSkill(skill)}
                                        >
                                            <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>{skill}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </ScrollView>
                    </BlurView>
                </View>

                {/* STEP 4: Finalize */}
                <View style={styles.slide}>
                    <BlurView intensity={80} tint="light" style={styles.card}>
                        <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
                            <View style={styles.iconCircle}>
                                <CheckCircle2 size={32} color="#10B981" />
                            </View>
                            <Text style={styles.title}>All Set! 🎉</Text>
                            <Text style={styles.subtitle}>Your profile is fully configured. You are ready to start exploring the campus task board.</Text>

                            <View style={styles.summaryBox}>
                                <Text style={styles.summaryTitle}>{fullName}</Text>
                                <Text style={styles.summaryText}>{year} • {department}</Text>
                                <Text style={styles.summaryText}>{selectedSkills.length} Skills Added</Text>
                            </View>
                        </ScrollView>
                    </BlurView>
                </View>

            </Animated.View>

            {/* Bottom Navigation */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <TouchableOpacity
                    style={styles.nextButton}
                    onPress={handleNext}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Text style={styles.nextButtonText}>
                                {step === 4 ? "Start Earning" : "Continue"}
                            </Text>
                            {step < 4 && <ChevronRight size={20} color="#FFF" />}
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 24,
        paddingBottom: 20,
        zIndex: 10,
    },
    backButton: {
        position: 'absolute',
        left: 20,
        top: -4,
        padding: 4,
        zIndex: 20,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 16,
    },
    progressContainer: {
        height: 6,
        backgroundColor: '#E2E8F0',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#4F46E5',
        borderRadius: 3,
    },
    slider: {
        flexDirection: 'row',
        width: width * 5,
        flex: 1,
    },
    slide: {
        width,
        padding: 24,
        justifyContent: 'center',
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        borderRadius: 24,
        padding: 24,
        paddingBottom: 30, // Breathing room at bottom
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.9)',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
        elevation: 4,
        maxHeight: '85%', // Prevent growth off screen
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        alignSelf: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0F172A',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#475569',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        fontSize: 16,
        color: '#0F172A',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    pillContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    pill: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    pillActive: {
        backgroundColor: '#EEF2FF',
        borderColor: '#4F46E5',
    },
    pillText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    pillTextActive: {
        color: '#4F46E5',
        fontWeight: '700',
    },
    summaryBox: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    summaryTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 8,
    },
    summaryText: {
        fontSize: 15,
        color: '#64748B',
        fontWeight: '500',
        marginBottom: 4,
    },
    footer: {
        paddingHorizontal: 24,
        paddingTop: 16,
        backgroundColor: '#F8FAFC',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    nextButton: {
        backgroundColor: '#4F46E5',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    nextButtonText: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: '700',
        marginRight: 8,
    },
});
