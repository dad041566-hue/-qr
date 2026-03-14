import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, Clock, CheckCircle2, CircleDashed } from 'lucide-react';

const activityData = [
  { name: 'Mon', tasks: 4 },
  { name: 'Tue', tasks: 7 },
  { name: 'Wed', tasks: 5 },
  { name: 'Thu', tasks: 9 },
  { name: 'Fri', tasks: 6 },
  { name: 'Sat', tasks: 2 },
  { name: 'Sun', tasks: 3 },
];

const recentTasks = [
  { id: 1, title: 'Update homepage copy', status: 'completed', time: '2 hours ago' },
  { id: 2, title: 'Fix navigation bug', status: 'in-progress', time: '4 hours ago' },
  { id: 3, title: 'Design new logo', status: 'pending', time: '1 day ago' },
  { id: 4, title: 'Client meeting prep', status: 'completed', time: '2 days ago' },
];

export function Dashboard() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, John!</h1>
        <p className="text-gray-500 mt-1">Here's what's happening in your workspace today.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: 'Total Tasks', value: '42', icon: CircleDashed, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'In Progress', value: '12', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Completed', value: '28', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
              <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Activity Overview</h2>
            <button className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View Report <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="h-[300px] w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
              <BarChart data={activityData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="tasks" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Recent Tasks</h2>
          </div>
          <div className="space-y-4">
            {recentTasks.map((task) => (
              <div key={task.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                <div className="mt-1">
                  {task.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : task.status === 'in-progress' ? (
                    <Clock className="w-5 h-5 text-amber-500" />
                  ) : (
                    <CircleDashed className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <h4 className={`text-sm font-medium ${task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                    {task.title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">{task.time}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2 px-4 bg-gray-50 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
            View All Tasks
          </button>
        </div>
      </div>
    </div>
  );
}