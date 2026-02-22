import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    FlatList,
    TextInput,
    ActivityIndicator,
    Linking,
    KeyboardAvoidingView,
    Platform,
    Alert
} from 'react-native';
import { BlurView } from 'expo-blur';
import { X, ExternalLink, Plus, Trophy, BriefcaseBusiness } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

type Achievement = {
    id: string;
    title: string;
    description: string;
    link?: string;
    created_at: string;
};

interface AchievementModalProps {
    isVisible: boolean;
    onClose: () => void;
    skill: string;
    userId: string;
    isOwner: boolean;
}

export default function AchievementModal({
    isVisible,
    onClose,
    skill,
    userId,
    isOwner,
}: AchievementModalProps) {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isWriting, setIsWriting] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [link, setLink] = useState('');

    useEffect(() => {
        if (isVisible && skill && userId) {
            fetchAchievements();
            setIsWriting(false);
            resetForm();
        }
    }, [isVisible, skill, userId]);

    const fetchAchievements = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('achievements')
                .select('*')
                .eq('user_id', userId)
                .eq('skill', skill)
                .order('created_at', { ascending: false });

            if (error) {
                // If the table doesn't exist yet, this will gracefully fail as an empty array
                console.error("Fetch achievements error: ", error.message);
                setAchievements([]);
            } else {
                setAchievements(data || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setLink('');
    };

    const handleSubmit = async () => {
        if (!title.trim() || !description.trim()) {
            Alert.alert("Missing Info", "Title and Description are required.");
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('achievements').insert([
                {
                    user_id: userId,
                    skill: skill,
                    title: title.trim(),
                    description: description.trim(),
                    link: link.trim() || null,
                }
            ]);

            if (error) throw error;

            setIsWriting(false);
            resetForm();
            await fetchAchievements();
        } catch (error: any) {
            Alert.alert("Error", "Could not save achievement: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const openLink = async (url: string) => {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
            await Linking.openURL(url);
        } else {
            Alert.alert("Error", "Cannot open this URL.");
        }
    };

    const renderAchievement = ({ item }: { item: Achievement }) => (
        <View style={styles.achievementCard}>
            <View style={styles.achievementHeader}>
                <Trophy size={20} color="#F59E0B" style={{ marginRight: 8 }} />
                <Text style={styles.achievementTitle}>{item.title}</Text>
            </View>
            <Text style={styles.achievementDescription}>{item.description}</Text>

            {item.link && (
                <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => openLink(item.link!)}
                    activeOpacity={0.7}
                >
                    <ExternalLink size={16} color="#4F46E5" />
                    <Text style={styles.linkText}>View Proof / Link</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderWriteMode = () => (
        <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Achievement Title</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g., Designed Campus Festival Logo"
                    placeholderTextColor="#94A3B8"
                    value={title}
                    onChangeText={setTitle}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Describe what you did, the impact, or the skills used..."
                    placeholderTextColor="#94A3B8"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Proof Link (Optional)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="https://github.com/my-repo"
                    placeholderTextColor="#94A3B8"
                    value={link}
                    onChangeText={setLink}
                    autoCapitalize="none"
                    keyboardType="url"
                />
            </View>

            <View style={styles.formActions}>
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setIsWriting(false)}
                    disabled={isSubmitting}
                >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                        <Text style={styles.submitButtonText}>Save Portfolio</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <Modal
            visible={isVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                style={styles.modalOverlay}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill}>
                    <TouchableOpacity style={styles.dismissArea} onPress={onClose} activeOpacity={1} />
                </BlurView>

                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <BriefcaseBusiness size={24} color="#64748B" />
                            <Text style={styles.headerTitle}>{skill} Portfolio</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    {isLoading ? (
                        <View style={styles.centerContainer}>
                            <ActivityIndicator size="large" color="#4F46E5" />
                        </View>
                    ) : isWriting ? (
                        renderWriteMode()
                    ) : (
                        <>
                            {achievements.length === 0 ? (
                                <View style={styles.emptyContainer}>
                                    <View style={styles.emptyIconCircle}>
                                        <Trophy size={32} color="#94A3B8" />
                                    </View>
                                    <Text style={styles.emptyTitle}>No Achievements Yet</Text>
                                    <Text style={styles.emptySubtitle}>
                                        {isOwner
                                            ? `Add your first ${skill} achievement to stand out.`
                                            : `This user hasn't added any ${skill} achievements.`}
                                    </Text>
                                </View>
                            ) : (
                                <FlatList
                                    data={achievements}
                                    keyExtractor={item => item.id}
                                    renderItem={renderAchievement}
                                    contentContainerStyle={styles.listContainer}
                                    showsVerticalScrollIndicator={false}
                                />
                            )}

                            {isOwner && !isWriting && (
                                <View style={styles.footer}>
                                    <TouchableOpacity
                                        style={styles.addButton}
                                        onPress={() => setIsWriting(true)}
                                    >
                                        <Plus size={20} color="#FFF" />
                                        <Text style={styles.addButtonText}>Add Achievement</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </>
                    )}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    dismissArea: {
        flex: 1,
    },
    modalContent: {
        backgroundColor: '#F8FAFC',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        minHeight: '60%',
        maxHeight: '90%',
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0F172A',
    },
    closeButton: {
        padding: 8,
        backgroundColor: '#F1F5F9',
        borderRadius: 20,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 200,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
        paddingHorizontal: 20,
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#334155',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 15,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 22,
    },
    listContainer: {
        paddingBottom: 20,
    },
    achievementCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    achievementHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    achievementTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        flex: 1,
    },
    achievementDescription: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 20,
        marginBottom: 12,
    },
    linkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2FF',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    linkText: {
        color: '#4F46E5',
        fontSize: 13,
        fontWeight: '600',
    },
    footer: {
        marginTop: 16,
    },
    addButton: {
        backgroundColor: '#4F46E5',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 8,
    },
    addButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    formContainer: {
        flex: 1,
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
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 16,
        fontSize: 15,
        color: '#0F172A',
    },
    textArea: {
        minHeight: 120,
    },
    formActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 10,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#F1F5F9',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        color: '#64748B',
        fontSize: 16,
        fontWeight: '700',
    },
    submitButton: {
        flex: 2,
        backgroundColor: '#4F46E5',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
