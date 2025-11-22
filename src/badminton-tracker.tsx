import { useState, useEffect, FormEvent } from 'react';
import { Trophy, IndianRupee, X, Users, History, Calendar, CheckCircle } from 'lucide-react';

interface User {
  password: string;
  displayName: string;
}

interface Match {
  id: number;
  type: 'match' | 'fine';
  player?: string;
  amount?: number;
  reason?: string;
  scores?: { aniketnayak: number; souravssk: number };
  winner?: string;
  date: string;
}

interface Settlement {
  id: number;
  date: string;
  finesBeforeSettlement: { aniketnayak: number; souravssk: number };
  balance: number;
  payer: string;
  receiver: string;
  transactionId: string;
  settled: boolean;
}

export default function BadmintonTracker() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [fines, setFines] = useState<Record<string, number>>({ aniketnayak: 0, souravssk: 0 });
  const [matches, setMatches] = useState<Match[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [activeTab, setActiveTab] = useState('home');
  const [showNewMatch, setShowNewMatch] = useState(false);
  const [showNewFine, setShowNewFine] = useState(false);
  const [showSettlement, setShowSettlement] = useState(false);
  const [showMonthlyReport, setShowMonthlyReport] = useState(false);
  const [matchScores, setMatchScores] = useState({ aniketnayak: '', souravssk: '' });
  const [fineAmount, setFineAmount] = useState('10');
  const [fineReason, setFineReason] = useState('');
  const [fineDate, setFineDate] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  const users: Record<'aniketnayak' | 'souravssk', User> = {
    aniketnayak: { password: 'aniket123', displayName: 'Aniket' },
    souravssk: { password: 'sourav123', displayName: 'Sourav' }
  };

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const finesData = localStorage.getItem('fines');
      const matchesData = localStorage.getItem('matches');
      const settlementsData = localStorage.getItem('settlements');
      
      if (finesData) {
        setFines(JSON.parse(finesData));
      }
      if (matchesData) {
        setMatches(JSON.parse(matchesData));
      }
      if (settlementsData) {
        setSettlements(JSON.parse(settlementsData));
      }
    } catch (error) {
      console.log('No existing data, starting fresh');
    }
  };

  const saveData = async (newFines?: Record<string, number>, newMatches?: Match[], newSettlements?: Settlement[]) => {
    try {
      localStorage.setItem('fines', JSON.stringify(newFines || fines));
      localStorage.setItem('matches', JSON.stringify(newMatches || matches));
      localStorage.setItem('settlements', JSON.stringify(newSettlements || settlements));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const handleLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loginUsername && users[loginUsername as 'aniketnayak' | 'souravssk'] && users[loginUsername as 'aniketnayak' | 'souravssk'].password === loginPassword) {
      setCurrentUser(loginUsername);
      setLoginUsername('');
      setLoginPassword('');
    } else {
      alert('Invalid username or password');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('home');
  };

  const addFine = async () => {
    if (!fineAmount || !fineReason || !currentUser) {
      alert('Please enter fine amount and reason');
      return;
    }

    // Validate that date is within 7 days
    const selectedDate = fineDate ? new Date(fineDate) : new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    const daysBack = Math.floor((today.getTime() - selectedDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysBack < 0 || daysBack > 7) {
      alert('Fine date must be within the last 7 days');
      return;
    }

    const newFines = { ...fines };
    newFines[currentUser as 'aniketnayak' | 'souravssk'] += parseInt(fineAmount);
    
    const newMatch: Match = {
      id: Date.now(),
      type: 'fine',
      player: currentUser,
      amount: parseInt(fineAmount),
      reason: fineReason,
      date: new Date(selectedDate).toISOString()
    };
    
    const newMatches = [newMatch, ...matches];
    
    setFines(newFines);
    setMatches(newMatches);
    await saveData(newFines, newMatches, settlements);
    
    setShowNewFine(false);
    setFineAmount('10');
    setFineReason('');
    setFineDate('');
  };

  const addMatch = async () => {
    const score1 = parseInt(matchScores.aniketnayak);
    const score2 = parseInt(matchScores.souravssk);
    
    if (isNaN(score1) || isNaN(score2)) {
      alert('Please enter valid scores');
      return;
    }

    const winner = score1 > score2 ? 'aniketnayak' : 'souravssk';
    
    const newMatch: Match = {
      id: Date.now(),
      type: 'match',
      scores: { aniketnayak: score1, souravssk: score2 },
      winner,
      date: new Date().toISOString()
    };
    
    const newMatches = [newMatch, ...matches];
    setMatches(newMatches);
    await saveData(fines, newMatches, settlements);
    
    setShowNewMatch(false);
    setMatchScores({ aniketnayak: '', souravssk: '' });
  };

  const handleSettlement = async () => {
    if (!transactionId.trim()) {
      alert('Please enter a transaction ID');
      return;
    }

    const fineBalance = fines.aniketnayak - fines.souravssk;
    
    const settlement: Settlement = {
      id: Date.now(),
      date: new Date().toISOString(),
      finesBeforeSettlement: { aniketnayak: fines.aniketnayak, souravssk: fines.souravssk },
      balance: Math.abs(fineBalance),
      payer: fineBalance > 0 ? 'aniketnayak' : 'souravssk',
      receiver: fineBalance > 0 ? 'souravssk' : 'aniketnayak',
      transactionId: transactionId,
      settled: true
    };

    const newSettlements: Settlement[] = [settlement, ...settlements];
    const newFines = { aniketnayak: 0, souravssk: 0 };
    
    setSettlements(newSettlements);
    setFines(newFines);
    await saveData(newFines, matches, newSettlements);
    
    setShowSettlement(false);
    setTransactionId('');
    alert('Settlement recorded successfully!');
  };

  const getMonthlyReport = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const monthMatches = matches.filter((m: Match) => {
      const matchDate = new Date(m.date);
      return matchDate >= startDate && matchDate <= endDate;
    });

    const monthSettlements = settlements.filter((s: Settlement) => {
      const settlementDate = new Date(s.date);
      return settlementDate >= startDate && settlementDate <= endDate;
    });

    const fineData = {
      aniketnayak: 0,
      souravssk: 0
    };

    const matchData = {
      aniketnayak: { wins: 0, losses: 0 },
      souravssk: { wins: 0, losses: 0 }
    };

    monthMatches.forEach((match: Match) => {
      if (match.type === 'fine' && match.player && match.amount) {
        const player = match.player as 'aniketnayak' | 'souravssk';
        fineData[player] += match.amount;
      } else if (match.type === 'match') {
        if (match.winner === 'aniketnayak') {
          matchData.aniketnayak.wins++;
          matchData.souravssk.losses++;
        } else {
          matchData.souravssk.wins++;
          matchData.aniketnayak.losses++;
        }
      }
    });

    return { fineData, matchData, monthMatches, monthSettlements };
  };

  const getStats = () => {
    const matchHistory = matches.filter(m => m.type === 'match');
    const stats = {
      aniketnayak: { wins: 0, losses: 0, totalPoints: 0 },
      souravssk: { wins: 0, losses: 0, totalPoints: 0 }
    };

    matchHistory.forEach((match: Match) => {
      if (match.winner === 'aniketnayak') {
        stats.aniketnayak.wins++;
        stats.souravssk.losses++;
      } else {
        stats.souravssk.wins++;
        stats.aniketnayak.losses++;
      }
      if (match.scores) {
        stats.aniketnayak.totalPoints += match.scores.aniketnayak;
        stats.souravssk.totalPoints += match.scores.souravssk;
      }
    });

    return stats;
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-IN', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Login Screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 dark:from-green-900 dark:to-blue-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Badminton Tracker</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Track fines & scores</p>
            
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Username</label>
              <select
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select User</option>
                <option value="aniketnayak">Aniket</option>
                <option value="souravssk">Sourav</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter password"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-200 shadow-lg"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  const stats = getStats();
  const otherUser = currentUser === 'aniketnayak' ? 'souravssk' : 'aniketnayak';
  const fineBalance = fines[currentUser] - fines[otherUser];

  // Main App
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-blue-500 dark:from-green-700 dark:to-blue-700 text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h1 className="text-2xl font-bold">🏸 Badminton Tracker</h1>
              <p className="text-sm opacity-90">Hello, {currentUser && users[currentUser as 'aniketnayak' | 'souravssk'].displayName}!</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-white dark:bg-slate-700 bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg text-sm transition"
            >
              Logout
            </button>
          </div>
          <div className="flex items-center text-sm opacity-90">
            <Calendar className="w-4 h-4 mr-2" />
            <span>{getCurrentDate()}</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex-1 py-4 text-center font-medium transition ${
              activeTab === 'home' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <Trophy className="w-5 h-5 mx-auto mb-1" />
            Home
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-4 text-center font-medium transition ${
              activeTab === 'stats' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <Users className="w-5 h-5 mx-auto mb-1" />
            Stats
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-4 text-center font-medium transition ${
              activeTab === 'history' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <History className="w-5 h-5 mx-auto mb-1" />
            History
          </button>
          <button
            onClick={() => setActiveTab('settlements')}
            className={`flex-1 py-4 text-center font-medium transition ${
              activeTab === 'settlements' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            <CheckCircle className="w-5 h-5 mx-auto mb-1" />
            Settled
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 pb-20">
        {/* Home Tab */}
        {activeTab === 'home' && (
          <div className="space-y-4">
            {/* Fine Balance Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                  <IndianRupee className="w-5 h-5 mr-2" />
                  Fine Balance
                </h2>
                <button
                  onClick={() => setShowSettlement(true)}
                  className="text-sm bg-green-600 dark:bg-green-700 hover:bg-green-700 text-white px-3 py-1 rounded-lg"
                >
                  Settle
                </button>
              </div>
              
              <div className="text-center">
                {fineBalance === 0 ? (
                  <p className="text-gray-600 dark:text-gray-300 text-lg">All settled! 🎉</p>
                ) : fineBalance > 0 ? (
                  <div>
                    <p className="text-gray-600 dark:text-gray-300 mb-2">You owe {users[otherUser].displayName}</p>
                    <p className="text-4xl font-bold text-red-600">₹{Math.abs(fineBalance)}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-600 dark:text-gray-300 mb-2">{users[otherUser].displayName} owes you</p>
                    <p className="text-4xl font-bold text-green-600">₹{Math.abs(fineBalance)}</p>
                  </div>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t flex justify-between text-sm text-gray-600 dark:text-gray-300">
                <div>Your fines: ₹{fines[currentUser]}</div>
                <div>{users[otherUser].displayName}'s fines: ₹{fines[otherUser]}</div>
              </div>
            </div>

            {/* Monthly Report Button */}
            <button
              onClick={() => setShowMonthlyReport(true)}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white rounded-xl p-4 shadow-md transition flex items-center justify-center"
            >
              <Calendar className="w-5 h-5 mr-2" />
              <span className="font-semibold">View Monthly Report</span>
            </button>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowNewMatch(true)}
                className="bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 text-white rounded-xl p-6 shadow-md transition flex flex-col items-center"
              >
                <Trophy className="w-8 h-8 mb-2" />
                <span className="font-semibold">New Match</span>
              </button>
              <button
                onClick={() => setShowNewFine(true)}
                className="bg-red-600 dark:bg-red-700 hover:bg-red-700 text-white rounded-xl p-6 shadow-md transition flex flex-col items-center"
              >
                <IndianRupee className="w-8 h-8 mb-2" />
                <span className="font-semibold">Add Fine</span>
              </button>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
              <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">Recent Activity</h3>
              {matches.slice(0, 5).length === 0 ? (
                <p className="text-gray-500 text-center py-4">No activity yet</p>
              ) : (
                <div className="space-y-3">
                  {matches.slice(0, 5).map(match => (
                    <div key={match.id} className="border-l-4 border-blue-500 pl-4 py-2">
                      {match.type === 'match' ? (
                        <div>
                          <p className="font-semibold">
                            {match.winner === 'aniketnayak' ? '🏆 Aniket' : '🏆 Sourav'} won
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Score: {match.scores?.aniketnayak} - {match.scores?.souravssk}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(match.date).toLocaleString()}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-semibold">
                            💰 {match.player && users[match.player as 'aniketnayak' | 'souravssk'].displayName} - Fine
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">₹{match.amount} - {match.reason}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(match.date).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Aniket Stats */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
                <h3 className="font-bold text-lg mb-4 text-blue-600">Aniket</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Wins</p>
                    <p className="text-2xl font-bold">{stats.aniketnayak.wins}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Losses</p>
                    <p className="text-2xl font-bold">{stats.aniketnayak.losses}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Total Points</p>
                    <p className="text-xl font-bold">{stats.aniketnayak.totalPoints}</p>
                  </div>
                </div>
              </div>

              {/* Sourav Stats */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
                <h3 className="font-bold text-lg mb-4 text-green-600">Sourav</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Wins</p>
                    <p className="text-2xl font-bold">{stats.souravssk.wins}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Losses</p>
                    <p className="text-2xl font-bold">{stats.souravssk.losses}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Total Points</p>
                    <p className="text-xl font-bold">{stats.souravssk.totalPoints}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
              <h3 className="font-bold text-lg mb-4">Head to Head</h3>
              <div className="text-center">
                <p className="text-4xl font-bold text-gray-800 dark:text-white">
                  {stats.aniketnayak.wins} - {stats.souravssk.wins}
                </p>
                <p className="text-gray-600 dark:text-gray-300 mt-2">Total matches: {stats.aniketnayak.wins + stats.souravssk.wins}</p>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
            <h3 className="font-bold text-lg mb-4">Full History</h3>
            {matches.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No history yet</p>
            ) : (
              <div className="space-y-3">
                {matches.map(match => (
                  <div key={match.id} className="border-l-4 border-gray-300 dark:border-slate-600 pl-4 py-2 hover:border-blue-500 transition">
                    {match.type === 'match' ? (
                      <div>
                        <p className="font-semibold">
                          {match.winner === 'aniketnayak' ? '🏆 Aniket' : '🏆 Sourav'} won
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Score: {match.scores?.aniketnayak} - {match.scores?.souravssk}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(match.date).toLocaleString()}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-semibold">
                          💰 {match.player && users[match.player as 'aniketnayak' | 'souravssk'].displayName} - Fine
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">₹{match.amount} - {match.reason}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(match.date).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settlements Tab */}
        {activeTab === 'settlements' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
            <h3 className="font-bold text-lg mb-4">Settlement History</h3>
            {settlements.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No settlements yet</p>
            ) : (
              <div className="space-y-4">
                {settlements.map(settlement => (
                  <div key={settlement.id} className="border rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                        <span className="font-semibold text-green-800">Settlement</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(settlement.date).toLocaleString()}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-700">
                        <span className="font-medium">{users[settlement.payer as 'aniketnayak' | 'souravssk'].displayName}</span> paid{' '}
                        <span className="font-medium">{users[settlement.receiver as 'aniketnayak' | 'souravssk'].displayName}</span>
                      </p>
                      <p className="text-lg font-bold text-green-600">₹{settlement.balance}</p>
                      <p className="text-gray-600 dark:text-gray-300">
                        Transaction ID: <span className="font-mono text-xs">{settlement.transactionId}</span>
                      </p>
                      <div className="mt-2 pt-2 border-t text-xs text-gray-500">
                        <p>Before settlement:</p>
                        <p>Aniket: ₹{settlement.finesBeforeSettlement.aniketnayak} | Sourav: ₹{settlement.finesBeforeSettlement.souravssk}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Match Modal */}
      {showNewMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Record Match Score</h3>
              <button onClick={() => setShowNewMatch(false)}>
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Aniket's Score</label>
                <input
                  type="number"
                  value={matchScores.aniketnayak}
                  onChange={(e) => setMatchScores({...matchScores, aniketnayak: e.target.value})}
                  className="w-full border rounded-lg px-4 py-2"
                  placeholder="Enter score"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Sourav's Score</label>
                <input
                  type="number"
                  value={matchScores.souravssk}
                  onChange={(e) => setMatchScores({...matchScores, souravssk: e.target.value})}
                  className="w-full border rounded-lg px-4 py-2"
                  placeholder="Enter score"
                />
              </div>

              <button
                onClick={addMatch}
                className="w-full bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
              >
                Save Match
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Fine Modal */}
      {showNewFine && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Add Fine</h3>
              <button onClick={() => { setShowNewFine(false); setFineDate(''); }}>
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Amount (₹)</label>
                <input
                  type="number"
                  value={fineAmount}
                  onChange={(e) => setFineAmount(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 dark:bg-slate-700 dark:border-slate-600"
                  placeholder="10"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Reason</label>
                <input
                  type="text"
                  value={fineReason}
                  onChange={(e) => setFineReason(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 dark:bg-slate-700 dark:border-slate-600"
                  placeholder="e.g., Cancelled session"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Date (up to 7 days back)</label>
                <input
                  type="date"
                  value={fineDate}
                  onChange={(e) => setFineDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  min={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  className="w-full border rounded-lg px-4 py-2 dark:bg-slate-700 dark:border-slate-600"
                />
              </div>

              <button
                onClick={addFine}
                className="w-full bg-red-600 dark:bg-red-700 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition"
              >
                Add Fine to My Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settlement Modal */}
      {showSettlement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Settle Fines</h3>
              <button onClick={() => setShowSettlement(false)}>
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            
            {fineBalance === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-600 dark:text-gray-300 text-lg">No fines to settle! 🎉</p>
                <button
                  onClick={() => setShowSettlement(false)}
                  className="mt-4 bg-gray-600 dark:bg-slate-700 hover:bg-gray-700 text-white px-6 py-2 rounded-lg"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Settlement Amount</p>
                  <p className="text-3xl font-bold text-gray-800 dark:text-white">₹{Math.abs(fineBalance)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    {fineBalance > 0 
                      ? `${currentUser && users[currentUser as 'aniketnayak' | 'souravssk'].displayName} pays ${users[otherUser as 'aniketnayak' | 'souravssk'].displayName}`
                      : `${users[otherUser as 'aniketnayak' | 'souravssk'].displayName} pays ${currentUser && users[currentUser as 'aniketnayak' | 'souravssk'].displayName}`
                    }
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Transaction ID *</label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full border rounded-lg px-4 py-2"
                    placeholder="e.g., UPI/123456789"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter UPI transaction ID or payment reference</p>
                </div>

                <button
                  onClick={handleSettlement}
                  className="w-full bg-green-600 dark:bg-green-700 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition"
                >
                  Confirm Settlement
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Monthly Report Modal */}
      {showMonthlyReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-2xl w-full my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Monthly Report</h3>
              <button onClick={() => setShowMonthlyReport(false)}>
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Select Month</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                max={new Date().toISOString().slice(0, 7)}
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>

            {selectedMonth && (() => {
              const report = getMonthlyReport(selectedMonth);
              const monthName = new Date(selectedMonth + '-01').toLocaleDateString('en-IN', { 
                month: 'long', 
                year: 'numeric' 
              });

              return (
                <div className="space-y-6">
                  <div className="text-center">
                    <h4 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{monthName}</h4>
                  </div>

                  {/* Fine Summary */}
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                    <h5 className="font-bold text-lg mb-3 text-red-800">Fine Summary</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Aniket's Fines</p>
                        <p className="text-2xl font-bold text-red-600">₹{report.fineData.aniketnayak}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Sourav's Fines</p>
                        <p className="text-2xl font-bold text-red-600">₹{report.fineData.souravssk}</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800">
                      <p className="text-sm text-gray-700 font-medium">Net Balance:</p>
                      {report.fineData.aniketnayak === report.fineData.souravssk ? (
                        <p className="text-lg font-bold text-gray-800 dark:text-white">Settled ✓</p>
                      ) : report.fineData.aniketnayak > report.fineData.souravssk ? (
                        <p className="text-lg font-bold text-red-600">
                          Aniket owes ₹{report.fineData.aniketnayak - report.fineData.souravssk}
                        </p>
                      ) : (
                        <p className="text-lg font-bold text-red-600">
                          Sourav owes ₹{report.fineData.souravssk - report.fineData.aniketnayak}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Match Summary */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h5 className="font-bold text-lg mb-3 text-blue-800">Match Summary</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Aniket</p>
                        <p className="text-xl font-bold text-blue-600">
                          {report.matchData.aniketnayak.wins}W - {report.matchData.aniketnayak.losses}L
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Sourav</p>
                        <p className="text-xl font-bold text-green-600">
                          {report.matchData.souravssk.wins}W - {report.matchData.souravssk.losses}L
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Settlements in Month */}
                  {report.monthSettlements.length > 0 && (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                      <h5 className="font-bold text-lg mb-3 text-green-800">Settlements</h5>
                      <div className="space-y-2">
                        {report.monthSettlements.map(settlement => (
                          <div key={settlement.id} className="bg-white dark:bg-slate-800 rounded p-3 text-sm">
                            <p className="font-medium">
                              {users[settlement.payer as 'aniketnayak' | 'souravssk'].displayName} → {users[settlement.receiver as 'aniketnayak' | 'souravssk'].displayName}: ₹{settlement.balance}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(settlement.date).toLocaleDateString()} | TXN: {settlement.transactionId}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Activity Count */}
                  <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                    <h5 className="font-bold text-lg mb-3">Activity</h5>
                    <p className="text-gray-700">
                      Total Events: {report.monthMatches.length} 
                      ({report.monthMatches.filter(m => m.type === 'match').length} matches, 
                      {report.monthMatches.filter(m => m.type === 'fine').length} fines)
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

