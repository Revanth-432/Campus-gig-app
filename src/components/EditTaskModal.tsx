import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Modal,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    ActivityIndicator
} from 'react-native';
import { BlurView } from 'expo-blur';
import { supabase } from '../lib/supabase';
import { TaskType } from './TaskCard';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';

interface EditTaskModalProps {
    isVisible: boolean;
    onClose: () => void;
    task: TaskType;
    onTaskUpdated: (updatedTask: any) => void;
}

export default function EditTaskModal({ isVisible, onClose, task, onTaskUpdated }: EditTaskModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [deadlineDate, setDeadlineDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isVisible && task) {
            setTitle(task.title || '');
            setDescription(task.description || '');
            setAmount(task.amount ? task.amount.toString() : '');
            if (task.deadline) {
                setDeadlineDate(new Date(task.deadline));
            } else {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setDeadlineDate(tomorrow);
            }
        }
    }, [isVisible, task]);

    const handleSave = async () => {
        if (!title.trim() || !description.trim() || !amount.trim()) {
            Alert.alert('Missing Fields', 'Please fill in title, description, and reward.');
            return;
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid monetary amount.');
            return;
        }

        setIsSubmitting(true);
        try {
            const updates = {
                title: title.trim(),
                description: description.trim(),
                amount: parsedAmount,
                deadline: deadlineDate.toISOString()
            };

            const { error } = await supabase
                .from('tasks')
                .update(updates)
                .eq('id', task.id);

            if (error) throw error;

            onTaskUpdated({ ...task, ...updates });
            Alert.alert('Success', 'Task updated successfully.');
            onClose();
        } catch (error: any) {
            Alert.alert('Error updating task', error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setDeadlineDate(selectedDate);
        }
    };

    return (
        <Modal visible={isVisible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                <BlurView intensity={90} tint="light" style={StyleSheet.absoluteFill} />
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Edit Task</Text>
                        <TouchableOpacity onPress={onClose} disabled={isSubmitting}>
                            <Text style={styles.modalCloseText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        <Text style={styles.inputLabel}>Title</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Task Title"
                            value={title}
                            onChangeText={setTitle}
                        />

                        <Text style={styles.inputLabel}>Description</Text>
                        <TextInput
                            style={[styles.textInput, { height: 100 }]}
                            placeholder="Detailed explanation..."
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />

                        <Text style={styles.inputLabel}>Reward Amount (₹)</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="500"
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="numeric"
                        />

                        <Text style={styles.inputLabel}>Deadline</Text>
                        <TouchableOpacity
                            style={styles.datePickerButton}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Calendar size={20} color="#4F46E5" style={{ marginRight: 8 }} />
                            <Text style={styles.datePickerText}>
                                {deadlineDate.toLocaleDateString()} {deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </TouchableOpacity>

                        {showDatePicker && (
                            <DateTimePicker
                                value={deadlineDate}
                                mode="datetime"
                                is24Hour={true}
                                display="default"
                                onChange={handleDateChange}
                                minimumDate={new Date()}
                            />
                        )}

                        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            )}
                        </TouchableOpacity>
                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        maxHeight: '90%'
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
    modalCloseText: { fontSize: 16, color: '#6B7280', fontWeight: '600' },
    inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 12 },
    textInput: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        color: '#111827'
    },
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2FF',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#C7D2FE'
    },
    datePickerText: {
        fontSize: 16,
        color: '#4F46E5',
        fontWeight: '500'
    },
    saveButton: {
        backgroundColor: '#4F46E5',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4
    },
    saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }
});
