import React, { useState, useEffect } from 'react';
import { challengesAPI } from '../services/api';
import { Trophy, CheckCircle, Flame, Star, Calendar, Sparkles } from 'lucide-react';

const Challenges = () => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const res = await challengesAPI.getAll();
      if (res.data.success) {
        setChallenges(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch challenges:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const handleEnroll = async (id) => {
    try {
      const res = await challengesAPI.enroll(id);
      if (res.data.success) {
        fetchChallenges();
      }
    } catch (err) {
      console.error('Enroll error:', err);
    }
  };

  const handleCompleteStep = async (id, currentProgress) => {
    try {
      setUpdatingId(id);
      const nextProgress = Math.min(100, currentProgress + 25);
      const res = await challengesAPI.updateProgress(id, nextProgress);
      if (res.data.success) {
        fetchChallenges();
        if (nextProgress === 100) {
          alert('Challenge Completed! You earned bonus points and XP.');
        }
      }
    } catch (err) {
      console.error('Update progress error:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center min-h-[80vh]">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 lg:p-8 flex flex-col gap-8 max-w-7xl mx-auto overflow-y-auto font-sans">
      <div>
        <h2 className="text-3xl font-bold font-sans text-dark-950 dark:text-white flex items-center gap-2">
          <Trophy className="w-8 h-8 text-brand-500" />
          <span>Environmental Challenges</span>
        </h2>
        <p className="text-dark-500 dark:text-dark-400 text-sm mt-1">
          Participate in climate campaigns. Advance your progress, complete initiatives, and unlock platform achievements.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {challenges.map((c) => {
          const isUpcoming = c.status === 'upcoming';
          const isCompleted = c.enrollmentDetails?.status === 'completed';
          const isEnrolled = c.isEnrolled;
          const progressVal = c.enrollmentDetails?.progress || 0;

          return (
            <div
              key={c.id}
              className={`glass-panel p-6 rounded-3xl flex flex-col justify-between gap-6 text-left relative overflow-hidden transition-all duration-300 border ${
                isCompleted 
                  ? 'border-brand-500/30' 
                  : isEnrolled 
                  ? 'border-blue-500/30 shadow-md shadow-blue-900/5' 
                  : 'border-dark-200 dark:border-dark-850'
              }`}
            >
              {/* Challenge Top Detail */}
              <div className="flex justify-between items-start gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${
                    isUpcoming ? 'text-amber-500' : 'text-brand-500'
                  }`}>
                    {c.category} Campaign
                  </span>
                  <h4 className="font-extrabold text-lg text-dark-950 dark:text-white leading-tight">
                    {c.title}
                  </h4>
                  <p className="text-xs text-dark-550 dark:text-dark-400 leading-relaxed mt-2">
                    {c.description}
                  </p>
                </div>

                <div className="flex-shrink-0 bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 py-2 px-3 rounded-lg text-center font-bold text-xs">
                  +{c.points_reward} XP
                </div>
              </div>

              {/* Progress and status actions footer */}
              <div className="border-t border-dark-100 dark:border-dark-850 pt-4 flex flex-col gap-4">
                {isEnrolled && (
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span>Campaign Progress</span>
                      <span>{Math.round(progressVal)}%</span>
                    </div>
                    <div className="w-full bg-dark-200 dark:bg-dark-800 rounded-full h-2">
                      <div
                        className="bg-brand-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressVal}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs text-dark-450">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Closes: {c.end_date}</span>
                  </span>

                  {isCompleted ? (
                    <span className="flex items-center gap-1 font-bold text-brand-500 bg-brand-500/10 py-1.5 px-3.5 rounded-xl border border-brand-500/20">
                      <CheckCircle className="w-4 h-4" /> Finished
                    </span>
                  ) : isEnrolled ? (
                    <button
                      onClick={() => handleCompleteStep(c.id, progressVal)}
                      disabled={updatingId === c.id}
                      className="btn-primary py-2 px-4 rounded-xl text-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {updatingId === c.id ? 'Saving...' : 'Update Step Progress'}
                    </button>
                  ) : isUpcoming ? (
                    <span className="font-semibold text-amber-500 bg-amber-500/15 py-1.5 px-3 rounded-lg border border-amber-500/20">
                      Starts Soon
                    </span>
                  ) : (
                    <button
                      onClick={() => handleEnroll(c.id)}
                      className="btn-primary py-2 px-4 rounded-xl text-xs bg-dark-800 hover:bg-dark-750 text-white border border-dark-700"
                    >
                      Enroll in Challenge
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Challenges;
