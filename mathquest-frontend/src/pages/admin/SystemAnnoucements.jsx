import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import SystemSettingsService from '../../services/systemSettingsService';
import { toast } from 'react-hot-toast';
import { FaSave, FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Header } from '../../ui/heading';
import { Button } from '../../ui/button';

const SystemAnnouncements = () => {
    const { isAdmin, currentUser } = useAuth();
    const [announcements, setAnnouncements] = useState([]);
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
        loadAnnouncements();
    }, []);

    const loadAnnouncements = async () => {
        try {
            const data = await SystemSettingsService.getAllAnnouncements();
            
            if (data) {
                setAnnouncements(data.map(announcement => ({
                    ...announcement,
                    // Keep the original ISO string format for display purposes
                    startDate: announcement.startDate || '',
                    endDate: announcement.endDate || ''
                })));
            }
        } catch (error) {
            console.error('Failed to load announcements:', error);
            toast.error('Failed to load announcements');
        } finally {
            setLoading(false);
        }
    };

    const handleNewAnnouncementChange = (e) => {
        const { name, value, type, checked } = e.target;
        
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

            const response = await SystemSettingsService.addAnnouncement(announcementData);

            // Refresh announcements to get the updated list
            await loadAnnouncements();

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
            await loadAnnouncements();
            toast.success('Announcement removed successfully');
        } catch (error) {
            console.error('Failed to remove announcement:', error);
            toast.error('Failed to remove announcement');
        }
    };

    const toggleAnnouncementActive = async (id, isActive) => {
        try {
            const announcement = announcements.find(a => a.id === id);
            if (announcement) {
                await SystemSettingsService.updateAnnouncement(id, {
                    ...announcement,
                    isActive
                });
                await loadAnnouncements();
                toast.success('Announcement status updated');
            }
        } catch (error) {
            console.error('Failed to update announcement status:', error);
            toast.error('Failed to update announcement status');
        }
    };

    const handleEditClick = (announcement) => {
        const formatDateForInput = (dateStr) => {
            if (!dateStr) return '';
            try {
                // Parse the date (already in ISO format from the service)
                const date = new Date(dateStr);
                
                // Convert to local timezone for the input
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                
                // Format as YYYY-MM-DDThh:mm
                return `${year}-${month}-${day}T${hours}:${minutes}`;
            } catch (error) {
                console.error('Date formatting error:', error);
                return '';
            }
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
                try {
                    // Create a date object from the local datetime string
                    const date = new Date(dateStr);
                    
                    // Check if the date is valid
                    if (isNaN(date.getTime())) {
                        throw new Error('Invalid date');
                    }
                    
                    // Get the timezone offset in minutes and convert to milliseconds
                    const timezoneOffset = date.getTimezoneOffset() * 60000;
                    
                    // Subtract the offset to get UTC time
                    const utcDate = new Date(date.getTime() - timezoneOffset);
                    
                    return utcDate.toISOString();
                } catch (error) {
                    console.error('Error formatting date:', error);
                    toast.error(`Invalid date format: ${dateStr}`);
                    return null;
                }
            };

            const startDateFormatted = formatDate(editingAnnouncement.startDate);
            const endDateFormatted = formatDate(editingAnnouncement.endDate);
            
            if (!startDateFormatted || !endDateFormatted) {
                return; // Stop if date formatting failed
            }

            const announcementData = {
                ...editingAnnouncement,
                startDate: startDateFormatted,
                endDate: endDateFormatted
            };

            await SystemSettingsService.updateAnnouncement(editingAnnouncement.id, announcementData);
            await loadAnnouncements();
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
        <div className="px-4 sm:px-6 lg:px-8 lg:py-8">
            <div className="max-w-7xl mx-auto">
                <Header type="h1" fontSize="5xl" weight="bold" className="mb-6 text-primary dark:text-white">System Announcements</Header>
                <div className="h-[1px] w-full bg-gradient-to-r from-[#18C8FF] via-[#4B8CFF] to-[#6D6DFF] mb-5 md:mb-8"></div>
                
                {/* Two-column layout for announcements */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left column: New Announcement Form */}
                    <div className="space-y-4">
                        <Header type="h2" fontSize="2xl" weight="bold" className="mb-6 text-primary dark:text-gray-300">Add New Announcement</Header>
                        <div className="border p-4 rounded-lg space-y-4 bg-white shadow-sm">
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Message <span className="text-red-500">*</span></label>
                                <ReactQuill
                                    value={newAnnouncement.message}
                                    onChange={handleQuillChange}
                                    modules={quillModules}
                                    formats={quillFormats}
                                    className="h-40 mb-12"
                                    placeholder="Enter announcement message..."
                                />
                            </div>
                            
                            <div className="grid grid-cols-1 gap-4">
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

                            <Button
                                type="button"
                                onClick={addAnnouncement}
                               variant="default"
                               size="sm"
                               className="w-full"
                            >
                                <FaPlus className="mr-2" />
                                Add Announcement
                            </Button>
                        </div>
                    </div>

                    {/* Right column: Existing Announcements */}
                    <div className="space-y-4">
                        <Header type="h2" fontSize="2xl" weight="bold" className="mb-6 text-primary dark:text-gray-300">Announcement List</Header>
                        <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2">
                            {announcements.length === 0 ? (
                                <div className="border p-4 rounded-lg bg-gray-50 text-center text-gray-500">
                                    No announcements available
                                </div>
                            ) : (
                                announcements.map((announcement, index) => {
                                    const now = new Date();
                                    const startDate = announcement.startDate ? new Date(announcement.startDate) : null;
                                    const endDate = announcement.endDate ? new Date(announcement.endDate) : null;
                                    
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
                                            <div key={announcement.id} className="border p-4 rounded-lg bg-white shadow-sm">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="font-medium">Edit Announcement</span>
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
                                                <div className="grid grid-cols-1 gap-4">
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
                                        <div key={announcement.id} className="border p-4 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${statusColor}`}>
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
                                                className="text-gray-700 mb-2 font-medium text-lg"
                                                dangerouslySetInnerHTML={{ __html: announcement.message }}
                                            />
                                            <div className="text-sm text-gray-500">
                                                <p>Visibility: {announcement.visibility}</p>
                                                <p>Start: {announcement.startDate ? new Date(announcement.startDate).toLocaleString('en-US', {
                                                    year: 'numeric',
                                                    month: '2-digit',
                                                    day: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    hour12: true,
                                                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                                                }) : 'No start date'}</p>
                                                <p>End: {announcement.endDate ? new Date(announcement.endDate).toLocaleString('en-US', {
                                                    year: 'numeric',
                                                    month: '2-digit',
                                                    day: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    hour12: true,
                                                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                                                }) : 'No end date'}</p>
                                                {/* <p>Created by: {announcement.createdBy}</p> */}
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
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemAnnouncements; 