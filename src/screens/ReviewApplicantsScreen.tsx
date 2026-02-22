import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, UserCircle2, CheckCircle2, Eye } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import PublicProfileModal from '../components/PublicProfileModal';

export default function ReviewApplicantsScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { taskId } = route.params || {};

    const [applicants, setApplicants] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isApproving, setIsApproving] = useState<string | null>(null);
    const [selectedApplicantId, setSelectedApplicantId] = useState<string | null>(null);

    useEffect(() => {
        if (taskId) {
            fetchApplicants();
        }
    }, [taskId]);

    const fetchApplicants = async () => {
        try {
            const { data, error } = await supabase
                .from('task_applications')
                .select(`
                    id, 
                    applicant_id, 
                    task_id,
                    status,
                    created_at, 
                    profiles (
                        id,
                        full_name, 
                        avatar_url, 
                        department
                    )
                `)
                .eq('task_id', taskId)
                .eq('status', 'pending');

            if (error) {
                console.error("Supabase Join Error:", error.message);
                Alert.alert("Data Error", error.message);
                throw error;
            }

            setApplicants(data || []);
        } catch (error: any) {
            console.error('Error fetching applicants:', error);
            Alert.alert('Error', error.message || 'Could not load applicants.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (applicationId: string, applicantId: string) => {
        setIsApproving(applicationId);
        try {
            // Step A: Update tasks table
            const { error: taskError } = await supabase
                .from('tasks')
                .update({ assigned_to: applicantId, status: 'in_progress' })
                .eq('id', taskId);

            if (taskError) throw taskError;

            // Step B: Update application status
            const { error: appError } = await supabase
                .from('task_applications')
                .update({ status: 'accepted' })
                .eq('id', applicationId);

            if (appError) throw appError;

            // Step C: Success
            Alert.alert(
                "Worker Approved!",
                "They have been assigned to this task and notified.",
                [{ text: "OK", onPress: () => navigation.goBack() }]
            );

        } catch (error: any) {
            console.error('Approve error:', error);
            Alert.alert('Error', error.message || 'Could not approve applicant.');
            setIsApproving(null);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#F8FAFC', '#F1F5F9']}
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
                    <View>
                        <Text style={styles.headerTitle}>Review Applicants</Text>
                        <Text style={styles.headerSubtitle}>Choose the best person for your task.</Text>
                    </View>
                </View>

                {/* Content */}
                {isLoading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#4F46E5" />
                    </View>
                ) : applicants.length === 0 ? (
                    <View style={styles.center}>
                        <Text style={styles.emptyText}>No pending applications yet.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={applicants}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        renderItem={({ item }) => {
                            // Supabase joins can sometimes return an array even for 1-to-1 if foreign keys aren't strictly defined
                            const profile = Array.isArray(item.profiles) ? item.profiles[0] : (item.profiles || {});

                            return (
                                <View style={styles.applicantCard}>
                                    <View style={styles.cardLeft}>
                                        {profile?.avatar_url ? (
                                            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                                        ) : (
                                            <View style={styles.avatarPlaceholder}>
                                                <UserCircle2 size={32} color="#94A3B8" />
                                            </View>
                                        )}
                                        <View style={styles.applicantInfo}>
                                            <Text style={styles.applicantName}>{profile?.full_name || 'Unknown User'}</Text>
                                            <Text style={styles.applicantDept}>{profile?.department || 'Student'}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.actionButtonsRow}>
                                        <TouchableOpacity
                                            style={styles.viewProfileButton}
                                            activeOpacity={0.8}
                                            onPress={() => setSelectedApplicantId(item.applicant_id || profile?.id || item.id)}
                                        >
                                            <Eye size={14} color="#4F46E5" style={{ marginRight: 4 }} />
                                            <Text style={styles.viewProfileButtonText}>Profile</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.approveButton}
                                            activeOpacity={0.8}
                                            onPress={() => handleApprove(item.id, item.applicant_id)}
                                            disabled={isApproving !== null}
                                        >
                                            {isApproving === item.id ? (
                                                <ActivityIndicator size="small" color="#FFF" />
                                            ) : (
                                                <>
                                                    <CheckCircle2 size={16} color="#FFF" style={{ marginRight: 4 }} />
                                                    <Text style={styles.approveButtonText}>Approve</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        }}
                    />
                )}

                <PublicProfileModal
                    isVisible={!!selectedApplicantId}
                    onClose={() => setSelectedApplicantId(null)}
                    userId={selectedApplicantId}
                />
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
        marginTop: 4,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#64748B',
        fontWeight: '500',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 40,
        gap: 16,
    },
    applicantCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 3,
    },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 14,
        backgroundColor: '#F1F5F9',
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    applicantInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    applicantName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 2,
    },
    applicantDept: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },
    actionButtonsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    viewProfileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        backgroundColor: '#EEF2FF',
        borderWidth: 1,
        borderColor: '#C7D2FE',
    },
    viewProfileButtonText: {
        color: '#4F46E5',
        fontSize: 13,
        fontWeight: '700',
    },
    approveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#10B981',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 2,
    },
    approveButtonText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '700',
    }
});
