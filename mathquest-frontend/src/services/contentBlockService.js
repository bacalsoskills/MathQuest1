import api from "./api";

const API_URL = "/content-blocks";

const contentBlockService = {
  // Get content blocks for a lesson
  getContentBlocksByLessonId: async (lessonId) => {
    try {
      const response = await api.get(`${API_URL}/lesson/${lessonId}`);

      return response.data;
    } catch (error) {
      console.error("Error fetching content blocks:", error);
      throw error;
    }
  },

  // Get a specific content block
  getContentBlockById: async (blockId) => {
    try {
      const response = await api.get(`${API_URL}/${blockId}`);

      return response.data;
    } catch (error) {
      console.error("Error fetching content block:", error);
      throw error;
    }
  },

  // Create a new content block
  createContentBlock: async (blockData) => {
    try {
      // Create form data for multipart file upload if needed
      const formData = new FormData();

      if (blockData.title) {
        formData.append("title", blockData.title);
      }

      if (blockData.subtitle) {
        formData.append("subtitle", blockData.subtitle);
      }

      formData.append("content", blockData.content || "");
      formData.append("lessonId", blockData.lessonId);

      if (blockData.structuredContent) {
        formData.append("structuredContent", blockData.structuredContent);
      }

      if (blockData.orderIndex !== undefined) {
        formData.append("orderIndex", blockData.orderIndex);
      }

      if (blockData.images) {
        formData.append("images", blockData.images);
      }

      if (blockData.attachments) {
        formData.append("attachments", blockData.attachments);
      }

      const response = await api.post(API_URL, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error creating content block:", error);
      throw error;
    }
  },

  // Update an existing content block
  updateContentBlock: async (blockId, blockData) => {
    try {
      const formData = new FormData();

      if (blockData.title) {
        formData.append("title", blockData.title);
      }

      if (blockData.subtitle) {
        formData.append("subtitle", blockData.subtitle);
      }

      formData.append("content", blockData.content || "");
      formData.append("lessonId", blockData.lessonId);

      if (blockData.structuredContent) {
        formData.append("structuredContent", blockData.structuredContent);
      }

      if (blockData.orderIndex !== undefined) {
        formData.append("orderIndex", blockData.orderIndex);
      }

      if (blockData.images) {
        formData.append("images", blockData.images);
      }

      if (blockData.attachments) {
        formData.append("attachments", blockData.attachments);
      }

      const response = await api.put(`${API_URL}/${blockId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error updating content block:", error);
      throw error;
    }
  },

  // Delete a content block
  deleteContentBlock: async (blockId) => {
    try {
      await api.delete(`${API_URL}/${blockId}`);

      return true;
    } catch (error) {
      console.error("Error deleting content block:", error);
      throw error;
    }
  },

  // Get content blocks with timestamps for a lesson
  getContentBlocksWithDates: async (lessonId) => {
    try {
      const response = await api.get(
        `${API_URL}/lesson/${lessonId}/with-dates`
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching content blocks with dates:", error);
      throw error;
    }
  },
};

export default contentBlockService;
