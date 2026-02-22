import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager, Alert, ActivityIndicator } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { BlurView } from 'expo-blur';
import { Lock, Zap, CheckCircle2, MapPin, ShieldCheck, ShieldAlert, Trash2, Copy, Edit2, Clock } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import EditTaskModal from './EditTaskModal';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import FeedbackModal from './FeedbackModal';

export interface TaskType {
    id: string;
    title: string;
    amount: number;
    type: string;
    verification: string;
    urgency: string;
    status: string;
    description?: string;
    location?: string;
    skills?: string[];
    min_bonus: number | null;
    max_bonus: number | null;
    creator_id: string;
    assigned_to?: string;
    created_at: string;
    date?: string;
    time?: string;
    deadline?: string;
    profiles?: {
        full_name: string;
        avatar_url?: string;
    };
    creator?: {
        full_name: string;
        avatar_url?: string;
    };
}

interface TaskCardProps {
    task: TaskType;
    showActionButton?: boolean;
    actionButtonType?: 'solid' | 'outline';
    actionButtonText?: string;
    onActionPress?: () => void;
    onActionComplete?: () => void; // Optional callback to force refresh parent lists
    isSmartMatch?: boolean;
}

export default function TaskCard({
    task: initialTask,
    showActionButton = false,
    actionButtonType = 'solid',
    actionButtonText = 'Action',
    onActionPress,
    onActionComplete,
    isSmartMatch = false
}: TaskCardProps) {

    const [task, setTask] = useState(initialTask);
    React.useEffect(() => { setTask(initialTask); }, [initialTask]);

    const { session } = useAuth();
    const navigation = useNavigation<any>();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isClaimed, setIsClaimed] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);
    const [isDeleted, setIsDeleted] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);

    // Feedback States
    const [hasReviewed, setHasReviewed] = useState(false);
    const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);

    // Trust & Safety States
    const [contactData, setContactData] = useState<{ phone_number?: string, email_contact?: string } | null>(null);

    React.useEffect(() => {
        const checkReviewStatus = async () => {
            if (task.status === 'completed' && session?.user?.id) {
                try {
                    const { data, error } = await supabase
                        .from('reviews')
                        .select('id')
                        .eq('task_id', task.id)
                        .eq('reviewer_id', session.user.id)
                        .maybeSingle();

                    if (data) {
                        setHasReviewed(true);
                    }
                } catch (error) {
                    console.error('Error checking review status:', error);
                }
            }
        };

        checkReviewStatus();
    }, [task.status, session?.user?.id, task.id]);

    React.useEffect(() => {
        // Only fetch Contact Info if the task is actively assigned or pending payment
        const isActiveWorkerAssigned = task.status === 'in_progress' || task.status === 'pending_payment';

        if (isActiveWorkerAssigned && task.assigned_to) {
            const fetchContactInfo = async () => {
                let targetId = null;
                if (task.creator_id === session?.user?.id) {
                    targetId = task.assigned_to;
                } else if (task.assigned_to === session?.user?.id) {
                    targetId = task.creator_id;
                }

                if (targetId) {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('phone_number, email_contact')
                        .eq('id', targetId)
                        .maybeSingle();

                    if (!error && data) {
                        setContactData(data);
                    }
                }
            };
            fetchContactInfo();
        }
    }, [task.status, task.assigned_to, session?.user?.id, task.creator_id]);

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsExpanded(!isExpanded);
    };

    const isCreator = task.creator_id === session?.user?.id || false;
    const isWorker = task.assigned_to === session?.user?.id || false;
    const creatorName = task.profiles?.full_name || task.creator?.full_name || 'Student';

    // Urgency Check helper
    const checkUrgency = (deadlineStr?: string) => {
        if (!deadlineStr) return false;
        const diffHours = (new Date(deadlineStr).getTime() - new Date().getTime()) / (1000 * 60 * 60);
        return diffHours > 0 && diffHours < 3;
    };
    const isDeadlineUrgent = checkUrgency(task.deadline);
    const deadlineColor = isDeadlineUrgent ? '#EF4444' : '#D97706';

    const formatDeadline = (isoString: string) => {
        const d = new Date(isoString);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' +
            d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    const handleInstantClaim = async () => {
        if (!session?.user?.id) return;
        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('tasks')
                .update({ assigned_to: session.user.id, status: 'in_progress' })
                .eq('id', task.id);

            if (error) throw error;
            setIsClaimed(true);
            Alert.alert('Task Claimed! ⚡', 'You are now assigned to this task.');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleApply = async () => {
        if (!session?.user?.id) return;
        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('task_applications')
                .insert({ task_id: task.id, applicant_id: session.user.id });

            if (error) {
                if (error.code === '23505') {
                    setHasApplied(true); // Already applied, show state
                    Alert.alert('Already Applied', 'You have already expressed interest in this task.');
                    return;
                }
                throw error;
            }
            setHasApplied(true);
            Alert.alert('Application Sent! ⭐', 'The creator will review your profile.');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Task',
            'Are you sure? This will permanently remove the task and any current applicants.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('tasks')
                                .delete()
                                .eq('id', task.id)
                                .eq('creator_id', session?.user?.id); // Security check: only owner can delete

                            if (error) {
                                Alert.alert('Error', 'Could not delete task. Please try again.');
                                console.error(error);
                                return;
                            }
                            setIsDeleted(true); // Optimistic UI removal
                            onActionComplete?.(); // Sync parent states if bound
                        } catch (error: any) {
                            Alert.alert('Error', 'Could not delete task. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    const handleMarkDone = async () => {
        if (!session?.user?.id) return;
        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('tasks')
                .update({ status: 'pending_payment' })
                .eq('id', task.id);

            if (error) throw error;

            // Send notification to creator
            await supabase.from('notifications').insert({
                user_id: task.creator_id,
                title: 'Task Finished!',
                message: `The worker has marked "${task.title}" as done. Please confirm payment to close the task.`,
                type: 'task_update',
                reference_id: task.id
            });

            Alert.alert('Task Marked Done! 🎉', 'Waiting for the creator to confirm payment.');

            // Trigger UI refresh
            if (onActionComplete) onActionComplete();
        } catch (error: any) {
            Alert.alert('Error', 'Failed to mark task as done: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePaymentConfirm = async () => {
        if (!session?.user?.id) return;
        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('tasks')
                .update({ status: 'completed' })
                .eq('id', task.id);

            if (error) throw error;

            Alert.alert('Success!', 'Task moved to Done history.');

            // Trigger UI refresh
            if (onActionComplete) onActionComplete();
        } catch (error: any) {
            Alert.alert('Error', 'Failed to confirm payment: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReviewSubmit = async (rating: number, comment: string) => {
        if (!session?.user?.id) return;

        // Ensure user is involved in the task
        if (!isCreator && !isWorker) return;

        // Determine who is being reviewed
        const revieweeId = isCreator ? task.assigned_to : task.creator_id;

        if (!revieweeId) {
            Alert.alert('Error', 'Could not determine who to review.');
            return;
        }

        try {
            const { error } = await supabase
                .from('reviews')
                .insert({
                    task_id: task.id,
                    reviewer_id: session.user.id,
                    reviewee_id: revieweeId,
                    rating,
                    comment
                });

            if (error) throw error;

            setHasReviewed(true);
            setIsReviewModalVisible(false);
            Alert.alert('Feedback Submitted! ⭐', 'Thank you for your review.');
        } catch (error: any) {
            Alert.alert('Error', 'Failed to submit feedback: ' + error.message);
        }
    };

    const handleActionPress = () => {
        if (onActionPress) {
            onActionPress();
        } else if (isWorker && task.status === 'in_progress') {
            handleMarkDone();
        } else {
            if (task.verification === 'instant') {
                handleInstantClaim();
            } else {
                handleApply();
            }
        }
    };

    // time ago helper
    const getTimeAgo = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const isDone = task.status === 'completed';
    const isInProgress = task.status === 'in_progress';
    const isPendingPayment = task.status === 'pending_payment';
    const isUrgent = task.urgency === 'immediate';
    const isOnline = task.type === 'online';
    const isTwoStep = task.verification === 'handpick';
    const hasBonus = task.min_bonus !== null || task.max_bonus !== null;
    const bonusText = hasBonus ? `+ ₹${task.max_bonus || task.min_bonus} Possible` : null;

    if (isDeleted) return null;

    return (
        <TouchableOpacity activeOpacity={0.9} onPress={toggleExpand}>
            <BlurView intensity={80} tint="light" style={styles.card}>
                {/* Top Row: Pills & Price */}
                <View style={styles.topRow}>
                    <View style={styles.pillsContainer}>
                        {isDone && (
                            <View style={[styles.pill, styles.pillDone]}>
                                <Text style={[styles.pillText, { color: '#16A34A' }]}>✅ DONE</Text>
                            </View>
                        )}
                        {isPendingPayment && (
                            <View style={[styles.pill, styles.pillPendingPayment]}>
                                <Text style={[styles.pillText, { color: '#D97706' }]}>⌛ PAYMENT PENDING</Text>
                            </View>
                        )}
                        {isInProgress && (
                            <View style={[styles.pill, styles.pillInProgress]}>
                                <Text style={[styles.pillText, { color: '#0D9488' }]}>🕒 IN PROGRESS</Text>
                            </View>
                        )}
                        {isUrgent && (
                            <View style={[styles.pill, styles.pillUrgent]}>
                                <Text style={[styles.pillText, { color: '#EF4444' }]}>⚡ URGENT</Text>
                            </View>
                        )}
                        {isOnline ? (
                            <View style={[styles.pill, styles.pillOnline]}>
                                <Text style={[styles.pillText, { color: '#2563EB' }]}>🌐 ONLINE</Text>
                            </View>
                        ) : (
                            <View style={[styles.pill, styles.pillCampus]}>
                                <Text style={[styles.pillText, { color: '#EA580C' }]}>📍 ON CAMPUS</Text>
                            </View>
                        )}
                        {isTwoStep ? (
                            <View style={[styles.pill, styles.pillTwoStep]}>
                                <Lock size={10} color="#D97706" />
                                <Text style={[styles.pillText, { color: '#D97706' }]}>2-STEP</Text>
                            </View>
                        ) : (
                            <View style={[styles.pill, styles.pillOneStep]}>
                                <ShieldCheck size={10} color="#059669" />
                                <Text style={[styles.pillText, { color: '#059669' }]}>1-STEP</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.topRightActions}>
                        <View style={styles.priceContainer}>
                            <Text style={styles.priceText}>₹ {task.amount}</Text>
                            {bonusText && (
                                <Text style={styles.bonusText}>{bonusText}</Text>
                            )}
                        </View>
                        {isCreator && task.status === 'open' && (
                            <TouchableOpacity
                                style={{ padding: 4, marginTop: 4, marginRight: 8 }}
                                onPress={(e) => { e.stopPropagation(); setIsEditModalVisible(true); }}
                            >
                                <Edit2 size={18} color="#4F46E5" opacity={0.8} />
                            </TouchableOpacity>
                        )}
                        {isCreator && (
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={(e) => { e.stopPropagation(); handleDelete(); }}
                            >
                                <Trash2 size={18} color="#EF4444" opacity={0.7} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Middle Row: Title & Details */}
                <View style={styles.middleRow}>
                    {isSmartMatch && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 6, alignSelf: 'flex-start' }}>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#B45309' }}>✨ Fits Your Schedule</Text>
                        </View>
                    )}
                    <Text style={styles.title} numberOfLines={2}>{task.title}</Text>

                    {task.deadline && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 4 }}>
                            <Clock size={12} color={deadlineColor} style={{ marginRight: 4 }} />
                            <Text style={{ fontSize: 13, color: deadlineColor, fontWeight: '600' }}>
                                ⏳ Due {formatDeadline(task.deadline)}
                            </Text>
                        </View>
                    )}

                    <Text style={styles.subtitle}>
                        Posted by <Text style={styles.subtitleHighlight}>{creatorName}</Text> • {getTimeAgo(task.created_at)}
                    </Text>

                    {/* Description Rendering */}
                    {task.description && (
                        <Text style={[styles.previewDescription, { flexShrink: 1 }]} numberOfLines={isExpanded ? undefined : 2}>
                            {task.description}
                        </Text>
                    )}

                    {/* Preview Location or Tags */}
                    {task.type === 'on_campus' && task.location && (
                        <View style={styles.previewMetaRow}>
                            <MapPin size={12} color="#64748B" />
                            <Text style={styles.previewMetaText}>{task.location}</Text>
                        </View>
                    )}

                    {task.skills && task.skills.length > 0 && (
                        <View style={styles.previewTagsRow}>
                            {task.skills.slice(0, 3).map((tag, idx) => (
                                <View key={idx} style={styles.previewTagPill}>
                                    <Text style={styles.previewTagText}>{tag}</Text>
                                </View>
                            ))}
                            {task.skills.length > 3 && (
                                <Text style={styles.previewTagExtra}>+{task.skills.length - 3}</Text>
                            )}
                        </View>
                    )}
                </View>

                {/* Expanded Content */}
                {isExpanded && (
                    <View style={styles.expandedContent}>
                        <View style={styles.divider} />

                        {/* Trust & Safety Reveal */}
                        {(isCreator || isWorker) && contactData && (task.status === 'in_progress' || task.status === 'pending_payment') && (
                            <View style={styles.contactRevealBox}>
                                <Text style={styles.contactRevealTitle}>
                                    {isCreator ? 'Worker Contact Info' : 'Creator Contact Info'}
                                </Text>
                                <Text style={styles.contactRevealDesc}>Use this to coordinate the active task.</Text>

                                <TouchableOpacity
                                    style={styles.contactRow}
                                    activeOpacity={0.7}
                                    onPress={async () => {
                                        if (contactData.phone_number) {
                                            await Clipboard.setStringAsync(contactData.phone_number);
                                            Alert.alert('Copied!', 'Phone number copied to clipboard.');
                                        }
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                        <Text style={styles.contactIcon}>📞</Text>
                                        <Text style={styles.contactText}>{contactData.phone_number || 'No phone provided'}</Text>
                                    </View>
                                    {contactData.phone_number && (
                                        <Copy size={14} color="#64748B" style={{ marginLeft: 8 }} />
                                    )}
                                </TouchableOpacity>
                                <View style={[styles.contactRow, { marginTop: 12 }]}>
                                    <Text style={styles.contactIcon}>✉️</Text>
                                    <Text style={styles.contactText}>{contactData.email_contact || 'No email provided'}</Text>
                                </View>
                            </View>
                        )}

                        {task.status === 'completed' || task.status === 'done' ? (
                            hasReviewed ? (
                                <Text style={{ textAlign: 'center', color: '#9CA3AF', marginTop: 10, fontWeight: '600', fontSize: 13 }}>✨ Feedback Submitted ✅</Text>
                            ) : (
                                showActionButton && (isCreator || isWorker) && (
                                    <TouchableOpacity
                                        style={{ marginTop: 10, padding: 14, backgroundColor: '#F8FAFC', borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' }}
                                        onPress={() => setIsReviewModalVisible(true)}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={{ fontWeight: '800', color: '#475569', fontSize: 14 }}>⭐ Give Feedback</Text>
                                    </TouchableOpacity>
                                )
                            )
                        ) : (
                            <>
                                {/* Verification Logic Box */}
                                {task.verification === 'instant' ? (
                                    <View style={styles.instantBox}>
                                        <ShieldCheck size={16} color="#059669" />
                                        <Text style={styles.verificationTextGreen}>
                                            <Text style={styles.verificationBold}> 1-Step: </Text>
                                            Accept now and the task is yours instantly. No review needed.
                                        </Text>
                                    </View>
                                ) : (
                                    <View style={styles.handpickBox}>
                                        <ShieldAlert size={16} color="#D97706" />
                                        <Text style={styles.verificationTextOrange}>
                                            <Text style={styles.verificationBold}> 2-Step: </Text>
                                            Express interest with a message. The poster will review your profile.
                                        </Text>
                                    </View>
                                )}

                                {/* Action Buttons */}
                                {showActionButton && task.status === 'open' && (
                                    <View style={styles.bottomRow}>
                                        {isCreator ? (
                                            task.verification === 'handpick' && !task.assigned_to && task.status === 'open' ? (
                                                <TouchableOpacity
                                                    style={[styles.actionButton, { backgroundColor: '#4F46E5', borderColor: '#4F46E5' }]}
                                                    onPress={() => navigation.navigate('ReviewApplicants', { taskId: task.id })}
                                                    activeOpacity={0.8}
                                                >
                                                    <Text style={[styles.actionButtonText, { color: '#FFF' }]}>👥 Review Applicants</Text>
                                                </TouchableOpacity>
                                            ) : (
                                                <View style={[styles.actionButton, styles.actionButtonDisabled]}>
                                                    <Text style={[styles.actionButtonText, styles.actionButtonTextDisabled]}>This is your task</Text>
                                                </View>
                                            )
                                        ) : isClaimed ? (
                                            <View style={[styles.actionButton, styles.actionButtonDisabled]}>
                                                <Text style={[styles.actionButtonText, styles.actionButtonTextDisabled]}>✅ Task Claimed</Text>
                                            </View>
                                        ) : hasApplied ? (
                                            <View style={[styles.actionButton, styles.actionButtonDisabled]}>
                                                <Text style={[styles.actionButtonText, styles.actionButtonTextDisabled]}>⏳ Application Sent</Text>
                                            </View>
                                        ) : (
                                            <TouchableOpacity
                                                style={[
                                                    styles.actionButton,
                                                    actionButtonType === 'outline' ? styles.actionButtonOutline :
                                                        (task.verification === 'instant' ? styles.actionButtonInstant : styles.actionButtonHandpick)
                                                ]}
                                                onPress={handleActionPress}
                                                activeOpacity={0.8}
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting ? (
                                                    <ActivityIndicator color={actionButtonType === 'outline' ? '#4F46E5' : '#FFF'} />
                                                ) : (
                                                    <Text style={[
                                                        styles.actionButtonText,
                                                        actionButtonType === 'outline' ? styles.actionButtonTextOutline : styles.actionButtonTextSolid
                                                    ]}>
                                                        {actionButtonType === 'outline' ? actionButtonText : (task.verification === 'instant' ? '⚡ Accept Task Instantly' : '⭐ Express Interest')}
                                                    </Text>
                                                )}
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}

                                {/* Action Buttons for Worker  */}
                                {showActionButton && task.status === 'in_progress' && isWorker && (
                                    <View style={styles.bottomRow}>
                                        <TouchableOpacity
                                            style={[styles.actionButton, { backgroundColor: '#10B981', borderColor: '#10B981' }]}
                                            onPress={handleMarkDone}
                                            activeOpacity={0.8}
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <ActivityIndicator color="#FFF" />
                                            ) : (
                                                <Text style={[styles.actionButtonText, { color: '#FFF' }]}>
                                                    ✅ Mark Done
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {showActionButton && task.status === 'pending_payment' && isWorker && (
                                    <View style={styles.bottomRow}>
                                        <View style={[styles.actionButton, styles.actionButtonDisabled]}>
                                            <Text style={[styles.actionButtonText, styles.actionButtonTextDisabled]}>⌛ Waiting for Payment</Text>
                                        </View>
                                    </View>
                                )}

                                {/* Action Buttons for Creator */}
                                {showActionButton && task.status === 'pending_payment' && isCreator && (
                                    <View style={styles.bottomRow}>
                                        <TouchableOpacity
                                            style={[styles.actionButton, { backgroundColor: '#F59E0B', borderColor: '#F59E0B' }]}
                                            onPress={handlePaymentConfirm}
                                            activeOpacity={0.8}
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <ActivityIndicator color="#FFF" />
                                            ) : (
                                                <Text style={[styles.actionButtonText, { color: '#FFF' }]}>
                                                    💰 Payment Done & Close Task
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                )}
            </BlurView>
            <EditTaskModal
                isVisible={isEditModalVisible}
                onClose={() => setIsEditModalVisible(false)}
                task={task}
                onTaskUpdated={setTask}
            />
            <FeedbackModal
                isVisible={isReviewModalVisible}
                onClose={() => setIsReviewModalVisible(false)}
                onSubmit={handleReviewSubmit}
                targetUserName={isCreator ? (task.profiles?.full_name || 'Worker') : creatorName}
            />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.9)',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 4,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    pillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        flex: 1,
        gap: 8,
        paddingRight: 10,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        gap: 4,
    },
    pillDone: {
        backgroundColor: '#F0FDF4',
        borderColor: '#DCFCE7',
    },
    pillPendingPayment: {
        backgroundColor: '#FFFBEB',
        borderColor: '#FEF3C7',
    },
    pillInProgress: {
        backgroundColor: '#F0FDFA',
        borderColor: '#CCFBF1',
    },
    pillUrgent: {
        backgroundColor: '#FEF2F2',
        borderColor: '#FEE2E2',
    },
    pillOnline: {
        backgroundColor: '#EFF6FF',
        borderColor: '#DBEAFE',
    },
    pillCampus: {
        backgroundColor: '#FFF7ED',
        borderColor: '#FFEDD5',
    },
    pillTwoStep: {
        backgroundColor: '#FFFBEB',
        borderColor: '#FEF3C7',
    },
    pillOneStep: {
        backgroundColor: '#ECFDF5',
        borderColor: '#D1FAE5',
    },
    pillText: {
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    priceText: {
        fontSize: 20,
        fontWeight: '900',
        color: '#16A34A',
    },
    bonusText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#65A30D',
        marginTop: 2,
        textAlign: 'right',
    },
    topRightActions: {
        alignItems: 'flex-end',
        gap: 8,
    },
    deleteButton: {
        padding: 4,
        marginTop: 4,
    },
    middleRow: {
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
        lineHeight: 24,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },
    subtitleHighlight: {
        fontWeight: '700',
        color: '#475569',
    },
    previewDescription: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
        marginTop: 8,
    },
    previewMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 6,
    },
    previewMetaText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },
    previewTagsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginTop: 10,
        gap: 6,
    },
    previewTagPill: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    previewTagText: {
        fontSize: 11,
        color: '#475569',
        fontWeight: '600',
    },
    previewTagExtra: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '600',
        marginLeft: 2,
    },
    bottomRow: {
        marginTop: 4,
    },
    actionButton: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButtonSolid: {
        backgroundColor: '#4F46E5', // Indigo
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 3,
    },
    actionButtonOutline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#4F46E5',
    },
    actionButtonText: {
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    actionButtonTextSolid: {
        color: '#FFFFFF',
    },
    actionButtonTextOutline: {
        color: '#4F46E5',
    },
    actionButtonDisabled: {
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    actionButtonTextDisabled: {
        color: '#94A3B8',
    },
    expandedContent: {
        marginTop: 4,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginBottom: 16,
    },
    descriptionText: {
        fontSize: 15,
        color: '#4B5563',
        lineHeight: 22,
        marginBottom: 16,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 6,
    },
    locationText: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    instantBox: {
        flexDirection: 'row',
        backgroundColor: '#ECFDF5',
        borderColor: '#A7F3D0',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: 20,
    },
    handpickBox: {
        flexDirection: 'row',
        backgroundColor: '#FFF7ED',
        borderColor: '#FED7AA',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: 20,
    },
    verificationTextGreen: {
        fontSize: 13,
        color: '#065F46',
        flex: 1,
        lineHeight: 18,
    },
    verificationTextOrange: {
        fontSize: 13,
        color: '#92400E',
        flex: 1,
        lineHeight: 18,
    },
    verificationBold: {
        fontWeight: '800',
    },
    contactRevealBox: {
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    contactRevealTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#334155',
        marginBottom: 2,
    },
    contactRevealDesc: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 8,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    contactIcon: {
        fontSize: 14,
        marginRight: 8,
    },
    contactText: {
        fontSize: 14,
        color: '#0F172A',
        fontWeight: '500',
    },
    actionButtonInstant: {
        backgroundColor: '#10B981', // Vibrant Green
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 3,
    },
    actionButtonHandpick: {
        backgroundColor: '#6366F1', // Indigo/Purple
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 3,
    },
});
