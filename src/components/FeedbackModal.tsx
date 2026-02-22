import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Star, X } from 'lucide-react-native';

interface FeedbackModalProps {
    isVisible: boolean;
    onClose: () => void;
    onSubmit: (rating: number, comment: string) => Promise<void>;
    targetUserName: string;
}

export default function FeedbackModal({
    isVisible,
    onClose,
    onSubmit,
    targetUserName
}: FeedbackModalProps) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) return;
        setIsSubmitting(true);
        try {
            await onSubmit(rating, comment.trim());
            // Reset state
            setRating(0);
            setComment('');
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setRating(0);
        setComment('');
        onClose();
    };

    return (
        <Modal
            visible={isVisible}
            animationType="fade"
            transparent={true}
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalOverlay}
            >
                <BlurView intensity={90} tint="light" style={StyleSheet.absoluteFill} />
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Rate {targetUserName}</Text>
                        <TouchableOpacity onPress={handleClose} disabled={isSubmitting}>
                            <X size={24} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.subtitle}>
                        How was your experience working with them? Your feedback helps keep the campus community safe and reliable.
                    </Text>

                    <View style={styles.starsContainer}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity
                                key={star}
                                onPress={() => setRating(star)}
                                activeOpacity={0.7}
                            >
                                <Star
                                    size={40}
                                    color={star <= rating ? '#F59E0B' : '#E2E8F0'}
                                    fill={star <= rating ? '#F59E0B' : 'transparent'}
                                    style={styles.starIcon}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Optional Review</Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Leave a short comment..."
                        placeholderTextColor="#9CA3AF"
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        value={comment}
                        onChangeText={setComment}
                    />

                    <TouchableOpacity
                        style={[styles.submitButton, rating === 0 && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={rating === 0 || isSubmitting}
                        activeOpacity={0.8}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.submitButtonText}>Submit Feedback</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
    },
    subtitle: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 20,
        marginBottom: 24,
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 30,
    },
    starIcon: {
        marginHorizontal: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#475569',
        marginBottom: 8,
    },
    textInput: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        padding: 16,
        fontSize: 15,
        color: '#0F172A',
        minHeight: 100,
        marginBottom: 24,
    },
    submitButton: {
        backgroundColor: '#4F46E5',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonDisabled: {
        backgroundColor: '#94A3B8',
        shadowOpacity: 0,
        elevation: 0,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
