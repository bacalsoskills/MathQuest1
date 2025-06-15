import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import SystemSettingsService from '../../services/systemSettingsService';
import { toast } from 'react-hot-toast';
import { FaSave, FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const SystemSettings = () => {
    const { isAdmin, currentUser } = useAuth();
    const [settings, setSettings] = useState({
        defaultLanguage: 'en',
        timezone: 'EST',
        themeMode: 'neutral',
        announcements: []
    });
    const [loading, setLoading] = useState(true);
    const [editingAnnouncement, setEditingAnnouncement] = useState(null);
    const [newAnnouncement, setNewAnnouncement] = useState({
        message: '',
        startDate: '',
        endDate: '',
        visibility: 'EVERYONE',
        isActive: true
    });

    // Quill modules configuration
    const quillModules = {
        toolbar: [
            ['bold', 'italic', 'underline', 'link'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['clean']
        ]
    };

    const quillFormats = [
        'bold', 'italic', 'underline', 'link',
        'list', 'bullet'
    ];

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await SystemSettingsService.getSettings();
            console.log('Loaded settings:', data);
            if (data) {
                setSettings({
                    ...data,
                    announcements: data.announcements?.map(announcement => ({
                        ...announcement,
                        startDate: announcement.startDate ? new Date(announcement.startDate).toISOString().slice(0, 16) : '',
                        endDate: announcement.endDate ? new Date(announcement.endDate).toISOString().slice(0, 16) : ''
                    })) || []
                });
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleNewAnnouncementChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        // Add logging for date selection
        if (name === 'startDate' || name === 'endDate') {
            console.log(`Selected ${name}:`, {
                rawValue: value,
                parsedDate: new Date(value),
                localTime: new Date(value).toLocaleString(),
                utcTime: new Date(value).toISOString()
            });
        }
        
        setNewAnnouncement(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleQuillChange = (content) => {
        setNewAnnouncement(prev => ({
            ...prev,
            message: content
        }));
    };

    const addAnnouncement = async () => {
        if (!newAnnouncement.message.trim()) {
            toast.error('Announcement message is required');
            return;
        }

        if (!newAnnouncement.startDate || !newAnnouncement.endDate) {
            toast.error('Start date and end date are required');
            return;
        }

        try {
            // Format the dates to UTC
            const formatDate = (dateStr) => {
                if (!dateStr) return null;
                // Create a date object from the local datetime
                const date = new Date(dateStr);
                // Get the timezone offset in minutes and convert to milliseconds
                const timezoneOffset = date.getTimezoneOffset() * 60000;
                // Subtract the offset to get UTC time
                const utcDate = new Date(date.getTime() - timezoneOffset);
                return utcDate.toISOString();
            };

            const announcementData = {
                ...newAnnouncement,
                startDate: formatDate(newAnnouncement.startDate),
                endDate: formatDate(newAnnouncement.endDate),
                createdBy: currentUser.username,
                visibility: newAnnouncement.visibility || 'EVERYONE',
                isActive: true // Always set to true for new announcements
            };

            console.log('Sending announcement data:', {
                ...announcementData,
                startDateLocal: newAnnouncement.startDate ? new Date(newAnnouncement.startDate).toLocaleString() : null,
                endDateLocal: newAnnouncement.endDate ? new Date(newAnnouncement.endDate).toLocaleString() : null,
                startDateUTC: announcementData.startDate,
                endDateUTC: announcementData.endDate,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            });

            const response = await SystemSettingsService.addAnnouncement(announcementData);
            console.log('Added announcement:', response);

            // Refresh settings to get the updated list
            await loadSettings();

            setNewAnnouncement({
                message: '',
                startDate: '',
                endDate: '',
                visibility: 'EVERYONE',
                isActive: true
            });

            toast.success('Announcement added successfully');
        } catch (error) {
            console.error('Failed to add announcement:', error);
            toast.error('Failed to add announcement');
        }
    };

    const removeAnnouncement = async (id) => {
        try {
            await SystemSettingsService.deleteAnnouncement(id);
            await loadSettings();
            toast.success('Announcement removed successfully');
        } catch (error) {
            console.error('Failed to remove announcement:', error);
            toast.error('Failed to remove announcement');
        }
    };

    const toggleAnnouncementActive = async (id, isActive) => {
        try {
            const announcement = settings.announcements.find(a => a.id === id);
            if (announcement) {
                await SystemSettingsService.updateAnnouncement(id, {
                    ...announcement,
                    isActive
                });
                await loadSettings();
                toast.success('Announcement status updated');
            }
        } catch (error) {
            console.error('Failed to update announcement status:', error);
            toast.error('Failed to update announcement status');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const submitData = {
                ...settings,
                announcements: settings.announcements.map(announcement => ({
                    ...announcement,
                    startDate: announcement.startDate ? new Date(announcement.startDate).toISOString() : null,
                    endDate: announcement.endDate ? new Date(announcement.endDate).toISOString() : null
                }))
            };
            await SystemSettingsService.updateSettings(submitData);
            toast.success('Settings updated successfully');
        } catch (error) {
            console.error('Failed to update settings:', error);
            toast.error('Failed to update settings');
        }
    };

    const handleEditClick = (announcement) => {
        const formatDateForInput = (dateStr) => {
            if (!dateStr) return '';
            const date = new Date(dateStr + 'Z');
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }).replace(',', 'T');
        };

        setEditingAnnouncement({
            ...announcement,
            startDate: formatDateForInput(announcement.startDate),
            endDate: formatDateForInput(announcement.endDate)
        });
    };

    const handleEditChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditingAnnouncement(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleEditQuillChange = (content) => {
        setEditingAnnouncement(prev => ({
            ...prev,
            message: content
        }));
    };

    const saveEdit = async () => {
        if (!editingAnnouncement.message.trim()) {
            toast.error('Announcement message is required');
            return;
        }

        if (!editingAnnouncement.startDate || !editingAnnouncement.endDate) {
            toast.error('Start date and end date are required');
            return;
        }

        try {
            const formatDate = (dateStr) => {
                if (!dateStr) return null;
                const date = new Date(dateStr);
                const timezoneOffset = date.getTimezoneOffset() * 60000;
                const utcDate = new Date(date.getTime() - timezoneOffset);
                return utcDate.toISOString();
            };

            const announcementData = {
                ...editingAnnouncement,
                startDate: formatDate(editingAnnouncement.startDate),
                endDate: formatDate(editingAnnouncement.endDate)
            };

            await SystemSettingsService.updateAnnouncement(editingAnnouncement.id, announcementData);
            await loadSettings();
            setEditingAnnouncement(null);
            toast.success('Announcement updated successfully');
        } catch (error) {
            console.error('Failed to update announcement:', error);
            toast.error('Failed to update announcement');
        }
    };

    const cancelEdit = () => {
        setEditingAnnouncement(null);
    };

    if (!isAdmin()) {
        return <div>Access denied</div>;
    }

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8">System Settings</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Language and Timezone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Default Language</label>
                        <select
                            name="defaultLanguage"
                            value={settings.defaultLanguage}
                            onChange={handleInputChange}
                            className="w-full p-2 border rounded bg-gray-100"
                            disabled
                        >
                            <option value="en">English</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Timezone</label>
                        <select
                            name="timezone"
                            value={settings.timezone}
                            onChange={handleInputChange}
                            className="w-full p-2 border rounded bg-gray-100"
                            disabled
                            title="Soon: Future Implementation"
                        >
                            <option value="EST">EST</option>
                        </select>
                    </div>
                </div>

                {/* Theme Mode */}
                <div>
                    <label className="block text-sm font-medium mb-2">System Theme Mode</label>
                    <select
                        name="themeMode"
                        value={settings.themeMode}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded bg-gray-100"
                        disabled
                        title="Soon: Future Implementation"
                    >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="neutral">Neutral</option>
                    </select>
                    <p className="text-sm text-gray-500 mt-1">This setting will apply to all users</p>
                </div>

                {/* Announcements */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">System Announcements</h2>
                    
                    {/* New Announcement Form */}
                    <div className="border p-4 rounded-lg space-y-4">
                        <h3 className="font-medium">Add New Announcement</h3>
                        <div className="mb-4">
                            <ReactQuill
                                value={newAnnouncement.message}
                                onChange={handleQuillChange}
                                modules={quillModules}
                                formats={quillFormats}
                                className="h-32 mb-12"
                            />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Start Date <span className="text-red-500">*</span></label>
                                <input
                                    type="datetime-local"
                                    name="startDate"
                                    value={newAnnouncement.startDate}
                                    onChange={handleNewAnnouncementChange}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">End Date <span className="text-red-500">*</span></label>
                                <input
                                    type="datetime-local"
                                    name="endDate"
                                    value={newAnnouncement.endDate}
                                    onChange={handleNewAnnouncementChange}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Visibility</label>
                                <select
                                    name="visibility"
                                    value={newAnnouncement.visibility}
                                    onChange={handleNewAnnouncementChange}
                                    className="w-full p-2 border rounded"
                                >
                                    <option value="EVERYONE">Everyone</option>
                                    <option value="TEACHERS">Teachers Only</option>
                                    <option value="STUDENTS">Students Only</option>
                                </select>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={addAnnouncement}
                            className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center justify-center"
                        >
                            <FaPlus className="mr-2" />
                            Add Announcement
                        </button>
                    </div>

                    {/* Existing Announcements */}
                    <div className="space-y-4">
                        {settings.announcements.map((announcement, index) => {
                            const now = new Date();
                            const startDate = announcement.startDate ? new Date(announcement.startDate + 'Z') : null;
                            const endDate = announcement.endDate ? new Date(announcement.endDate + 'Z') : null;
                            
                            let status = 'active';
                            let statusColor = 'bg-green-100 text-green-800';
                            let statusText = 'Active';
                            
                            if (startDate && now < startDate) {
                                status = 'scheduled';
                                statusColor = 'bg-blue-100 text-blue-800';
                                statusText = 'Scheduled';
                            } else if (endDate && now > endDate) {
                                status = 'expired';
                                statusColor = 'bg-gray-100 text-gray-800';
                                statusText = 'Expired';
                            }

                            if (editingAnnouncement?.id === announcement.id) {
                                return (
                                    <div key={announcement.id} className="border p-4 rounded-lg">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-medium">Edit Announcement {index + 1}</span>
                                            <div className="space-x-2">
                                                <button
                                                    type="button"
                                                    onClick={saveEdit}
                                                    className="text-green-500 hover:text-green-700"
                                                >
                                                    <FaSave />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={cancelEdit}
                                                    className="text-gray-500 hover:text-gray-700"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mb-4">
                                            <ReactQuill
                                                value={editingAnnouncement.message}
                                                onChange={handleEditQuillChange}
                                                modules={quillModules}
                                                formats={quillFormats}
                                                className="h-32 mb-12"
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Start Date <span className="text-red-500">*</span></label>
                                                <input
                                                    type="datetime-local"
                                                    name="startDate"
                                                    value={editingAnnouncement.startDate}
                                                    onChange={handleEditChange}
                                                    className="w-full p-2 border rounded"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-2">End Date <span className="text-red-500">*</span></label>
                                                <input
                                                    type="datetime-local"
                                                    name="endDate"
                                                    value={editingAnnouncement.endDate}
                                                    onChange={handleEditChange}
                                                    className="w-full p-2 border rounded"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <label className="block text-sm font-medium mb-2">Visibility</label>
                                            <select
                                                name="visibility"
                                                value={editingAnnouncement.visibility}
                                                onChange={handleEditChange}
                                                className="w-full p-2 border rounded"
                                            >
                                                <option value="EVERYONE">Everyone</option>
                                                <option value="TEACHERS">Teachers Only</option>
                                                <option value="STUDENTS">Students Only</option>
                                            </select>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={announcement.id} className="border p-4 rounded-lg">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center">
                                            <span className="font-medium">Announcement {index + 1}</span>
                                            <span className={`ml-2 px-2 py-1 rounded-full text-xs ${statusColor}`}>
                                                {statusText}
                                            </span>
                                        </div>
                                        <div className="space-x-2">
                                            <button
                                                type="button"
                                                onClick={() => handleEditClick(announcement)}
                                                className="text-blue-500 hover:text-blue-700"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => removeAnnouncement(announcement.id)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </div>
                                    <div 
                                        className="text-gray-700 mb-2"
                                        dangerouslySetInnerHTML={{ __html: announcement.message }}
                                    />
                                    <div className="text-sm text-gray-500">
                                        <p>Visibility: {announcement.visibility}</p>
                                        <p>Start: {announcement.startDate ? new Date(announcement.startDate + 'Z').toLocaleString('en-US', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: true,
                                            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                                        }) : 'No start date'}</p>
                                        <p>End: {announcement.endDate ? new Date(announcement.endDate + 'Z').toLocaleString('en-US', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: true,
                                            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                                        }) : 'No end date'}</p>
                                        <p>Created by: {announcement.createdBy}</p>
                                        {status === 'scheduled' && (
                                            <p className="text-blue-600 mt-1">
                                                This announcement will be visible to {announcement.visibility.toLowerCase()} when it starts
                                            </p>
                                        )}
                                        {status === 'expired' && (
                                            <p className="text-gray-600 mt-1">
                                                This announcement is no longer visible to users
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </form>
        </div>
    );
};

export default SystemSettings; 