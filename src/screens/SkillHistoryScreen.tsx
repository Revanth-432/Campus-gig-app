import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, MessageSquare } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

type Review = {
    id: string;
    rating: number;
    comment: string;
    created_at: string;
    tasks?: { title: string };
};

export default function SkillHistoryScreen() {
    const route = useRoute<any>();
    const { skill, userId } = route.params || {};

    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSkillHistory();
    }, [skill, userId]);

    const fetchSkillHistory = async () => {
        try {
            // Assuming tasks title can be fetched if it's a join, otherwise just the comment from reviews
            const { data, error } = await supabase
                .from('reviews')
                .select(`
          id,
          rating,
          comment,
          created_at,
          tasks ( title )
        `)
                .eq('reviewee_id', userId)
                .eq('skill_tag', skill)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReviews(data || []);
        } catch (error: any) {
            console.error('Error fetching skill history:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const renderReview = ({ item }: { item: Review }) => (
        <BlurView intensity={80} tint="light" style={styles.glassCard}>
            <View style={styles.reviewHeader}>
                <Text style={styles.reviewTaskName} numberOfLines={1}>
                    {item.tasks?.title || `${skill} Task`}
                </Text>
                <View style={styles.ratingBadge}>
                    <Star size={14} color="#F59E0B" fill="#F59E0B" />
                    <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                </View>
            </View>
            <View style={styles.commentRow}>
                <MessageSquare size={16} color="#6B7280" style={{ marginRight: 8, marginTop: 2 }} />
                <Text style={styles.commentText}>"{item.comment || 'No comment provided.'}"</Text>
            </View>
        </BlurView>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#E0E7FF', '#F3F4F6', '#EDE9FE']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
                <View style={styles.header}>
                    <Text style={styles.headerSubtitle}>History for</Text>
                    <Text style={styles.headerTitle}>{skill}</Text>
                </View>

                {loading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color="#4F46E5" />
                    </View>
                ) : reviews.length === 0 ? (
                    <View style={styles.centerContainer}>
                        <Text style={styles.emptyText}>No past tasks found for this skill.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={reviews}
                        keyExtractor={item => item.id}
                        renderItem={renderReview}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                )}
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
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: '#111827',
        marginTop: 4,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#6B7280',
        fontStyle: 'italic',
    },
    glassCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.65)',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    reviewTaskName: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginRight: 10,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    ratingText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#B45309',
        marginLeft: 4,
    },
    commentRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    commentText: {
        flex: 1,
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
        fontStyle: 'italic',
    }
});
