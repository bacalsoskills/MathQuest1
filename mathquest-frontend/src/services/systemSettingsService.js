import api from "./api";

const SystemSettingsService = {
  getSettings: async () => {
    try {
      const response = await api.get("/api/admin/settings");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      throw error;
    }
  },

  getActiveAnnouncements: async (userRole) => {
    try {
      const response = await api.get(
        `/api/admin/settings/announcements/active?userRole=${userRole}`
      );

      // Convert UTC dates to local dates
      const announcements = response.data.map((announcement) => {
        const processedAnnouncement = { ...announcement };

        if (announcement.startDate) {
          const startDate = new Date(announcement.startDate);
          processedAnnouncement.startDate = startDate.toISOString();
        }

        if (announcement.endDate) {
          const endDate = new Date(announcement.endDate);
          processedAnnouncement.endDate = endDate.toISOString();
        }

        return processedAnnouncement;
      });

      return announcements;
    } catch (error) {
      console.error("Failed to fetch active announcements:", error);
      throw error;
    }
  },

  updateSettings: async (settings) => {
    try {
      console.log("Updating settings with:", settings);
      const response = await api.put("/api/admin/settings", settings);
      return response.data;
    } catch (error) {
      console.error("Failed to update settings:", error);
      throw error;
    }
  },

  updateLogo: async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.post("/api/admin/settings/logo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to update system logo"
      );
    }
  },

  getLogo: async () => {
    try {
      const response = await api.get("/api/admin/settings/logo", {
        responseType: "arraybuffer",
      });
      const blob = new Blob([response.data], { type: "image/jpeg" });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("Failed to fetch system logo:", error);
      return null;
    }
  },

  addAnnouncement: async (announcement) => {
    try {
      // Ensure dates are in UTC before sending
      const announcementData = {
        ...announcement,
        startDate: announcement.startDate
          ? new Date(announcement.startDate).toISOString()
          : null,
        endDate: announcement.endDate
          ? new Date(announcement.endDate).toISOString()
          : null,
      };

      console.log("Sending announcement data:", announcementData);
      const response = await api.post(
        "/api/admin/settings/announcements",
        announcementData
      );
      return response.data;
    } catch (error) {
      console.error("Failed to add announcement:", error);
      throw error;
    }
  },

  updateAnnouncement: async (id, announcement) => {
    try {
      const response = await api.put(
        `/api/admin/settings/announcements/${id}`,
        announcement
      );
      return response.data;
    } catch (error) {
      console.error("Failed to update announcement:", error);
      throw error;
    }
  },

  deleteAnnouncement: async (id) => {
    try {
      const response = await api.delete(
        `/api/admin/settings/announcements/${id}`
      );
      return response.data;
    } catch (error) {
      console.error("Failed to delete announcement:", error);
      throw error;
    }
  },
};

export default SystemSettingsService;
