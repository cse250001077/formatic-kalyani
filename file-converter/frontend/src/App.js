import React, { useState } from 'react';
import axios from 'axios';
import { Upload, FileText, Image as ImageIcon, Download, Loader, Sparkles } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

function App() {
  const [files, setFiles] = useState([]);
  const [targetFormat, setTargetFormat] = useState('pdf');
  const [converting, setConverting] = useState(false);
  const [message, setMessage] = useState(null);
  const [downloadLink, setDownloadLink] = useState(null);

  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(Array.from(e.dataTransfer.files));
      setMessage(null);
      setDownloadLink(null);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
      setMessage(null);
      setDownloadLink(null);
    }
  };

  const handleConvert = async () => {
    if (files.length === 0) {
      setMessage({ type: 'error', text: 'Please select a file first.' });
      return;
    }
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('targetFormat', targetFormat);
    
    setConverting(true);
    setMessage({ type: 'info', text: 'Processing your file securely...' });
    setDownloadLink(null);

    try {
      const res = await axios.post(`${API_BASE}/convert`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage({ type: 'success', text: 'Conversion completed successfully!' });
      setDownloadLink(`http://localhost:5000${res.data.downloadUrl}`);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Conversion failed.' });
    } finally {
      setConverting(false);
    }
  };

  const handleDownload = async (e) => {
    e.preventDefault();
    try {
      const response = await axios({
        url: downloadLink,
        method: 'GET',
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', downloadLink.split('/').pop());
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      setMessage({ type: 'error', text: 'Download failed. File may have expired.' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex font-sans">
      
      {/* Sidebar */}
      <div className="w-72 bg-slate-950 border-r border-slate-800 p-6 flex flex-col">
        <div className="flex items-center space-x-3 mb-10">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/30">
            <Sparkles className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            FileMorph
          </h1>
        </div>
        <button className="w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl font-bold transition-all duration-300 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white shadow-xl shadow-pink-600/30 scale-105">
          <Upload className="w-5 h-5" />
          <span>Core Converter</span>
        </button>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 p-10 flex flex-col items-center">
        <div className="w-full max-w-4xl mb-12">
          <h2 className="text-4xl font-black mb-3">Universal File Converter</h2>
          <p className="text-slate-400">Secure, high-speed processing engine. Auto-deletes files in 30 minutes.</p>
        </div>

        {message && (
          <div className={`w-full max-w-3xl mb-8 p-4 rounded-2xl flex items-center space-x-3 border ${
            message.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200' : 
            message.type === 'error' ? 'bg-rose-950/80 border-rose-500/60 text-rose-200' : 
            'bg-blue-950/80 border-blue-500/60 text-blue-200'
          }`}>
            <span>{message.text}</span>
          </div>
        )}

        <div className="w-full max-w-3xl bg-slate-900/50 border border-slate-800 p-8 rounded-3xl shadow-2xl backdrop-blur-sm">
          <div 
            onDragOver={(e) => e.preventDefault()} 
            onDrop={handleFileDrop}
            className="border-2 border-dashed border-pink-500/60 hover:border-pink-400 bg-slate-950/60 rounded-3xl p-12 text-center flex flex-col items-center justify-center transition-all cursor-pointer"
          >
            <Upload className="w-16 h-16 text-pink-500 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Drag and drop your files here</h3>
            <p className="text-slate-400 mb-6">Supports JPG, PNG, PDF, DOCX, TXT (Max 10 MB)</p>
            <label className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl cursor-pointer transition">
              Browse Files
              <input type="file" className="hidden" onChange={handleFileSelect} multiple />
            </label>
          </div>

          {files.length > 0 && (
            <div className="mt-8">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Selected File</h4>
              <div className="flex items-center justify-between bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center space-x-4">
                  {files[0].type.includes('image') ? <ImageIcon className="text-pink-400 w-8 h-8" /> : <FileText className="text-indigo-400 w-8 h-8" />}
                  <div>
                    <p className="font-bold text-white truncate max-w-[200px]">{files[0].name}</p>
                    <p className="text-xs text-slate-500">{(files[0].size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className="text-slate-500 text-sm font-bold">Convert to:</span>
                  <select 
                    value={targetFormat} 
                    onChange={(e) => setTargetFormat(e.target.value)}
                    className="bg-slate-800 border border-purple-500/40 text-white px-4 py-2 rounded-xl text-sm font-bold outline-none"
                  >
                    <option value="pdf">PDF Document (.pdf)</option>
                    <option value="docx">Word Document (.docx)</option>
                    <option value="txt">Text File (.txt)</option>
                    <option value="png">PNG Image (.png)</option>
                    <option value="jpg">JPG Image (.jpg)</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button 
                  onClick={handleConvert} 
                  disabled={converting}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-black rounded-xl shadow-lg disabled:opacity-50 flex items-center"
                >
                  {converting ? <Loader className="w-5 h-5 animate-spin mr-2" /> : null}
                  {converting ? 'Converting...' : 'Convert File'}
                </button>
              </div>
            </div>
          )}

          {downloadLink && (
            <div className="mt-8 p-6 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
              <div>
                <h4 className="text-emerald-400 font-bold text-lg">Conversion Successful!</h4>
                <p className="text-slate-400 text-sm mt-1">File will automatically delete in 30 minutes.</p>
              </div>
              <button 
                onClick={handleDownload}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl shadow-lg flex items-center transition"
              >
                <Download className="w-5 h-5 mr-2" /> Download
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;