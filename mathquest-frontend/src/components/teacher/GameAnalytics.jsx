import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const GameAnalytics = ({ gameId }) => {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await api.get(`/games/${gameId}/analytics`);
        setAnalytics(response.data);
      } catch (error) {
        console.error('Error fetching game analytics:', error);
        setError('Failed to load analytics. Please try again later.');
        toast.error(error.response?.data?.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    if (gameId) {
      fetchAnalytics();
    }
  }, [gameId, token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
        <strong className="font-bold">Error! </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4" role="alert">
        <strong className="font-bold">No data available! </strong>
        <span className="block sm:inline">No analytics data available for this game yet.</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Game Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold mb-2">Total Plays</h3>
          <p className="text-3xl font-bold text-blue-700">{analytics.totalPlays || 0}</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="text-lg font-semibold mb-2">Average Score</h3>
          <p className="text-3xl font-bold text-green-700">{analytics.averageScore?.toFixed(1) || 0}</p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h3 className="text-lg font-semibold mb-2">Unique Players</h3>
          <p className="text-3xl font-bold text-purple-700">{analytics.uniquePlayers || 0}</p>
        </div>
      </div>
      
      {analytics.topStudents && analytics.topStudents.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">Top Performing Students</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 text-left font-semibold">Rank</th>
                  <th className="py-3 px-4 text-left font-semibold">Student</th>
                  <th className="py-3 px-4 text-right font-semibold">Best Score</th>
                  <th className="py-3 px-4 text-right font-semibold">Plays</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {analytics.topStudents.map((student, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-3 px-4">{index + 1}</td>
                    <td className="py-3 px-4 font-medium">{student.name}</td>
                    <td className="py-3 px-4 text-right font-bold">{student.bestScore}</td>
                    <td className="py-3 px-4 text-right">{student.plays}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {analytics.scoreDistribution && (
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">Score Distribution</h3>
          <div className="h-64 flex items-end space-x-2">
            {Object.entries(analytics.scoreDistribution).map(([range, count], index) => {
              const maxCount = Math.max(...Object.values(analytics.scoreDistribution));
              const height = (count / maxCount) * 100;
              
              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div 
                    className="w-full bg-blue-500 rounded-t-md"
                    style={{ height: `${height}%` }}
                  ></div>
                  <div className="mt-2 text-xs text-center">{range}</div>
                  <div className="text-sm font-bold">{count}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {analytics.completionRate && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-2">Game Completion Rate</h3>
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                    {(analytics.completionRate * 100).toFixed(1)}% Complete Games
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                <div 
                  style={{ width: `${analytics.completionRate * 100}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                ></div>
              </div>
            </div>
          </div>
        )}
        
        {analytics.averagePlayTime && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-2">Average Play Time</h3>
            <p className="text-3xl font-bold text-gray-700">
              {formatTime(analytics.averagePlayTime)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to format time in seconds to a readable format
const formatTime = (seconds) => {
  if (!seconds) return '0m 0s';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes}m ${remainingSeconds}s`;
};

export default GameAnalytics; 