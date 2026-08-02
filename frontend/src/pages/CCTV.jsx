import { MdVideocam, MdWifi, MdInfoOutline } from "react-icons/md";

const CCTV = () => {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">CCTV</h1>
        <p className="text-sm text-slate-400">Live camera feeds and recording history</p>
      </div>

      <div className="card p-10 flex flex-col items-center justify-center text-center">
        <div className="h-16 w-16 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4">
          <MdVideocam size={30} />
        </div>
        <p className="font-semibold text-slate-800 mb-1">No cameras connected yet</p>
        <p className="text-sm text-slate-400 max-w-sm mb-6">
          Connect a WiFi camera to start monitoring your reading room. RTSP stream support for IP cameras is planned
          for a future update.
        </p>
        <button className="btn-primary flex items-center gap-2">
          <MdWifi size={18} /> Connect Camera
        </button>
      </div>

      <div className="card p-5 flex items-start gap-3">
        <MdInfoOutline className="text-primary-500 mt-0.5 shrink-0" size={20} />
        <p className="text-sm text-slate-500">
          This module is scaffolded for future integration. When ready, wire it up to a camera stream provider
          (e.g. WebRTC/HLS gateway for WiFi cameras, or an RTSP-to-HLS bridge for IP cameras) and this page will
          render live feeds, snapshot capture, and recording history.
        </p>
      </div>
    </div>
  );
};

export default CCTV;
