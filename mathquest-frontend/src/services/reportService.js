import api from "./api";

const API_URL = "/reports";

export const reportService = {
  generateQuizPerformanceReport: async (
    classroomId,
    teacherId,
    reportName,
    reportDescription
  ) => {
    console.log("Generating quiz performance report:", {
      classroomId,
      teacherId,
      reportName,
      reportDescription,
    });
    const response = await api.post(`${API_URL}/quiz-performance`, {
      classroomId,
      teacherId,
      reportName,
      reportDescription,
    });
    console.log("Quiz performance report response:", response.data);
    return response.data;
  },

  generateClassRecordReport: async (
    classroomId,
    teacherId,
    reportName,
    reportDescription,
    fileType = "EXCEL"
  ) => {
    console.log(
      "%c=== STARTING REPORT GENERATION API CALL ===",
      "background: purple; color: white"
    );

    // Validate input parameters
    if (!classroomId || !teacherId) {
      throw new Error(
        "Missing required parameters: classroomId and teacherId are required"
      );
    }

    // Validate report description is valid JSON
    let parsedDescription;
    try {
      parsedDescription = JSON.parse(reportDescription);
      if (!parsedDescription.students || !parsedDescription.headers) {
        throw new Error("Invalid report description: missing required data");
      }
    } catch (error) {
      console.error("Error parsing report description:", error);
      throw new Error("Invalid report description format");
    }

    console.log("Request parameters:", {
      classroomId,
      teacherId,
      reportName,
      reportDescription: parsedDescription,
      fileType,
    });

    try {
      const response = await api.post(`${API_URL}/class-record`, {
        classroomId,
        teacherId,
        reportName,
        reportDescription,
        fileType,
      });

      console.log(
        "%c=== REPORT GENERATION RESPONSE ===",
        "background: green; color: white"
      );
      console.log("Response data:", response.data);
      console.log("Generated report ID:", response.data.id);

      // Parse the report data if it's a string
      const report = response.data;
      if (typeof report.reportData === "string") {
        try {
          report.reportData = JSON.parse(report.reportData);

          // Parse nested JSON strings if they exist
          if (typeof report.reportData.students === "string") {
            report.reportData.students = JSON.parse(report.reportData.students);
          }
          if (typeof report.reportData.quizzes === "string") {
            report.reportData.quizzes = JSON.parse(report.reportData.quizzes);
          }

          // Parse quiz attempts for each student
          if (Array.isArray(report.reportData.students)) {
            report.reportData.students.forEach((student) => {
              if (typeof student.quizAttempts === "string") {
                student.quizAttempts = JSON.parse(student.quizAttempts);
              }
            });
          }
        } catch (error) {
          console.error("Error parsing report data:", error);
          // Don't throw here, just log the error and return the unparsed data
        }
      }

      return report;
    } catch (error) {
      console.error(
        "%c=== ERROR GENERATING REPORT ===",
        "background: red; color: white"
      );
      console.error("Error details:", error);

      // Add more specific error handling
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Server error response:", error.response.data);
        if (error.response.status === 401) {
          throw new Error("Session expired. Please log in again.");
        } else if (error.response.status === 400) {
          throw new Error(
            error.response.data.message || "Invalid request data"
          );
        } else if (error.response.status === 500) {
          throw new Error(
            "Server error while generating report. Please try again later."
          );
        }
      } else if (error.request) {
        throw new Error(
          "No response received from server. Please check your connection."
        );
      }

      throw error;
    }
  },

  getReport: async (reportId) => {
    console.log("Fetching report:", reportId);
    const response = await api.get(`${API_URL}/${reportId}`);
    console.log("Report response:", response.data);
    return response.data;
  },

  getReportsByTeacher: async (teacherId) => {
    console.log("Fetching reports for teacher:", teacherId);
    const response = await api.get(`${API_URL}/teacher/${teacherId}`);
    console.log("Teacher reports response:", response.data);
    return response.data;
  },

  getReportsByClassroom: async (classroomId) => {
    console.log("Fetching reports for classroom:", classroomId);
    const response = await api.get(`${API_URL}/classroom/${classroomId}`);
    console.log("Classroom reports response:", response.data);

    // Parse report data for each report
    const reports = response.data;
    reports.forEach((report) => {
      if (typeof report.reportData === "string") {
        try {
          report.reportData = JSON.parse(report.reportData);

          // Parse nested JSON strings if they exist
          if (typeof report.reportData.students === "string") {
            report.reportData.students = JSON.parse(report.reportData.students);
          }
          if (typeof report.reportData.quizzes === "string") {
            report.reportData.quizzes = JSON.parse(report.reportData.quizzes);
          }

          // Parse quiz attempts for each student
          report.reportData.students.forEach((student) => {
            if (typeof student.quizAttempts === "string") {
              student.quizAttempts = JSON.parse(student.quizAttempts);
            }
          });
        } catch (error) {
          console.error("Error parsing report data:", error);
        }
      }
    });

    return reports;
  },

  downloadReportFile: async (reportId) => {
    console.log("Downloading report file:", reportId);
    const response = await api.get(`${API_URL}/${reportId}/download`, {
      responseType: "blob",
    });
    console.log("Download response received");
    return response.data;
  },

  getClassRecordAnalytics: async (classroomId) => {
    console.log("Fetching analytics for classroom:", classroomId);
    const response = await api.get(
      `${API_URL}/classroom/${classroomId}/analytics`
    );
    console.log("Analytics response:", response.data);
    return response.data;
  },

  downloadAndSaveReportFile: async (reportId, fileName) => {
    try {
      console.log("[DOWNLOAD FILE] Starting download for report ID:", reportId);
      console.log("Original reportId passed to function:", reportId);
      console.log("Original fileName:", fileName);

      // Ensure reportId is a number or can be converted to one
      const validReportId = Number(reportId);
      if (isNaN(validReportId)) {
        console.error("Invalid report ID:", reportId);
        throw new Error(`Invalid report ID: ${reportId}`);
      }

      const downloadUrl = `${API_URL}/${validReportId}/download`;
      console.log("[DOWNLOAD URL]", downloadUrl);

      // Log call stack for debugging
      console.log("Call stack:", new Error().stack);

      const response = await api.get(downloadUrl, {
        responseType: "blob",
      });

      console.log("[DOWNLOAD RESPONSE] Status:", response.status);
      console.log("Response details:", {
        status: response.status,
        statusText: response.statusText,
        dataType: response.data?.type,
        dataSize: response.data?.size,
        headers: response.headers,
      });

      // Get content type from response headers or determine from file extension
      let contentType;
      if (fileName.endsWith(".xlsx")) {
        contentType =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      } else if (fileName.endsWith(".csv")) {
        contentType = "text/csv";
      } else {
        contentType = "application/octet-stream";
      }

      // Create a blob from the response data
      const blob = new Blob([response.data], { type: contentType });

      console.log("Created blob:", {
        size: blob.size,
        type: blob.type,
      });

      // Create a link element and trigger the download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return response.data;
    } catch (error) {
      console.error("Error downloading report file:", error);
      throw error;
    }
  },

  getClassroomQuizData: async (classroomId) => {
    console.log("Fetching classroom quiz data:", classroomId);
    const response = await api.get(
      `/quizzes/classroom/${classroomId}/all-data`
    );
    console.log("Classroom quiz data response:", response.data);
    return response.data;
  },

  getQuizAttempts: async (classroomId) => {
    console.log("Fetching quiz attempts for classroom:", classroomId);
    const response = await api.get(`/quiz-attempts/classroom/${classroomId}`);
    console.log("Quiz attempts response:", response.data);
    return response.data;
  },
};
