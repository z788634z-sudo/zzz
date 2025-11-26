import React from 'react';
import { SpecialInsight, EnergyFlow, TopicBadge } from '../types';
import { Zap, Heart, Skull, AlertTriangle, Activity, Flame, Snowflake } from 'lucide-react';

interface InsightsPanelProps {
  insights: SpecialInsight[];
  energyFlow: EnergyFlow;
  topicBadges?: TopicBadge[];
}

const InsightCard: React.FC<{ insight: SpecialInsight }> = ({ insight }) => {
  let Icon = Zap;
  let bgClass = "bg-slate-800";
  let borderClass = "border-slate-700";
  let textClass = "text-slate-300";

  switch (insight.type) {
    case 'crush':
      Icon = Heart;
      bgClass = "bg-pink-950/30";
      borderClass = "border-pink-800/50";
      textClass = "text-pink-200";
      break;
    case 'beef':
      Icon = AlertTriangle;
      bgClass = "bg-red-950/30";
      borderClass = "border-red-800/50";
      textClass = "text-red-200";
      break;
    case 'topic_killer':
      Icon = Skull;
      bgClass = "bg-gray-800/50";
      borderClass = "border-gray-600";
      textClass = "text-gray-400";
      break;
    case 'topic_saver':
      Icon = Activity;
      bgClass = "bg-green-950/30";
      borderClass = "border-green-800/50";
      textClass = "text-green-200";
      break;
  }

  return (
    <div className={`p-4 rounded-xl border ${borderClass} ${bgClass} transition-transform hover:scale-105`}>
      <div className="flex items-start justify-between mb-2">
        <h4 className={`font-bold ${textClass} text-sm uppercase tracking-wide`}>{insight.title}</h4>
        <Icon className={`w-5 h-5 ${textClass}`} />
      </div>
      <p className="text-slate-300 text-sm mb-3">{insight.description}</p>
      <div className="flex flex-wrap gap-2">
        {insight.involved_users.map(u => (
          <span key={u} className="px-2 py-0.5 rounded-md bg-black/40 text-xs text-slate-400 font-mono">
            @{u}
          </span>
        ))}
      </div>
    </div>
  );
};

const BadgeCard: React.FC<{ badge: TopicBadge }> = ({ badge }) => {
  const isKiller = badge.type === 'killer';
  
  return (
    <div className={`relative p-4 rounded-xl border flex items-center gap-4 ${isKiller ? 'bg-cyan-950/20 border-cyan-900' : 'bg-orange-950/20 border-orange-900'}`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2 ${isKiller ? 'bg-cyan-950 border-cyan-400 text-cyan-400' : 'bg-orange-950 border-orange-400 text-orange-400'}`}>
            {badge.icon || (isKiller ? <Snowflake className="w-6 h-6" /> : <Flame className="w-6 h-6" />)}
        </div>
        <div>
            <div className="flex items-center gap-2">
                 <h4 className={`font-bold ${isKiller ? 'text-cyan-200' : 'text-orange-200'}`}>{badge.title}</h4>
            </div>
            <div className="text-slate-200 font-mono text-sm mb-1">@{badge.user}</div>
            <p className="text-xs text-slate-400 leading-tight">{badge.description}</p>
        </div>
        {isKiller ? (
             <Skull className="absolute top-2 right-2 w-4 h-4 text-cyan-800/40" />
        ) : (
             <Zap className="absolute top-2 right-2 w-4 h-4 text-orange-800/40" />
        )}
    </div>
  );
};

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ insights, energyFlow, topicBadges }) => {
  return (
    <div className="space-y-6">
      {/* Energy Flow Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-500 uppercase">Peak Time</span>
            <div className="text-xl font-mono text-cyan-400">{energyFlow.peak_time}</div>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-500 uppercase">Dominant Emotion</span>
            <div className="text-xl font-bold text-indigo-400">{energyFlow.dominant_emotion}</div>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-500 uppercase">Tension Level</span>
            <div className={`text-xl font-bold ${energyFlow.tension_level === 'High' ? 'text-red-500' : 'text-emerald-400'}`}>
                {energyFlow.tension_level}
            </div>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 col-span-2 md:col-span-1">
            <span className="text-xs text-slate-500 uppercase">Current Topic</span>
            <div className="text-sm text-slate-300 leading-tight mt-1 line-clamp-2">{energyFlow.topic_summary}</div>
        </div>
      </div>

      {/* Topic Necromancy Badges */}
      {topicBadges && topicBadges.length > 0 && (
          <div>
              <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center">
                  <Skull className="w-5 h-5 mr-2 text-purple-500" />
                  Topic Necromancy
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {topicBadges.map((badge, idx) => (
                      <BadgeCard key={idx} badge={badge} />
                  ))}
              </div>
          </div>
      )}

      {/* Special Insights Grid */}
      {insights.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-yellow-500" />
            Detected Anomalies
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((insight, idx) => (
              <InsightCard key={idx} insight={insight} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};