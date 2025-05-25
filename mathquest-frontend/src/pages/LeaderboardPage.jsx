import React from 'react';
import { useParams } from 'react-router-dom';
import Leaderboard from '../components/leaderboard/Leaderboard';

const LeaderboardPage = () => {
    const { classroomId } = useParams();

    return (
        <div className="min-h-screen bg-gray-100">
            <Leaderboard classroomId={classroomId} />
        </div>
    );
};

export default LeaderboardPage; 