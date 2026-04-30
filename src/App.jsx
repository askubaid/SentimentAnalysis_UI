import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  Search, Info, ShieldCheck, Zap, Activity, Settings as SettingsIcon,
  ThumbsUp, ThumbsDown, AlertCircle
} from 'lucide-react';

const App = () => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('shap');
  const [apiUrl, setApiUrl] = useState('http://localhost:8000');
  const [showSettings, setShowSettings] = useState(false);

  const analyzeSentiment = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${apiUrl}/analyze`, { text });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to connect to the backend server. Make sure it is running.");
    } finally {
      setLoading(false);
    }
  };

  const chartData = result
    ? (activeTab === 'shap' ? result.shap_features : result.lime_features)
    : [];

  // Limit to top 15 for chart readability if there are many tokens
  const displayedData = chartData.slice(0, 15);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="card" style={{ padding: '12px', borderRadius: '8px', fontSize: '0.85rem' }}>
          <p style={{ fontWeight: 600 }}>{payload[0].payload.token}</p>
          <p style={{ color: payload[0].value > 0 ? '#10b981' : '#ef4444' }}>
            Impact: {payload[0].value > 0 ? '+' : ''}{payload[0].value.toFixed(4)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="container">
      <header className="header">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Sentimental AI
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Fine-tuned BERT with SHAP & LIME Explanations
        </motion.p>
      </header>

      <main className="card">
        <div className="input-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Analyze Review</label>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="tab-btn"
              style={{ padding: '4px', background: 'transparent' }}
            >
              <SettingsIcon size={18} />
            </button>
          </div>

          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden', marginBottom: '16px' }}
              >
                <div style={{ padding: '12px', background: 'rgba(0,0,0,0.05)', borderRadius: '12px' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>API Endpoint URL</p>
                  <input
                    className="input-area"
                    style={{ minHeight: '40px', padding: '8px 12px', fontSize: '0.9rem', background: 'white' }}
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="http://localhost:8000"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <textarea
            className="input-area"
            placeholder="Type a movie review here... (e.g., 'This film was an absolute masterpiece with stunning visuals.')"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <button
          className="btn-primary"
          onClick={analyzeSentiment}
          disabled={loading || !text.trim()}
        >
          {loading ? <div className="loading-spinner" /> : <Zap size={20} />}
          {loading ? 'Analyzing...' : 'Analyze Sentiment'}
        </button>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ marginTop: '20px', color: 'var(--danger-color)', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.9rem' }}
          >
            <AlertCircle size={18} />
            {error}
          </motion.div>
        )}

        {result && !loading && (
          <motion.div
            className="result-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
              <div>
                <div className={`sentiment-badge ${result.sentiment === 'Positive' ? 'sentiment-positive' : 'sentiment-negative'}`}>
                  {result.sentiment === 'Positive' ? <ThumbsUp size={16} /> : <ThumbsDown size={16} />}
                  {result.sentiment.toUpperCase()}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Confidence: <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{(result.confidence * 100).toFixed(2)}%</span>
                </div>
              </div>

              <div className="explainer-tabs">
                <button
                  className={`tab-btn ${activeTab === 'shap' ? 'active' : ''}`}
                  onClick={() => setActiveTab('shap')}
                >
                  <ShieldCheck size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                  SHAP
                </button>
                <button
                  className={`tab-btn ${activeTab === 'lime' ? 'active' : ''}`}
                  onClick={() => setActiveTab('lime')}
                >
                  <Activity size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                  LIME
                </button>
              </div>
            </div>

            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={displayedData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="token"
                    type="category"
                    width={80}
                    stroke="var(--text-muted)"
                    fontSize={12}
                    tickFormatter={(val) => val.length > 10 ? val.substring(0, 8) + '..' : val}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {displayedData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.value > 0 ? 'var(--success-color)' : 'var(--danger-color)'} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="token-list">
              {chartData.map((item, idx) => (
                <span
                  key={idx}
                  className={`token-pill ${item.value > 0 ? 'token-positive' : 'token-negative'}`}
                  title={`Impact: ${item.value.toFixed(4)}`}
                >
                  {item.token}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </main>

      <section className="card" style={{ marginTop: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Info size={24} style={{ color: 'var(--primary-gradient)' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Technical Specifications</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
          <div>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={16} /> BERT Base (Uncased)
            </h3>
            <ul style={{ listStyle: 'none', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.8' }}>
              <li>• Layers: <strong>12 Transformer Blocks</strong></li>
              <li>• Embeddings Size: <strong>768</strong></li>
              <li>• Attention Heads: <strong>12</strong></li>
              <li>• Total Parameters: <strong>110 Million</strong></li>
            </ul>
          </div>

          <div>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} /> IMDB Dataset
            </h3>
            <ul style={{ listStyle: 'none', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.8' }}>
              <li>• Total Size: <strong>50,000 Reviews</strong></li>
              <li>• Split: <strong>25k Train / 25k Test</strong></li>
              <li>• Classes: <strong>Binary (Positive/Negative)</strong></li>
              <li>• Source: <strong>Stanford AI Lab</strong></li>
            </ul>
          </div>

          <div>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} /> Fine-Tuning
            </h3>
            <ul style={{ listStyle: 'none', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.8' }}>
              <li>• Batch Size: <strong>16</strong></li>
              <li>• Training Epochs: <strong>1</strong></li>
              <li>• Max Seq Length: <strong>128</strong></li>
              <li>• Accuracy Score: <strong>0.8745</strong></li>
            </ul>
          </div>
        </div>
      </section>

      <footer style={{ textAlign: 'center', marginTop: '3rem', marginBottom: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <p>Developed by <strong> U<sup>2</sup> <small> (Ubaid Ur Rehman)</small></strong>. Student @ Institute of Space Technology Islamabad.</p>
      </footer>
    </div>
  );
};

export default App;
