import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QuizList from '../components/quiz/QuizList';
import { Container, Row, Col } from 'react-bootstrap';

const QuizPage = () => {
    const { classroomId, quizId, attemptId } = useParams();
    const navigate = useNavigate();

    // Redirect to QuizAttemptPage if attemptId is present
    useEffect(() => {
        if (attemptId) {
            navigate(`/student/quizzes/${quizId}/attempt/${attemptId}`);
        }
    }, [attemptId, quizId, navigate]);

    return (
        <Container fluid className="py-4">
            <Row>
                <Col>
                    {quizId ? (
                        <QuizList classroomId={classroomId} selectedQuizId={quizId} />
                    ) : (
                        <QuizList classroomId={classroomId} />
                    )}
                </Col>
            </Row>
        </Container>
    );
};

export default QuizPage; 