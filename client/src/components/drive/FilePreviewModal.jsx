import React, { useState, useEffect } from 'react';
import { XIcon, DownloadIcon, FileIcon, CopyIcon, CheckIcon, FileTextIcon, Volume2Icon } from 'lucide-react';
import api from '../../api/axios';

const FilePreviewModal = ({ file, onClose }) => {
    if (!file) return null;

    const apiBase = api.defaults.baseURL.replace('/api', '');
    const token = sessionStorage.getItem('token');

    const isImage = file.mimetype.startsWith('image/');
    const isPDF = file.mimetype.includes('pdf');
    const isVideo = file.mimetype.startsWith('video/');
    const isAudio = file.mimetype.startsWith('audio/');

    // Construct storage URL via backend proxy
    const fileStorageUrl = `${apiBase}${file.previewUrl}?token=${token}`;
    const downloadUrl = `${apiBase}/api/files/download/${file._id}?token=${token}`;

    const [textContent, setTextContent] = useState(null);
    const [loadingText, setLoadingText] = useState(false);
    const [isTextFile, setIsTextFile] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!isImage && !isPDF && !isVideo && !isAudio) {
            setLoadingText(true);
            setIsTextFile(false);
            setTextContent(null);
            fetch(fileStorageUrl)
                .then((res) => {
                    if (!res.ok) throw new Error(`Failed to fetch file content (status ${res.status})`);
                    return res.text();
                })
                .then((text) => {
                    // Simple heuristic to check if the file content is text/readable or binary
                    const isBinary = /[\x00-\x08\x0E-\x1F\x7F]/.test(text.slice(0, 1000));
                    if (!isBinary && text.length < 2000000) { // Limit to 2MB for rendering performance
                        setIsTextFile(true);
                        setTextContent(text);
                    } else {
                        setIsTextFile(false);
                    }
                })
                .catch((err) => {
                    console.error('Error fetching file content for preview:', err);
                    setIsTextFile(false);
                })
                .finally(() => {
                    setLoadingText(false);
                });
        }
    }, [fileStorageUrl, isImage, isPDF, isVideo, isAudio]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 lg:p-10">
            <div className="bg-white w-full max-w-5xl h-full max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in fade-in duration-300">
                <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                            <FileIcon size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800 truncate max-w-md">{file.name}</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{file.mimetype}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <a
                            href={downloadUrl}
                            className="p-3 text-slate-500 hover:bg-slate-100 rounded-2xl transition-all"
                        >
                            <DownloadIcon size={22} />
                        </a>
                        <button onClick={onClose} className="p-3 text-slate-500 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all">
                            <XIcon size={22} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-slate-50 flex items-center justify-center p-8">
                    {loadingText ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 border-4 border-slate-300 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                            <h4 className="text-lg font-bold text-slate-700">Loading file preview...</h4>
                        </div>
                    ) : isImage ? (
                        <img
                            src={fileStorageUrl}
                            alt={file.name}
                            className="max-width-full max-h-full object-contain rounded-xl shadow-lg border"
                        />
                    ) : isPDF ? (
                        <iframe
                            src={fileStorageUrl}
                            className="w-full h-full rounded-xl border shadow-sm"
                            title={file.name}
                        />
                    ) : isVideo ? (
                        <video
                            src={fileStorageUrl}
                            controls
                            className="max-w-full max-h-full rounded-xl shadow-lg border bg-black"
                        />
                    ) : isAudio ? (
                        <div className="bg-white p-8 rounded-3xl border shadow-md flex flex-col items-center gap-4 w-full max-w-md">
                            <div className="w-16 h-16 bg-primary-50 text-primary-500 rounded-full flex items-center justify-center">
                                <Volume2Icon size={32} />
                            </div>
                            <h4 className="font-bold text-slate-800 text-lg truncate w-full text-center">{file.name}</h4>
                            <audio src={fileStorageUrl} controls className="w-full mt-2" />
                        </div>
                    ) : isTextFile ? (
                        <div className="w-full h-full flex flex-col bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative">
                            {/* Toolbar */}
                            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
                                <div className="flex items-center gap-2">
                                    <FileTextIcon size={16} className="text-slate-400" />
                                    <span className="text-sm font-semibold text-slate-300">File Contents</span>
                                </div>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(textContent);
                                        setCopied(true);
                                        setTimeout(() => setCopied(false), 2000);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-700/50 cursor-pointer"
                                >
                                    {copied ? (
                                        <>
                                            <CheckIcon size={14} className="text-emerald-400" />
                                            <span className="text-emerald-400">Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <CopyIcon size={14} />
                                            <span>Copy Content</span>
                                        </>
                                    )}
                                </button>
                            </div>
                            {/* Scrollable text container */}
                            <div className="flex-1 overflow-auto p-6 font-mono text-xs leading-relaxed text-slate-300 text-left select-text selection:bg-primary-500/30">
                                <table className="w-full border-collapse">
                                    <tbody>
                                        {textContent.split('\n').map((line, idx) => (
                                            <tr key={idx} className="hover:bg-slate-900/50 group">
                                                <td className="w-10 pr-4 text-right text-slate-600 font-bold select-none border-r border-slate-800/60 group-hover:text-slate-400 transition-colors">
                                                    {idx + 1}
                                                </td>
                                                <td className="pl-4 whitespace-pre break-all">
                                                    {line || ' '}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="w-24 h-24 bg-slate-200 rounded-3xl flex items-center justify-center text-slate-400 mx-auto mb-6">
                                <FileIcon size={48} />
                            </div>
                            <h4 className="text-2xl font-black text-slate-800">No Preview Available</h4>
                            <p className="text-slate-500 mt-2 font-medium">Download the file to view its content.</p>
                            <a
                                href={downloadUrl}
                                className="inline-block mt-8 px-8 py-3 bg-primary-600 text-white font-bold rounded-2xl shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-all"
                            >
                                Download File
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FilePreviewModal;
