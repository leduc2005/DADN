import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, Bell, Plus } from "lucide-react-native";

interface HomeScreenProps {
    navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const projects = [
        {
            id: '1',
            title: "Belt Drive System Design",
            date: "March 15, 2026",
            status: "IN PROGRESS",
        },
        {
            id: '2',
            title: "Gear Transmission Calculation",
            date: "March 10, 2026",
            status: "COMPLETED",
        },
        {
            id: '3',
            title: "Chain Drive Mechanism",
            date: "February 28, 2026",
            status: "COMPLETED",
        },
    ];

    const renderItem = ({ item }: { item: any }) => {
        const isInProgress = item.status === "IN PROGRESS";
        return (
            <TouchableOpacity style={styles.projectCard}>
                <Text style={styles.projectTitle}>{item.title}</Text>
                <Text style={styles.projectDate}>{item.date}</Text>
                <View style={[styles.statusBadge, isInProgress ? styles.statusBadgeInProgress : styles.statusBadgeCompleted]}>
                    <Text style={[styles.statusText, isInProgress ? styles.statusTextInProgress : styles.statusTextCompleted]}>
                        {item.status}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Welcome, Student</Text>
                <TouchableOpacity style={styles.notificationButton}>
                    <Bell size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                    <Search size={20} color="#9ca3af" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search calculations..."
                        placeholderTextColor="#9ca3af"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                {/* Optional filter button could go here */}
            </View>

            {/* Project List */}
            <FlatList
                data={projects}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContainer}
            />

            {/* FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate("Input")}
                activeOpacity={0.8}
            >
                <Plus size={30} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb', // gray-50
    },
    header: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 24,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb', // gray-200
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111827', // gray-900
    },
    notificationButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ef4444', // red-500
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    searchInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#d1d5db', // gray-300
        borderRadius: 8,
        paddingHorizontal: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: 44,
        fontSize: 16,
        color: '#111827',
    },
    listContainer: {
        padding: 24,
        gap: 12,
    },
    projectCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        marginBottom: 12, // fallback for gap
    },
    projectTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    projectDate: {
        fontSize: 14,
        color: '#6b7280', // gray-500
        marginBottom: 12,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
    },
    statusBadgeInProgress: {
        backgroundColor: '#dbeafe', // blue-100
    },
    statusBadgeCompleted: {
        backgroundColor: '#dcfce3', // green-100
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    statusTextInProgress: {
        color: '#1d4ed8', // blue-700
    },
    statusTextCompleted: {
        color: '#15803d', // green-700
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#2563eb', // blue-600
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 6,
    },
});
