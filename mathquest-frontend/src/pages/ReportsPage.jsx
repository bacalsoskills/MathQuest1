import React from 'react';
import { useParams } from 'react-router-dom';
import ReportGenerator from '../components/reports/ReportGenerator';
import { Container, Row, Col } from 'react-bootstrap';


const ReportsPage = () => {
    const { classroomId } = useParams();
    const teacherId = localStorage.getItem('userId'); // Assuming we store the user ID in localStorage

    return (
        <Container fluid className="py-4">
            <Row>
                <Col>
                    <h2 className="mb-4">Reports</h2>
                    <ReportGenerator 
                        classroomId={classroomId}
                        teacherId={teacherId}
                    />
                </Col>
            </Row>
        </Container>
    );
};

export default ReportsPage; 