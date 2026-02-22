import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Image,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { X, User as UserIcon, Star, CheckCircle2 } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

interface PublicProfileModalProps {
    isVisible: boolean;
    onClose: () => void;
    userId: string | null;
}

export default function PublicProfileModal({ isVisible, onClose, userId }: PublicProfileModalProps) {
    const [profile, setProfile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isVisible || !userId) {
            setProfile(null);
            return;
        }

        const fetchProfile = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('full_name, avatar_url, department, year, skills, rating, reviews_count')
                    .eq('id', userId)
                    .maybeSingle();

                if (error) {
                    console.error("Profile Fetch Error:", error);
                    throw error;
                }
                setProfile(data);
            } catch (error) {
                console.error('Error fetching public profile:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [isVisible, userId]);

    if (!isVisible) return null;

    return (
        <Modal
            visible={isVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />

                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Applicant Profile</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    {isLoading ? (
                        <View style={styles.loaderContainer}>
                            <ActivityIndicator size="large" color="#4F46E5" />
                        </View>
                    ) : profile ? (
                        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                            {/* Avatar & Name */}
                            <View style={styles.profileHeaderRow}>
                                {profile.avatar_url ? (
                                    <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                                ) : (
                                    <View style={styles.avatarPlaceholder}>
                                        <UserIcon size={40} color="#94A3B8" />
                                    </View>
                                )}
                                <View style={styles.nameHeaderDetails}>
                                    <Text style={styles.fullName}>{profile.full_name}</Text>
                                    <View style={styles.ratingRow}>
                                        <Star size={16} color="#F59E0B" fill="#F59E0B" />
                                        <Text style={styles.ratingText}>
                                            {profile.rating ? profile.rating.toFixed(1) : 'No Rating'}
                                        </Text>
                                        <Text style={styles.reviewCountText}>
                                            ({profile.reviews_count || 0} reviews)
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Academic Details */}
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Academic Status</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailText}>
                                    {profile.department || 'Department not specified'}
                                </Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailText}>
                                    {profile.year ? `Year ${profile.year}` : 'Year not specified'}
                                </Text>
                            </View>

                            {/* Skills */}
                            <View style={styles.sectionHeader}>
                                <CheckCircle2 size={18} color="#10B981" />
                                <Text style={styles.sectionTitle}>Verified Skills</Text>
                            </View>
                            <View style={styles.skillsContainer}>
                                {profile.skills && profile.skills.length > 0 ? (
                                    profile.skills.map((skill: string, idx: number) => (
                                        <View key={idx} style={styles.skillPill}>
                                            <Text style={styles.skillText}>{skill}</Text>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.emptyText}>No skills listed</Text>
                                )}
                            </View>

                            {/* Bottom Pad */}
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    ) : (
                        <View style={styles.loaderContainer}>
                            <Text style={styles.errorText}>Could not load profile.</Text>
                        </View>
                    )}
                </View>
            </View>
        </Modal >
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: '80%',
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0F172A',
    },
    closeButton: {
        padding: 4,
        backgroundColor: '#F8FAFC',
        borderRadius: 20,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingBottom: 20,
    },
    profileHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        borderWidth: 2,
        borderColor: '#E2E8F0',
    },
    avatarPlaceholder: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#CBD5E1',
    },
    nameHeaderDetails: {
        flex: 1,
        marginLeft: 16,
        justifyContent: 'center',
    },
    fullName: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 6,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#475569',
    },
    reviewCountText: {
        fontSize: 14,
        color: '#94A3B8',
        fontWeight: '500',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        marginTop: 24,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#334155',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    detailRow: {
        marginBottom: 6,
        paddingLeft: 2,
    },
    detailText: {
        fontSize: 16,
        color: '#475569',
        fontWeight: '500',
    },
    bioText: {
        fontSize: 15,
        color: '#475569',
        lineHeight: 24,
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    skillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    skillPill: {
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#C7D2FE',
    },
    skillText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4F46E5',
    },
    emptyText: {
        fontSize: 15,
        color: '#94A3B8',
        fontStyle: 'italic',
    },
    errorText: {
        fontSize: 16,
        color: '#EF4444',
        fontWeight: '500',
    }
});
