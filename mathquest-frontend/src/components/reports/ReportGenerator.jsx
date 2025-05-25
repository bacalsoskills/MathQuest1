import React, { useState, useEffect } from 'react';
import { reportService } from '../../services/reportService';
import { Card, Button, Form, Table, Alert } from 'react-bootstrap';

const ReportGenerator = ({ classroomId, teacherId }) => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        reportName: '',
        reportDescription: '',
        reportType: 'quiz-performance'
    });

    useEffect(() => {
        loadReports();
    }, [classroomId]);

    const loadReports = async () => {
        try {
            const data = await reportService.getReportsByClassroom(classroomId);
            setReports(data);
        } catch (error) {
            setError('Failed to load reports');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleGenerateReport = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { reportName, reportDescription, reportType } = formData;
            let report;

            if (reportType === 'quiz-performance') {
                report = await reportService.generateQuizPerformanceReport(
                    classroomId,
                    teacherId,
                    reportName,
                    reportDescription
                );
            } else {
                report = await reportService.generateClassRecordReport(
                    classroomId,
                    teacherId,
                    reportName,
                    reportDescription
                );
            }

            setReports(prev => [report, ...prev]);
            setFormData({
                reportName: '',
                reportDescription: '',
                reportType: 'quiz-performance'
            });
        } catch (error) {
            setError('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (reportId) => {
        try {
            const report = reports.find(r => r.id === reportId);
            const fileData = await reportService.downloadReportFile(reportId);
            
            // Create blob and download
            const blob = new Blob([fileData], { type: `application/${report.fileType}` });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = report.fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            setError('Failed to download report');
        }
    };

    return (
        <div className="report-generator">
            <Card className="mb-4">
                <Card.Header>Generate New Report</Card.Header>
                <Card.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    
                    <Form onSubmit={handleGenerateReport}>
                        <Form.Group className="mb-3">
                            <Form.Label>Report Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="reportName"
                                value={formData.reportName}
                                onChange={handleInputChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                name="reportDescription"
                                value={formData.reportDescription}
                                onChange={handleInputChange}
                                rows={3}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Report Type</Form.Label>
                            <Form.Select
                                name="reportType"
                                value={formData.reportType}
                                onChange={handleInputChange}
                            >
                                <option value="quiz-performance">Quiz Performance</option>
                                <option value="class-record">Class Record</option>
                            </Form.Select>
                        </Form.Group>

                        <Button 
                            type="submit" 
                            variant="primary"
                            disabled={loading}
                        >
                            {loading ? 'Generating...' : 'Generate Report'}
                        </Button>
                    </Form>
                </Card.Body>
            </Card>

            <Card>
                <Card.Header>Generated Reports</Card.Header>
                <Card.Body>
                    <Table striped hover>
                        <thead>
                            <tr>
                                <th>Report Name</th>
                                <th>Description</th>
                                <th>Generated On</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map(report => (
                                <tr key={report.id}>
                                    <td>{report.reportName}</td>
                                    <td>{report.reportDescription}</td>
                                    <td>{new Date(report.generatedAt).toLocaleDateString()}</td>
                                    <td>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => handleDownload(report.id)}
                                        >
                                            Download
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>
        </div>
    );
};

export default ReportGenerator; 