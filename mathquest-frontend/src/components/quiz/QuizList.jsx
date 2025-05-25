import React, { useState, useEffect } from 'react';
import quizService from '../../services/quizService';
import { Card, Row, Col, Badge } from 'react-bootstrap';
import QuizManager from './QuizManager';

const QuizList = ({ classroomId, selectedQuizId }) => {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadQuizzes();
    }, [classroomId]);

    const loadQuizzes = async () => {
        try {
            setLoading(true);
            const data = await quizService.getAvailableQuizzes(classroomId);
            setQuizzes(data);
            
            // If we have a selectedQuizId but no matching quiz was found
            if (selectedQuizId && data.every(quiz => quiz.id !== parseInt(selectedQuizId))) {
                console.warn(`Quiz with ID ${selectedQuizId} not found in available quizzes`);
            }
        } catch (error) {
            console.error('Error loading quizzes:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div>Loading quizzes...</div>;
    }

    // If selectedQuizId is provided, filter to show only that quiz
    const displayQuizzes = selectedQuizId 
        ? quizzes.filter(quiz => quiz.id === parseInt(selectedQuizId)) 
        : quizzes;

    if (selectedQuizId && displayQuizzes.length === 0) {
        return <div>Quiz not found or not available.</div>;
    }

    return (
        <Row className="g-4">
            {displayQuizzes.map((quiz) => (
                <Col key={quiz.id} xs={12} md={6} lg={4}>
                    <Card className="h-100 shadow-sm">
                        <Card.Body>
                            <Card.Title>{quiz.quizName}</Card.Title>
                            <Card.Text>{quiz.description}</Card.Text>
                            <div className="mb-3">
                                <Badge bg="primary" className="me-2">
                                    {quiz.totalItems} items
                                </Badge>
                                <Badge bg="info" className="me-2">
                                    {quiz.timeLimitMinutes} minutes
                                </Badge>
                                {quiz.repeatable && (
                                    <Badge bg="success">Repeatable</Badge>
                                )}
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                                <small className="text-muted">
                                    Passing Score: {quiz.passingScore}
                                </small>
                                <QuizManager quizId={quiz.id} classroomId={classroomId} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            ))}
        </Row>
    );
};

export default QuizList; 