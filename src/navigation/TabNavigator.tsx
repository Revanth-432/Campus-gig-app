import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Home,
    Plus,
    ListTodo,
    ClipboardList,
    User
} from 'lucide-react-native';

import DashboardScreen from '../screens/DashboardScreen';
import PostTaskScreen from '../screens/PostTaskScreen';
import TasksScreen from '../screens/TasksScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MyTasksScreen from '../screens/MyTasksScreen';

const Tab = createBottomTabNavigator();

// Placeholder screens for new tabs
const PlaceholderScreen = () => <View style={{ flex: 1, backgroundColor: '#F9FAFB' }} />;

function CustomTabBar({ state, descriptors, navigation }: any) {
    const insets = useSafeAreaInsets();

    const tabs = [
        { name: 'Dashboard', label: 'Home', icon: Home },
        { name: 'PostTask', label: 'Post', icon: Plus },
        { name: 'Tasks', label: 'Tasks', icon: ListTodo },
        { name: 'MyTasks', label: 'My Tasks', icon: ClipboardList },
        { name: 'Profile', label: 'Profile', icon: User },
    ];

    return (
        <View style={[styles.staticFooter, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 10) }]}>
            {tabs.map((tab, index) => {
                const isFocused = state.routes[state.index].name === tab.name;

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: state.routes.find((r: any) => r.name === tab.name)?.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(tab.name);
                    }
                };

                const Icon = tab.icon;
                const color = isFocused ? '#FFFFFF' : '#64748B';

                return (
                    <TouchableOpacity
                        key={tab.name}
                        accessibilityRole="button"
                        accessibilityState={isFocused ? { selected: true } : {}}
                        onPress={onPress}
                        style={styles.footerTab}
                    >
                        <Icon size={22} color={color} />
                        <Text style={[styles.footerTabText, isFocused && { color: '#FFFFFF' }]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

export default function TabNavigator() {
    return (
        <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tab.Screen name="Dashboard" component={DashboardScreen} />
            <Tab.Screen name="PostTask" component={PostTaskScreen} />
            <Tab.Screen name="Tasks" component={TasksScreen} />
            <Tab.Screen name="MyTasks" component={MyTasksScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    staticFooter: {
        backgroundColor: '#0F111A', // Immersive dark background matching the mock
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#1F2937',
    },
    footerTab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerTabText: {
        fontSize: 10,
        color: '#64748B',
        marginTop: 6,
        fontWeight: '500',
    }
});
