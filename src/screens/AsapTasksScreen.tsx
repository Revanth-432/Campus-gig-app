import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Zap } from 'lucide-react-native';
import TaskCard from '../components/TaskCard';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function AsapTasksScreen() {
    const navigation = useNavigation<any>();
    const { session } = useAuth();
    const [tasks, setTasks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchAsapTasks = async () => {
        try {
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
            const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();

            let query = supabase
                .from('tasks')
                .select('*, profiles!creator_id(full_name, avatar_url, phone_number, email_contact)')
                .eq('status', 'open')
                .gte('deadline', startOfDay)
                .lte('deadline', endOfDay)
                .order('deadline', { ascending: true });

            if (session?.user?.id) {
                query = query.neq('creator_id', session.user.id);
            }

            const { data, error } = await query;

            if (error) throw error;
            setTasks(data || []);
        } catch (error: any) {
            console.error('Error fetching ASAP tasks:', error.message);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAsapTasks();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchAsapTasks();
    }, []);

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#ECFDF5', '#F3F4F6', '#EEF2FF']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ChevronLeft size={28} color="#111827" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleRow}>
                        <Zap size={24} color="#10B981" fill="#10B981" style={{ marginRight: 8 }} />
                        <Text style={styles.headerTitle}>Available Now</Text>
                    </View>
                    <Text style={styles.headerSubtitle}>Live feed of the newest campus requests.</Text>
                </View>

                {isLoading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color="#10B981" />
                    </View>
                ) : tasks.length === 0 ? (
                    <View style={styles.centerContainer}>
                        <Text style={styles.emptyText}>No ASAP tasks available right now.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={tasks}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => <TaskCard task={item} showActionButton={true} />}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />
                        }
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
    backButton: {
        marginBottom: 16,
        width: 40,
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: '#111827',
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
        marginTop: 4,
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
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
});
