import React, { useState, useCallback, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

// --- Helper Icons ---
const ChartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
);

const CsvIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 4v16" />
    </svg>
);


// --- Main App Component ---
export default function App() {
    // --- State Management ---
    const [dataSource, setDataSource] = useState('api');
    const [file, setFile] = useState(null);
    const [baseData, setBaseData] = useState([]);
    const [timeframes, setTimeframes] = useState(['15 Minutes']);

    // New state for selecting the pattern to analyze
    const [patternToDetect, setPatternToDetect] = useState('hammer');

    const [detectedPatterns, setDetectedPatterns] = useState([]);
    const [selectedPatternRow, setSelectedPatternRow] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isPapaReady, setIsPapaReady] = useState(false);

    // --- Data Definitions ---
    const availablePatterns = {
        'Hammer': 'hammer',
        'Dragonfly Doji': 'dragonfly_doji',
        'Rising Window': 'rising_window',
        'Evening Star': 'evening_star',
        'Three White Soldiers': 'three_white_soldiers',
    };

    const timeframeMap = {
        '1 Minute': '1m',
        '5 Minutes': '5m',
        // '10 Minutes': '10m',
        '15 Minutes': '15m',
        '30 Minutes': '30m',
        '1 Hour': '60m',
    };

    // --- Effects and Callbacks ---

    // Load PapaParse library for CSV handling
    useEffect(() => {
        if (window.Papa) {
            setIsPapaReady(true);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/papaparse@5.3.2/papaparse.min.js';
        script.async = true;
        script.onload = () => setIsPapaReady(true);
        script.onerror = () => setError('Failed to load CSV parsing library. Please refresh the page.');
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    // Helper to parse CSV string into structured data
    const parseAndPrepareData = (csvString) => {
        const parsed = window.Papa.parse(csvString, { header: true, skipEmptyLines: true });
        const data = parsed.data.map(row => {
            let timestamp;
            // Prefer a single 'datetime' column, but also check for 'Timestamp' or 'time' (as a full datetime string)
            const datetimeCol = row.datetime || row.Timestamp || row.time;

            if (datetimeCol) {
                timestamp = new Date(datetimeCol);
            } else if (row.date) { // Fallback to separate 'date' and 'time' columns
                const timePart = row.time || '00:00:00';
                const [day, month, year] = row.date.split(/[-/]/);
                // Basic check for YYYY-MM-DD format as well
                if (String(year).length === 4) {
                     timestamp = new Date(`${year}-${month}-${day}T${timePart}`);
                } else if(String(day).length === 4) { // Handle YYYY-MM-DD
                    timestamp = new Date(`${row.date}T${timePart}`);
                } else { // Assume DD-MM-YYYY
                    timestamp = new Date(`${year}-${month}-${day}T${timePart}`);
                }
            } else {
                return null; // Not enough date/time info
            }

            // Ensure timestamp is valid before proceeding
            if (!timestamp || isNaN(timestamp.getTime())) {
                return null;
            }

            return {
                timestamp: timestamp,
                Open: parseFloat(row.open),
                High: parseFloat(row.high),
                Low: parseFloat(row.low),
                Close: parseFloat(row.close),
                Volume: parseInt(row.volume, 10),
            };
        }).filter(row => row && !isNaN(row.Open)); // Ensure row object and Open price are valid
        return data.sort((a, b) => a.timestamp - b.timestamp);
    };


    // Handle file drop for CSV upload
    const onDrop = useCallback(
        acceptedFiles => {
            if (!isPapaReady) {
                setError('CSV parser is not ready yet. Please wait a moment.');
                return;
            }
            const uploadedFile = acceptedFiles[0];
            if (uploadedFile && (uploadedFile.type === 'text/csv' || uploadedFile.name.endsWith('.csv'))) {
                setFile(uploadedFile);
                const reader = new FileReader();
                reader.onload = e => {
                    const data = parseAndPrepareData(e.target.result);
                    if (data.length > 0) {
                        setBaseData(data);
                        setSuccess('CSV file loaded successfully!');
                        setError('');
                        setDetectedPatterns([]);
                        setSelectedPatternRow(null);
                    } else {
                        setError('Could not parse CSV. Check file format (needs datetime/date and OHLC columns).');
                        setSuccess('');
                    }
                };
                reader.readAsText(uploadedFile);
            } else {
                setError('Please upload a valid CSV file.');
                setSuccess('');
            }
        },
        [isPapaReady, parseAndPrepareData]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'text/csv': ['.csv'] },
        multiple: false,
    });

    // --- Core Logic ---

    // Fetch patterns from the API based on user selections
    const handleRunDetection = async () => {
        if (dataSource === 'csv' && baseData.length === 0) {
            setError('Please upload and parse a valid CSV file first.');
            return;
        }
        if (dataSource === 'download') {
            setError('Live data download is not implemented. Please use API or CSV upload.');
            return;
        }
        if (timeframes.length === 0) {
            setError('Please select at least one timeframe.');
            return;
        }
        if (!patternToDetect) {
            setError('Please select a pattern to detect.');
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccess('');
        setDetectedPatterns([]);
        setSelectedPatternRow(null);

        try {
            const allPatterns = [];
            // Find the display name for the selected pattern
            const patternDisplayName = Object.keys(availablePatterns).find(
                key => availablePatterns[key] === patternToDetect
            );

            for (const tfName of timeframes) {
                const tf = timeframeMap[tfName];
                // Make a single API call for the selected pattern and timeframe
                const response = await axios.get(`http://localhost:8000/${patternToDetect}/${tf}`);
                const patternData = response.data;

                if (!patternData.error && Array.isArray(patternData)) {
                    patternData.forEach(p => {
                        allPatterns.push({
                            Date: new Date(p.timestamp),
                            Pattern: patternDisplayName,
                            Timeframe: tfName,
                            Instrument: file ? file.name.split('.').slice(0, -1).join('.') : 'API Data',
                            ...p,
                        });
                    });
                }
            }
            setDetectedPatterns(allPatterns.sort((a, b) => b.Date - a.Date));
            setSuccess(`Detection complete. Found ${allPatterns.length} instance(s) of "${patternDisplayName}".`);
        } catch (err) {
            setError(`Failed to fetch patterns: ${err.message}. Ensure the backend API is running.`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTimeframeChange = tf => {
        setTimeframes(prev => (prev.includes(tf) ? prev.filter(t => t !== tf) : [...prev, tf]));
    };

    // --- Charting Logic ---

    // Generate data for the candlestick chart based on the selected pattern row
    const getChartData = () => {
        if (!selectedPatternRow || baseData.length === 0) return null;

        const resampleData = (data, intervalMinutes) => {
            if (!data.length || !intervalMinutes) return [];
            const resampled = {};
            const intervalMs = intervalMinutes * 60 * 1000;

            data.forEach(d => {
                const groupTimestamp = Math.floor(d.timestamp.getTime() / intervalMs) * intervalMs;
                if (!resampled[groupTimestamp]) {
                    resampled[groupTimestamp] = {
                        timestamp: new Date(groupTimestamp),
                        Open: d.Open,
                        High: d.High,
                        Low: d.Low,
                        Close: d.Close,
                        Volume: d.Volume,
                    };
                } else {
                    const group = resampled[groupTimestamp];
                    group.High = Math.max(group.High, d.High);
                    group.Low = Math.min(group.Low, d.Low);
                    group.Close = d.Close;
                    group.Volume += d.Volume;
                }
            });
            return Object.values(resampled).sort((a, b) => a.timestamp - b.timestamp);
        };

        const intervalMinutes = timeframeMap[selectedPatternRow.Timeframe].replace('m', '');
        const resampled = resampleData(baseData, parseInt(intervalMinutes));
        
        const candleIndex = resampled.findIndex(
            d => d.timestamp.getTime() === selectedPatternRow.Date.getTime()
        );

        if (candleIndex === -1) {
            setError('Could not find the selected pattern in the uploaded data. Ensure the CSV covers the pattern date.');
            return null;
        }

        const startIndex = Math.max(0, candleIndex - 29); // Show 30 candles total
        const endIndex = candleIndex + 1;
        const chartSlice = resampled.slice(startIndex, endIndex);

        return {
            x: chartSlice.map(d => d.timestamp),
            open: chartSlice.map(d => d.Open),
            high: chartSlice.map(d => d.High),
            low: chartSlice.map(d => d.Low),
            close: chartSlice.map(d => d.Close),
            patternIndex: chartSlice.findIndex(d => d.timestamp.getTime() === selectedPatternRow.Date.getTime())
        };
    };

    const chartData = getChartData();

    // --- JSX Rendering ---
    return (
        <div className="bg-gray-900 text-gray-200 font-sans flex h-screen">
            {/* Sidebar */}
            <aside className="w-80 bg-gray-800/50 p-6 flex flex-col space-y-6 overflow-y-auto">
                <h2 className="text-xl font-bold text-white flex items-center">
                    <ChartIcon />
                    <span className="ml-2">Controls</span>
                </h2>

                {/* Data Source Selection */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-400">Select Data Source</label>
                    <div className="flex flex-col space-y-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="radio" name="dataSource" checked={dataSource === 'api'} onChange={() => setDataSource('api')}
                                className="form-radio h-4 w-4 text-indigo-600 bg-gray-800 border-gray-600 focus:ring-indigo-500" />
                            <span>Fetch from API</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="radio" name="dataSource" checked={dataSource === 'csv'} onChange={() => setDataSource('csv')}
                                className="form-radio h-4 w-4 text-indigo-600 bg-gray-800 border-gray-600 focus:ring-indigo-500" />
                            <span>Upload CSV File</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-not-allowed text-gray-500">
                            <input type="radio" name="dataSource" checked={dataSource === 'download'} onChange={() => setDataSource('download')}
                                className="form-radio h-4 w-4 text-indigo-600 bg-gray-800 border-gray-600 focus:ring-indigo-500" disabled />
                            <span>Download from Finance</span>
                        </label>
                    </div>
                </div>

                {/* CSV Uploader */}
                {dataSource === 'csv' && (
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-400">Upload your CSV file</label>
                        <div {...getRootProps()} className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-500 transition-colors">
                            <input {...getInputProps()} />
                            <UploadIcon />
                            <p className="mt-2 text-sm text-gray-400">
                                {isPapaReady ? (file ? 'Replace file' : (isDragActive ? 'Drop the file here...' : 'Drag & drop or click to upload')) : 'Loading parser...'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">CSV with 'datetime', or 'date'/'time', and OHLC columns.</p>
                        </div>
                        {file && (
                            <div className="flex items-center justify-between bg-gray-700/50 p-2 rounded-md">
                                <div className="flex items-center">
                                    <CsvIcon />
                                    <span className="text-sm font-mono truncate">{file.name}</span>
                                </div>
                                <button onClick={() => { setFile(null); setBaseData([]); setSuccess(''); }} className="text-gray-400 hover:text-white text-xl font-bold">&times;</button>
                            </div>
                        )}
                    </div>
                )}

                {/* Pattern Selection */}
                <div className="space-y-2">
                    <label htmlFor="pattern-select" className="text-sm font-semibold text-gray-400">Select Pattern to Detect</label>
                    <select
                        id="pattern-select"
                        value={patternToDetect}
                        onChange={(e) => setPatternToDetect(e.target.value)}
                        className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                        {Object.entries(availablePatterns).map(([name, value]) => (
                            <option key={value} value={value}>{name}</option>
                        ))}
                    </select>
                </div>


                {/* Timeframe Selection */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-400">Select Timeframes to Analyze</label>
                    <div className="flex flex-wrap gap-2">
                        {Object.keys(timeframeMap).map(tf => (
                            <button key={tf} onClick={() => handleTimeframeChange(tf)}
                                className={`px-3 py-1 text-sm rounded-full transition-colors ${timeframes.includes(tf) ? 'bg-indigo-600 text-white font-semibold' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                                {tf}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Action Button */}
                <button
                    onClick={handleRunDetection}
                    disabled={isLoading}
                    className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center">
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Analyzing...
                        </>
                    ) : (
                        'Run Pattern Detection'
                    )}
                </button>

                {/* Status Messages */}
                {success && <div className="p-3 bg-green-900/50 border border-green-500/50 text-green-300 rounded-md text-sm">{success}</div>}
                {error && <div className="p-3 bg-red-900/50 border border-red-500/50 text-red-300 rounded-md text-sm">{error}</div>}
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col p-6 space-y-6 overflow-hidden">
                <header>
                    <h1 className="text-2xl font-bold text-white">Candlestick Pattern Detection</h1>
                    <p className="text-gray-400">Use the controls on the left to analyze market data for specific candlestick patterns.</p>
                </header>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
                    {/* Detected Patterns Table */}
                    <div className="bg-gray-800/50 rounded-lg p-4 flex flex-col overflow-hidden">
                        <h3 className="text-lg font-semibold text-white mb-4">1. Detected Patterns</h3>
                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="sticky top-0 bg-gray-800">
                                    <tr>
                                        <th className="p-2">Instrument</th>
                                        <th className="p-2">Pattern</th>
                                        <th className="p-2">Timeframe</th>
                                        <th className="p-2">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detectedPatterns.length > 0 ? (
                                        detectedPatterns.map((p, index) => (
                                            <tr key={index} onClick={() => setSelectedPatternRow(p)}
                                                className={`border-t border-gray-700 hover:bg-gray-700/50 cursor-pointer ${selectedPatternRow && selectedPatternRow.Date.getTime() === p.Date.getTime() ? 'bg-indigo-900/50' : ''}`}>
                                                <td className="p-2">{p.Instrument}</td>
                                                <td className="p-2">{p.Pattern}</td>
                                                <td className="p-2">{p.Timeframe}</td>
                                                <td className="p-2">{p.Date.toLocaleString()}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="text-center p-8 text-gray-500">
                                                {isLoading ? 'Analyzing...' : 'No patterns detected. Run detection to see results.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Interactive Chart Viewer */}
                    <div className="bg-gray-800/50 rounded-lg p-4 flex flex-col">
                        <h3 className="text-lg font-semibold text-white mb-4">2. Interactive Candle Viewer</h3>
                        <div className="flex-1 flex items-center justify-center">
                            {dataSource === 'csv' && baseData.length === 0 ? (
                                <div className="text-center text-gray-500">
                                    <p>Please upload a CSV file to view charts.</p>
                                </div>
                            ) : chartData ? (
                                <Plot
                                    data={[{
                                        ...chartData,
                                        type: 'candlestick',
                                        name: selectedPatternRow.Instrument,
                                        increasing: { line: { color: '#26A69A' } },
                                        decreasing: { line: { color: '#EF5350' } },
                                    }]}
                                    layout={{
                                        title: `Pattern: ${selectedPatternRow.Pattern} on ${selectedPatternRow.Timeframe}`,
                                        dragmode: 'zoom',
                                        showlegend: false,
                                        plot_bgcolor: "rgba(0,0,0,0)",
                                        paper_bgcolor: "rgba(0,0,0,0)",
                                        font: { color: '#A0AEC0' },
                                        xaxis: {
                                            rangeslider: { visible: false },
                                            gridcolor: 'rgba(156, 163, 175, 0.2)',
                                        },
                                        yaxis: {
                                            autorange: true,
                                            gridcolor: 'rgba(156, 163, 175, 0.2)',
                                        },
                                        shapes: [{
                                            type: 'rect',
                                            xref: 'x',
                                            yref: 'paper',
                                            x0: chartData.x[chartData.patternIndex],
                                            y0: 0,
                                            x1: chartData.x[chartData.patternIndex],
                                            y1: 1,
                                            fillcolor: 'rgba(236, 201, 75, 0.5)',
                                            line: {
                                                color: '#ECC94B',
                                                width: 1,
                                                dash: 'dot'
                                            }
                                        }],
                                        annotations: [{
                                            x: chartData.x[chartData.patternIndex],
                                            y: 1.05,
                                            yref: 'paper',
                                            text: 'Pattern',
                                            showarrow: true,
                                            arrowhead: 4,
                                            ax: 0,
                                            ay: -40,
                                            font: { color: '#ECC94B' }
                                        }]
                                    }}
                                    useResizeHandler={true}
                                    style={{ width: "100%", height: "100%" }}
                                    config={{ responsive: true }}
                                />
                            ) : (
                                <div className="text-center text-gray-500">
                                    <p>Click on a detected pattern in the table to view its chart.</p>
                                    <p className="text-xs mt-2">(Chart requires a CSV upload to provide the base data)</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}