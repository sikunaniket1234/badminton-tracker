import { useState, useEffect, FormEvent } from 'react';
import { Trophy, IndianRupee, X, Users, History, Calendar, CheckCircle, LogOut } from 'lucide-react';
import { supabase } from './supabaseClient';

interface Match {
  id: string;
  type: 'match' | 'fine';
  player?: string;
  amount?: number;
  reason?: string;
  scores_aniket?: number;
  scores_sourav?: number;
  winner?: string;
  date: string;
  user_id: string;
}

interface Settlement {
  id: string;
  payer: string;
  receiver: string;
  amount: number;
  transaction_id: string;
  settled: boolean;
  user_id: string;
}

export default function BadmintonTracker() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loginEmail, setLoginEmail] = useState('');
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
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Map user_id to username for display
  const userIdToUsername: Record<string, string> = {
    'e79194c8-cd07-4ded-b30c-63859a80ea28': 'aniketnayak',
    'ee3029d3-c8e1-4099-b3ca-1c29d45890bb': 'souravssk'
  };

  const userIdToDisplayName: Record<string, string> = {
    'e79194c8-cd07-4ded-b30c-63859a80ea28': 'Aniket',
    'ee3029d3-c8e1-4099-b3ca-1c29d45890bb': 'Sourav'
  };

  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        setCurrentUser(data.session.user);
        await loadUserData(data.session.user.id);
      }
    };
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
        await loadUserData(session.user.id);
      } else {
        setCurrentUser(null);
        setMatches([]);
        setSettlements([]);
        setFines({ aniketnayak: 0, souravssk: 0 });
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      // Load matches
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (matchesError) throw matchesError;
      setMatches(matchesData || []);

      // Load settlements
      const { data: settlementsData, error: settlementsError } = await supabase
        .from('settlements')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (settlementsError) throw settlementsError;
      setSettlements(settlementsData || []);

      // Load fines from user_fines table
      const { data: allFines, error: finesError } = await supabase
        .from('user_fines')
        .select('*');

      if (!finesError && allFines) {
        const finesByUser: Record<string, number> = {};
        allFines.forEach(f => {
          const username = userIdToUsername[f.user_id] || f.user_id;
          finesByUser[username] = f.amount || 0;
        });
        setFines(finesByUser);
      }
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  };

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword
      });

      if (error) throw error;

      setLoginEmail('');
      setLoginPassword('');
    } catch (err: any) {
      setAuthError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  const addFine = async () => {
    if (!fineAmount || !fineReason || !currentUser) {
      alert('Please enter fine amount and reason');
      return;
    }

    try {
      const selectedDate = fineDate ? new Date(fineDate) : new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);

      const daysBack = Math.floor((today.getTime() - selectedDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysBack < 0 || daysBack > 7) {
        alert('Fine date must be within the last 7 days');
        return;
      }

      const newFineAmount = parseInt(fineAmount);
      const currentFineAmount = fines[userIdToUsername[currentUser.id]] || 0;

      // Insert match record (fine)
      const { error: matchError } = await supabase.from('matches').insert({
        user_id: currentUser.id,
        type: 'fine',
        player: userIdToUsername[currentUser.id],
        amount: newFineAmount,
        reason: fineReason,
        date: new Date(selectedDate).toISOString()
      });

      if (matchError) throw matchError;

      // Update user fines
      const { error: fineError } = await supabase
        .from('user_fines')
        .update({ amount: currentFineAmount + newFineAmount })
        .eq('user_id', currentUser.id);

      if (fineError) throw fineError;

      // Reload data
      await loadUserData(currentUser.id);

      setShowNewFine(false);
      setFineAmount('10');
      setFineReason('');
      setFineDate('');
    } catch (err) {
      console.error('Error adding fine:', err);
      alert('Failed to add fine');
    }
  };

  const addMatch = async () => {
    const score1 = parseInt(matchScores.aniketnayak);
    const score2 = parseInt(matchScores.souravssk);

    if (isNaN(score1) || isNaN(score2)) {
      alert('Please enter valid scores');
      return;
    }

    try {
      const winner = score1 > score2 ? 'aniketnayak' : 'souravssk';

      const { error } = await supabase.from('matches').insert({
        user_id: currentUser.id,
        type: 'match',
        scores_aniket: score1,
        scores_sourav: score2,
        winner,
        date: new Date().toISOString()
      });

      if (error) throw error;

      await loadUserData(currentUser.id);

      setShowNewMatch(false);
      setMatchScores({ aniketnayak: '', souravssk: '' });
    } catch (err) {
      console.error('Error adding match:', err);
      alert('Failed to add match');
    }
  };

  const handleSettlement = async () => {
    if (!transactionId.trim()) {
      alert('Please enter a transaction ID');
      return;
    }

    try {
      const otherUsername = userIdToUsername[currentUser.id] === 'aniketnayak' ? 'souravssk' : 'aniketnayak';
      const fineBalance = fines[userIdToUsername[currentUser.id]] - fines[otherUsername];

      // Insert settlement
      const { error: settlementError } = await supabase.from('settlements').insert({
        user_id: currentUser.id,
        payer: fineBalance > 0 ? userIdToUsername[currentUser.id] : otherUsername,
        receiver: fineBalance > 0 ? otherUsername : userIdToUsername[currentUser.id],
        amount: Math.abs(fineBalance),
        transaction_id: transactionId,
        settled: true
      });

      if (settlementError) throw settlementError;

      // Reset both users' fines to 0
      const otherUserId = userIdToUsername[currentUser.id] === 'aniketnayak' ? 'ee3029d3-c8e1-4099-b3ca-1c29d45890bb' : 'e79194c8-cd07-4ded-b30c-63859a80ea28';
      
      await supabase.from('user_fines').update({ amount: 0 }).eq('user_id', currentUser.id);
      await supabase.from('user_fines').update({ amount: 0 }).eq('user_id', otherUserId);

      await loadUserData(currentUser.id);

      setShowSettlement(false);
      setTransactionId('');
    } catch (err) {
      console.error('Error settling:', err);
      alert('Failed to settle fines');
    }
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getStats = () => {
    const matches_played = matches.filter((m: Match) => m.type === 'match').length;
    const wins = matches.filter((m: Match) => m.type === 'match' && m.winner === userIdToUsername[currentUser?.id]).length;
    return { matches_played, wins };
  };

  const getMonthlyReport = () => {
    if (!selectedMonth) return null;

    const [year, month] = selectedMonth.split('-').map(Number);
    const monthMatches = matches.filter((m: Match) => {
      const d = new Date(m.date);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });

    const stats = { totalMatches: 0, wins: 0, fines: 0, fineAmount: 0 };
    monthMatches.forEach(m => {
      if (m.type === 'match') {
        stats.totalMatches++;
        if (m.winner === userIdToUsername[currentUser?.id]) stats.wins++;
      } else if (m.type === 'fine') {
        stats.fines++;
        stats.fineAmount += m.amount || 0;
      }
    });

    return stats;
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 dark:from-green-900 dark:to-blue-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-white">🏸 Badminton Tracker</h1>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="aniket@badminton.app or sourav@badminton.app"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter password"
                required
              />
            </div>

            {authError && <p className="text-red-600 dark:text-red-400 text-sm">{authError}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition duration-200 shadow-lg"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-gray-600 dark:text-gray-300">
            <p className="font-semibold mb-2">Demo Credentials:</p>
            <p>Email: aniket@badminton.app</p>
            <p>Email: sourav@badminton.app</p>
            <p className="mt-2 text-xs italic">(Ask your admin for the password)</p>
          </div>
        </div>
      </div>
    );
  }

  const stats = getStats();
  const otherUser = userIdToUsername[currentUser.id] === 'aniketnayak' ? 'souravssk' : 'aniketnayak';
  const otherDisplayName = otherUser === 'aniketnayak' ? 'Aniket' : 'Sourav';
  const fineBalance = (fines[userIdToUsername[currentUser.id]] || 0) - (fines[otherUser] || 0);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-blue-500 dark:from-green-700 dark:to-blue-700 text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h1 className="text-2xl font-bold">🏸 Badminton Tracker</h1>
              <p className="text-sm opacity-90">Hello, {userIdToDisplayName[currentUser.id]}!</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-white dark:bg-slate-700 bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg text-sm transition flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
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
          {['home', 'stats', 'history', 'settlements'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-center font-medium transition ${
                activeTab === tab ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {tab === 'home' && <Trophy className="w-5 h-5 mx-auto mb-1" />}
              {tab === 'stats' && <Users className="w-5 h-5 mx-auto mb-1" />}
              {tab === 'history' && <History className="w-5 h-5 mx-auto mb-1" />}
              {tab === 'settlements' && <CheckCircle className="w-5 h-5 mx-auto mb-1" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4">
        {activeTab === 'home' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                  <IndianRupee className="w-6 h-6 mr-2" />
                  Fine Balance
                </h2>
                <button
                  onClick={() => setShowSettlement(true)}
                  className="text-sm bg-green-600 dark:bg-green-700 hover:bg-green-700 text-white px-3 py-1 rounded-lg"
                >
                  Settle
                </button>
              </div>

              <div className="text-4xl font-bold mb-4">
                {fineBalance > 0 ? (
                  <span className="text-red-600">₹{fineBalance} (You owe)</span>
                ) : fineBalance < 0 ? (
                  <span className="text-green-600">₹{Math.abs(fineBalance)} (You get)</span>
                ) : (
                  <span className="text-gray-600 dark:text-gray-300">Balanced ✨</span>
                )}
              </div>

              <div className="mt-4 pt-4 border-t flex justify-between text-sm text-gray-600 dark:text-gray-300">
                <div>Your fines: ₹{fines[userIdToUsername[currentUser.id]] || 0}</div>
                <div>{otherDisplayName}'s fines: ₹{fines[otherUser] || 0}</div>
              </div>
            </div>

            <button
              onClick={() => setShowMonthlyReport(true)}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white rounded-xl p-4 shadow-md transition flex items-center justify-center"
            >
              <Calendar className="w-5 h-5 mr-2" />
              <span className="font-semibold">View Monthly Report</span>
            </button>

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

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
              <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">Recent Activity</h3>
              {matches.length === 0 ? (
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
                            Score: {match.scores_aniket} - {match.scores_sourav}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(match.date).toLocaleString()}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-semibold text-red-600">Fine: ₹{match.amount}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{match.reason}</p>
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

        {activeTab === 'stats' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Your Stats</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">Matches Played</p>
                <p className="text-3xl font-bold text-blue-600">{stats.matches_played}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">Wins</p>
                <p className="text-3xl font-bold text-green-600">{stats.wins}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Full History</h2>
            {matches.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No history yet</p>
            ) : (
              <div className="space-y-4">
                {matches.map(match => (
                  <div key={match.id} className={`border rounded-lg p-4 ${match.type === 'match' ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                    {match.type === 'match' ? (
                      <div>
                        <p className="font-semibold">Match: {match.winner === 'aniketnayak' ? 'Aniket' : 'Sourav'} won</p>
                        <p className="text-sm">Score: {match.scores_aniket} - {match.scores_sourav}</p>
                        <p className="text-xs text-gray-500">{new Date(match.date).toLocaleString()}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-semibold">Fine: ₹{match.amount}</p>
                        <p className="text-sm">{match.reason}</p>
                        <p className="text-xs text-gray-500">{new Date(match.date).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settlements' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Settlement History</h2>
            {settlements.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No settlements yet</p>
            ) : (
              <div className="space-y-4">
                {settlements.map(s => (
                  <div key={s.id} className="border rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                    <p className="font-semibold">{s.payer} → {s.receiver}</p>
                    <p className="text-lg font-bold text-green-600">₹{s.amount}</p>
                    <p className="text-xs text-gray-500">TxID: {s.transaction_id}</p>
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
              <h3 className="text-xl font-bold">New Match</h3>
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
                  className="w-full border rounded-lg px-4 py-2 dark:bg-slate-700 dark:border-slate-600"
                  placeholder="Enter score"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Sourav's Score</label>
                <input
                  type="number"
                  value={matchScores.souravssk}
                  onChange={(e) => setMatchScores({...matchScores, souravssk: e.target.value})}
                  className="w-full border rounded-lg px-4 py-2 dark:bg-slate-700 dark:border-slate-600"
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
                    {fineBalance > 0 ? `You pay ${otherDisplayName}` : `${otherDisplayName} pays you`}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Transaction ID</label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full border rounded-lg px-4 py-2 dark:bg-slate-700 dark:border-slate-600"
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

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Select Month</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 dark:bg-slate-700 dark:border-slate-600"
              />
            </div>

            {selectedMonth && getMonthlyReport() && (
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300">Matches Played</p>
                  <p className="text-2xl font-bold">{getMonthlyReport()?.totalMatches}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300">Wins</p>
                  <p className="text-2xl font-bold">{getMonthlyReport()?.wins}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300">Fines</p>
                  <p className="text-2xl font-bold">₹{getMonthlyReport()?.fineAmount}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
