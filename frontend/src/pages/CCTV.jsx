import { MdVideocam, MdWifi, MdInfoOutline } from "react-icons/md";

const CCTV = () => {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-1">Security</p>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-heading">CCTV Surveillance</h1>
        <p className="text-sm text-slate-400 dark:text-slate-500">Live camera feeds and recording history</p>
      </div>

      <div className="card p-12 flex flex-col items-center justify-center text-center border border-slate-100 dark:border-slate-700">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center mb-4 shadow-lg shadow-primary-500/25">
          <MdVideocam size={32} />
        </div>
        <p className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-1 font-heading">No cameras connected yet</p>
        <p className="text-sm text-slate-400 dark:text-slate-500 max-w-sm mb-6">
          Connect a WiFi camera to start monitoring your reading room in real-time. RTSP stream support for IP cameras is planned for a future update.
        </p>
        <button className="btn-primary flex items-center gap-2">
          <MdWifi size={18} /> Connect Camera
        </button>
      </div>

      <div className="card p-5 flex items-start gap-3.5 border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60">
        <div className="h-8 w-8 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0 mt-0.5">
          <MdInfoOutline size={18} />
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          This module is scaffolded for future integration. When ready, wire it up to a camera stream provider (e.g. WebRTC/HLS gateway for WiFi cameras, or an RTSP-to-HLS bridge for IP cameras) to render live feeds, snapshot capture, and recording history.
        </p>
      </div>
    </div>
  );
};

export default CCTV;
