window.__ModuleLoader__.load({
  id: "dsh-video-merger",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    const React = require("react");
    const h = React.createElement;
    const { useState, useEffect, useMemo, useRef } = React;

    const API = "/plugins/dsh-video-merger";
    const STORE_KEY = "dsh-video-merger:last-root";

    const DICT = {
      zh: {
        tab: "视频合并",
        title: "视频合并",
        subtitle: "把每个文件夹里的视频合并成一个，分辨率、帧率、编码规格保持不变。",
        badgeLossless: "同规格无损",
        badgeSpec: "规格不变",
        rootPlaceholder: "选择或粘贴视频根目录，例如 E:\\Videos",
        pick: "选择文件夹",
        scan: "扫描文件夹",
        scanning: "扫描中…",
        recursive: "包含子文件夹",
        order: "排序",
        orderName: "按文件名（自然排序）",
        orderMtime: "按修改时间",
        overwrite: "覆盖已有输出",
        reencode: "规格不一致时转码对齐",
        unified: "统一输出到同一个文件夹",
        unifiedHint: "默认放到扫描根目录下",
        unifiedPath: "输出文件夹",
        unifiedPlaceholder: "留空使用扫描根目录",
        deleteSource: "合并后删除源文件",
        deleteWarn: "危险：确认输出可播放后再使用",
        found: "扫描结果",
        folders: "个文件夹",
        videos: "个视频",
        mergeable: "个可合并",
        selectAll: "全选",
        selectNone: "全不选",
        selected: "已选",
        start: "开始合并",
        starting: "正在启动…",
        single: "单视频",
        hasOutput: "已有输出",
        collapse: "收起",
        expand: "展开",
        noVideos: "这个文件夹里没有可识别的视频",
        job: "合并进度",
        overall: "总进度",
        cancel: "取消任务",
        cancelling: "正在取消…",
        current: "当前",
        pending: "等待",
        probing: "分析中",
        merging: "合并中",
        done: "完成",
        skipped: "跳过",
        error: "失败",
        cancelled: "已取消",
        output: "输出",
        openFolder: "打开文件夹",
        openFile: "播放",
        showInExplorer: "在资源管理器中显示",
        warnings: "提示",
        result: "任务结束",
        doneCount: "完成",
        skippedCount: "跳过",
        errorCount: "失败",
        outputSize: "输出大小",
        rescan: "重新扫描",
        ffmpegMissing: "没有找到 ffmpeg / ffprobe",
        ffmpegMissingHint: "合并视频需要 ffmpeg。可以自动下载（约 110 MB，来自 gyan.dev），也可以指定本机已安装的 ffmpeg 目录。",
        ffmpegMissingHintNoDownload: "合并视频需要 ffmpeg。请用系统包管理器安装，或指定本机已安装的 ffmpeg 目录。",
        install: "自动下载 ffmpeg",
        installing: "正在下载 ffmpeg…",
        extract: "正在解压…",
        verifying: "正在校验…",
        chooseDir: "指定 ffmpeg 目录",
        browseTitle: "选择文件夹",
        browseUp: "上一级",
        browseRefresh: "刷新",
        browseSelect: "选择此文件夹",
        browseCancel: "取消",
        browseEmpty: "这个文件夹里没有子文件夹",
        browseLoading: "正在读取目录…",
        browseUnavailable: "当前界面不支持目录浏览，请直接粘贴路径",
        browseHint: "点击文件夹进入，也可以直接修改上面的路径后回车。",
        recheck: "重新检测",
        ffmpegReady: "ffmpeg 已就绪",
        ffmpegVersion: "版本",
        source: "来源",
        managed: "插件自带",
        detected: "本机检测",
        configured: "手动指定",
        installDone: "ffmpeg 安装完成",
        installFailed: "ffmpeg 安装失败",
        emptyTitle: "还没有扫描任何文件夹",
        emptyStep1: "选择一个根目录",
        emptyStep2: "扫描每个文件夹里的视频",
        emptyStep3: "一键合并，输出到各自文件夹",
        tip: "输出文件放在各自文件夹内，命名为「文件夹名_merged.扩展名」。默认不修改、不删除任何原视频。",
        losslessNote: "同规格：直接封装，不重新编码，画质与规格完全不变。",
        transcodeNote: "规格不一致：转码对齐到该文件夹第一个视频的分辨率/帧率，使用 H.264 + AAC 输出。",
        loading: "正在读取环境…",
        retry: "重试",
        folderCount: "个",
        elapsed: "用时",
        speed: "速度",
        eta: "剩余",
        ffmpegPath: "路径",
        noSelection: "请至少选择一个文件夹",
        noMergeable: "没有包含 2 个及以上视频的文件夹",
        jobRunning: "任务进行中，页面可以关闭，任务会在后台继续。",
        singleSkipped: "只有一个视频，无需合并",
        incompatibleSkipped: "视频规格不一致，且未开启转码对齐",
        startHint: "每个文件夹至少需要 2 个视频才会合并。",
      },
      en: {
        tab: "Video Merger",
        title: "Video Merger",
        subtitle: "Merge every folder's videos into one file while keeping resolution, frame rate and codec unchanged.",
        badgeLossless: "Lossless when identical",
        badgeSpec: "Spec preserved",
        rootPlaceholder: "Choose or paste a root folder, e.g. E:\\Videos",
        pick: "Choose folder",
        scan: "Scan folders",
        scanning: "Scanning…",
        recursive: "Include subfolders",
        order: "Order",
        orderName: "File name (natural)",
        orderMtime: "Modified time",
        overwrite: "Overwrite existing output",
        reencode: "Transcode mismatched clips to match",
        unified: "Put all merged videos in one folder",
        unifiedHint: "Defaults to the scanned root folder",
        unifiedPath: "Output folder",
        unifiedPlaceholder: "Leave empty to use the scanned root",
        deleteSource: "Delete source videos after merge",
        deleteWarn: "Dangerous: only after verifying the output",
        found: "Scan result",
        folders: "folders",
        videos: "videos",
        mergeable: "mergeable",
        selectAll: "Select all",
        selectNone: "Select none",
        selected: "selected",
        start: "Start merging",
        starting: "Starting…",
        single: "single clip",
        hasOutput: "output exists",
        collapse: "Collapse",
        expand: "Expand",
        noVideos: "No recognised videos in this folder",
        job: "Progress",
        overall: "Overall",
        cancel: "Cancel job",
        cancelling: "Cancelling…",
        current: "Current",
        pending: "Pending",
        probing: "Probing",
        merging: "Merging",
        done: "Done",
        skipped: "Skipped",
        error: "Failed",
        cancelled: "Cancelled",
        output: "Output",
        openFolder: "Open folder",
        openFile: "Play",
        showInExplorer: "Show in Explorer",
        warnings: "Notes",
        result: "Finished",
        doneCount: "Done",
        skippedCount: "Skipped",
        errorCount: "Failed",
        outputSize: "Output size",
        rescan: "Rescan",
        ffmpegMissing: "ffmpeg / ffprobe not found",
        ffmpegMissingHint: "ffmpeg is required. Download it automatically (~110 MB from gyan.dev), or point to an existing ffmpeg installation.",
        ffmpegMissingHintNoDownload: "ffmpeg is required. Install it with your system package manager, or point to an existing ffmpeg installation.",
        install: "Download ffmpeg",
        installing: "Downloading ffmpeg…",
        extract: "Extracting…",
        verifying: "Verifying…",
        chooseDir: "Choose ffmpeg folder",
        browseTitle: "Choose a folder",
        browseUp: "Up",
        browseRefresh: "Refresh",
        browseSelect: "Use this folder",
        browseCancel: "Cancel",
        browseEmpty: "No subfolders here",
        browseLoading: "Reading folder…",
        browseUnavailable: "Folder browsing is unavailable here; paste a path instead",
        browseHint: "Click a folder to open it, or edit the path above and press Enter.",
        recheck: "Check again",
        ffmpegReady: "ffmpeg ready",
        ffmpegVersion: "Version",
        source: "Source",
        managed: "bundled",
        detected: "detected",
        configured: "configured",
        installDone: "ffmpeg installed",
        installFailed: "ffmpeg installation failed",
        emptyTitle: "No folder scanned yet",
        emptyStep1: "Choose a root folder",
        emptyStep2: "Scan the videos in every folder",
        emptyStep3: "Merge each folder into one file",
        tip: "Output is written inside each folder as “FolderName_merged.ext”. Source videos are never modified or deleted by default.",
        losslessNote: "Identical clips: stream-copied, no re-encode, so quality and spec are untouched.",
        transcodeNote: "Mismatched clips: normalised to the first clip's resolution/frame rate, encoded as H.264 + AAC.",
        loading: "Reading environment…",
        retry: "Retry",
        folderCount: "folder(s)",
        elapsed: "elapsed",
        speed: "speed",
        eta: "ETA",
        ffmpegPath: "Path",
        noSelection: "Select at least one folder",
        noMergeable: "No folder contains two or more videos",
        jobRunning: "The job keeps running in the background even if you close this page.",
        singleSkipped: "Only one video, nothing to merge",
        incompatibleSkipped: "Clips differ and transcode fallback is off",
        startHint: "A folder needs at least two videos to be merged.",
      },
    };

    function useLang(locale) {
      const read = () => {
        const active = String(locale?.getSnapshot?.()?.active || "");
        return active.toLowerCase().startsWith("en") ? "en" : "zh";
      };
      const [lang, setLang] = useState(read);
      useEffect(() => {
        if (!locale?.subscribe) return undefined;
        return locale.subscribe(() => setLang(read()));
      }, [locale]);
      return lang;
    }

    function makeT(lang) {
      const table = DICT[lang] || DICT.zh;
      return (key) => (table[key] !== undefined ? table[key] : DICT.zh[key] !== undefined ? DICT.zh[key] : key);
    }

    function fmtBytes(bytes) {
      const n = Number(bytes) || 0;
      if (n < 1024) return n + " B";
      const units = ["KB", "MB", "GB", "TB"];
      let v = n / 1024;
      let i = 0;
      while (v >= 1024 && i < units.length - 1) { v /= 1024; i += 1; }
      return (v >= 100 ? v.toFixed(0) : v.toFixed(1)) + " " + units[i];
    }

    function fmtTime(sec) {
      if (!Number.isFinite(sec) || sec <= 0) return "0s";
      const s = Math.round(sec);
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      if (h) return h + "h " + String(m).padStart(2, "0") + "m";
      if (m) return m + "m " + String(s % 60).padStart(2, "0") + "s";
      return s + "s";
    }

    function cls() {
      return Array.prototype.filter.call(arguments, Boolean).join(" ");
    }

    async function post(path, body) {
      const res = await fetch(API + path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body || {}),
      });
      let data = null;
      try { data = await res.json(); } catch { data = null; }
      if (!res.ok) throw new Error((data && data.error) || ("HTTP " + res.status));
      return data;
    }

    const STATUS_COLORS = {
      pending: "#8b93a7",
      probing: "#4f8cff",
      merging: "#4f8cff",
      done: "#2fbf71",
      skipped: "#f5a623",
      error: "#ef5350",
      cancelled: "#8b93a7",
    };

    function StatusDot(props) {
      const color = STATUS_COLORS[props.status] || "#8b93a7";
      return h("span", { className: "vm-dot", style: { background: color } });
    }

    function Bar(props) {
      const value = Math.max(0, Math.min(100, Number(props.value) || 0));
      return h("div", { className: cls("vm-bar", props.className) },
        h("div", { className: "vm-bar-fill", style: { width: value + "%", background: props.color || "linear-gradient(90deg,#4f8cff,#7aa7ff)" } })
      );
    }

    function Check(props) {
      return h("label", { className: cls("vm-check", props.disabled && "is-disabled"), title: props.title || "" },
        h("input", { type: "checkbox", checked: Boolean(props.checked), disabled: Boolean(props.disabled), onChange: (e) => props.onChange && props.onChange(e.target.checked) }),
        h("span", { className: "vm-check-box" }, props.checked ? h("svg", { viewBox: "0 0 16 16", width: 11, height: 11 }, h("path", { d: "M2 8.5 6 12.5 14 3.5", fill: "none", stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round" })) : null),
        props.label ? h("span", { className: "vm-check-label" }, props.label) : null,
        props.hint ? h("span", { className: "vm-check-hint" }, props.hint) : null
      );
    }

    function isWinPath(p) {
      return /^[A-Za-z]:[\\/]/.test(String(p || "")) || String(p || "").includes("\\");
    }

    function joinPath(dir, name) {
      const d = String(dir || "");
      if (!d) return name;
      const sep = isWinPath(d) ? "\\" : "/";
      return /[\\/]$/.test(d) ? d + name : d + sep + name;
    }

    function parentPath(p) {
      const s = String(p || "").replace(/[\\/]+$/, "");
      if (!s) return "";
      if (/^[A-Za-z]:$/.test(s)) return "";
      const sep = isWinPath(s) ? "\\" : "/";
      const i = s.lastIndexOf(sep);
      if (i < 0) return "";
      if (i === 0) return sep;
      if (i === 2 && /^[A-Za-z]:/.test(s)) return s.slice(0, 3);
      return s.slice(0, i);
    }

    function normalizeListing(raw, base) {
      const list = Array.isArray(raw)
        ? raw
        : (raw && (raw.entries || raw.items || raw.children || raw.list || raw.nodes)) || [];
      const dirs = [];
      for (const item of list) {
        if (!item || typeof item !== "object") continue;
        const name = item.name || item.basename || item.fileName || "";
        const full = item.path || item.fullPath || item.absolutePath || (name ? joinPath(base, name) : "");
        const kind = String(item.kind || item.type || "").toLowerCase();
        const explicitFile = item.isDirectory === false || item.isFile === true || item.isDir === false ||
          kind === "file" || kind === "f";
        // Host listDirectory only returns child directories and does not stamp
        // a type on them; treat untyped rows as folders, but honour explicit
        // file markers from other listing shapes.
        const isDir = !explicitFile && (
          item.isDirectory === true || item.isDir === true || item.directory === true ||
          kind === "directory" || kind === "dir" || kind === "folder" || kind === "d" ||
          Boolean(name || item.path)
        );
        if (!isDir || !full) continue;
        dirs.push({ name: name || full, path: full, hidden: Boolean(item.hidden) });
      }
      dirs.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));
      return {
        path: (raw && (raw.path || raw.current || raw.cwd)) || base || "",
        dirs,
        breadcrumbs: (raw && (raw.breadcrumbs || raw.ancestors || raw.parents)) || null,
      };
    }

    function VideoMergerView(props) {
      const locale = props.locale || null;
      const lang = useLang(locale);
      const t = useMemo(() => makeT(lang), [lang]);
      const workspace = props.uiWorkspace || null;

      const [health, setHealth] = useState(null);
      const [root, setRoot] = useState(() => {
        try { return localStorage.getItem(STORE_KEY) || ""; } catch { return ""; }
      });
      const [recursive, setRecursive] = useState(true);
      const [order, setOrder] = useState("name");
      const [overwrite, setOverwrite] = useState(false);
      const [reencode, setReencode] = useState(true);
      const [unified, setUnified] = useState(true);
      const [unifiedDir, setUnifiedDir] = useState("");
      const [deleteSource, setDeleteSource] = useState(false);
      const [scan, setScan] = useState(null);
      const [selected, setSelected] = useState(() => new Set());
      const [expanded, setExpanded] = useState(() => new Set());
      const [busy, setBusy] = useState("");
      const [error, setError] = useState("");
      const [job, setJob] = useState(null);
      const [install, setInstall] = useState(null);
      const [notice, setNotice] = useState("");
      const [browse, setBrowse] = useState(null);
      const browseSeq = useRef(0);

      const alive = useRef(true);
      const jobRef = useRef(null);
      jobRef.current = job;

      useEffect(() => {
        alive.current = true;
        return () => { alive.current = false; };
      }, []);

      const refreshHealth = async () => {
        try {
          const data = await post("/health");
          if (!alive.current) return;
          setHealth(data);
          if (data.install && data.install.status !== "idle") setInstall(data.install);
        } catch (e) {
          if (alive.current) setError(String(e.message || e));
        }
      };

      useEffect(() => {
        refreshHealth();
        let stop = false;
        const timer = setInterval(async () => {
          if (stop) return;
          try {
            const data = await post("/job");
            if (!alive.current) return;
            setJob(data.job || null);
            if (data.install && data.install.status !== "idle") setInstall(data.install);
          } catch { /* transient */ }
        }, 900);
        return () => { stop = true; clearInterval(timer); };
      }, []);

      useEffect(() => {
        if (install && install.status === "done") {
          setNotice(t("installDone"));
          refreshHealth();
        }
      }, [install && install.status]);

      useEffect(() => {
        if (!browse) return undefined;
        const onKey = (e) => { if (e.key === "Escape") closeBrowser(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
      }, [Boolean(browse)]);

      const loadBrowse = async (p, mode) => {
        if (!workspace || typeof workspace.listDirectory !== "function") {
          setError(t("browseUnavailable"));
          return;
        }
        const seq = ++browseSeq.current;
        setBrowse((prev) => ({
          mode: mode || prev?.mode || "root",
          path: p || "",
          dirs: prev?.dirs || [],
          loading: true,
          error: "",
        }));
        try {
          const raw = await workspace.listDirectory(p || undefined);
          if (seq !== browseSeq.current) return;
          const norm = normalizeListing(raw, p);
          setBrowse((prev) => ({
            mode: (prev && prev.mode) || mode || "root",
            path: norm.path || p || "",
            dirs: norm.dirs,
            breadcrumbs: norm.breadcrumbs,
            loading: false,
            error: "",
          }));
        } catch (e) {
          if (seq !== browseSeq.current) return;
          setBrowse((prev) => ({
            ...(prev || { mode: mode || "root", path: p || "" }),
            loading: false,
            error: String(e.message || e),
          }));
        }
      };

      const openBrowser = (mode) => {
        setError("");
        const start = mode === "ffmpeg"
          ? (health?.ffmpeg?.dir || parentPath(health?.ffmpeg?.ffmpeg) || "")
          : mode === "output"
            ? (unifiedDir || root || "")
            : (root || "");
        loadBrowse(start, mode);
      };

      const closeBrowser = () => {
        browseSeq.current += 1;
        setBrowse(null);
      };

      const browseUp = () => {
        if (!browse) return;
        const up = parentPath(browse.path);
        if (up) loadBrowse(up, browse.mode);
      };

      const browseEnter = (path) => {
        if (!browse) return;
        loadBrowse(path, browse.mode);
      };

      const applyFfmpegDir = async (dir) => {
        try {
          const data = await post("/config", { ffmpegDir: dir });
          setHealth((prev) => ({ ...(prev || {}), ...data, install: prev?.install || { status: "idle" } }));
          if (!data.ffmpeg?.available) setError(t("ffmpegMissing") + " · " + dir);
          else setNotice(t("ffmpegReady") + " · " + data.ffmpeg.version);
        } catch (e) {
          setError(String(e.message || e));
        }
      };

      const chooseBrowse = async () => {
        if (!browse) return;
        const target = String(browse.path || "").trim();
        if (!target) return;
        const mode = browse.mode;
        closeBrowser();
        if (mode === "ffmpeg") {
          await applyFfmpegDir(target);
        } else if (mode === "output") {
          setUnifiedDir(target);
        } else {
          setRoot(target);
          setScan(null);
          setSelected(new Set());
          try { localStorage.setItem(STORE_KEY, target); } catch {}
        }
      };

      const handlePick = () => openBrowser("root");

      const handleScan = async () => {
        const target = (root || "").trim();
        if (!target) {
          setError(t("rootPlaceholder"));
          return;
        }
        setBusy("scan");
        setError("");
        setScan(null);
        setSelected(new Set());
        try {
          const data = await post("/scan", { root: target, recursive, order });
          if (!alive.current) return;
          setScan(data);
          const mergeable = (data.folders || []).filter((f) => f.count >= 2);
          setSelected(new Set(mergeable.map((f) => f.path)));
          if (!data.folders || data.folders.length === 0) setError(t("noMergeable"));
          try { localStorage.setItem(STORE_KEY, target); } catch {}
        } catch (e) {
          if (alive.current) setError(String(e.message || e));
        } finally {
          if (alive.current) setBusy("");
        }
      };

      const handleStart = async () => {
        const target = (root || "").trim();
        if (!target) {
          setError(t("rootPlaceholder"));
          return;
        }
        const folders = Array.from(selected);
        if (folders.length === 0) {
          setError(t("noSelection"));
          return;
        }
        setBusy("start");
        setError("");
        setNotice("");
        try {
          await post("/merge", {
            root: target,
            folders,
            options: {
              recursive,
              order,
              overwrite,
              reencodeFallback: reencode,
              deleteSource,
              outputDir: unified ? (unifiedDir.trim() || target) : "",
            },
          });
          const data = await post("/job");
          if (alive.current) setJob(data.job || null);
        } catch (e) {
          if (alive.current) setError(String(e.message || e));
        } finally {
          if (alive.current) setBusy("");
        }
      };

      const handleCancel = async () => {
        try {
          await post("/cancel");
        } catch (e) {
          setError(String(e.message || e));
        }
      };

      const handleInstall = async () => {
        setError("");
        setNotice("");
        try {
          const data = await post("/ffmpeg/install");
          setInstall(data);
        } catch (e) {
          setError(String(e.message || e));
        }
      };

      const handleChooseFfmpeg = () => {
        setError("");
        setNotice("");
        openBrowser("ffmpeg");
      };

      const reveal = async (p, open) => {
        try {
          await post(open ? "/open" : "/reveal", { path: p });
        } catch (e) {
          setError(String(e.message || e));
        }
      };

      const toggleFolder = (p) => {
        setSelected((prev) => {
          const next = new Set(prev);
          if (next.has(p)) next.delete(p); else next.add(p);
          return next;
        });
      };

      const toggleExpand = (p) => {
        setExpanded((prev) => {
          const next = new Set(prev);
          if (next.has(p)) next.delete(p); else next.add(p);
          return next;
        });
      };

      const folders = scan?.folders || [];
      const mergeable = folders.filter((f) => f.count >= 2);
      const totals = scan?.totals;
      const jobActive = job && (job.status === "running" || job.status === "cancelling");
      const ffmpegReady = Boolean(health?.ffmpeg?.available);
      const canInstall = health?.canInstall !== false;
      const installBusy = install && ["downloading", "extracting", "verifying"].includes(install.status);
      const installPercent = install ? Number(install.percent) || 0 : 0;

      const statusLabel = (s) => {
        const key = s === "done" ? "done" : s === "skipped" ? "skipped" : s === "error" ? "error" : s === "cancelled" ? "cancelled" : s === "merging" ? "merging" : s === "probing" ? "probing" : "pending";
        return t(key);
      };

      const sourceLabel = (s) => (s === "managed" ? t("managed") : s === "configured" ? t("configured") : t("detected"));

      return h("div", { className: "vm-root" },
        h("header", { className: "vm-hero" },
          h("div", { className: "vm-hero-mark" },
            h("svg", { viewBox: "0 0 24 24", width: 26, height: 26, fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" },
              h("rect", { x: 2.5, y: 5, width: 19, height: 14, rx: 3 }),
              h("path", { d: "M8 5v14M16 5v14M2.5 12h19" })
            )
          ),
          h("div", { className: "vm-hero-text" },
            h("div", { className: "vm-hero-title-row" },
              h("h1", null, t("title")),
              h("span", { className: "vm-pill" }, t("badgeSpec")),
              h("span", { className: "vm-pill vm-pill-soft" }, t("badgeLossless"))
            ),
            h("p", null, t("subtitle"))
          ),
          h("div", { className: "vm-hero-side" },
            ffmpegReady
              ? h("div", { className: "vm-ffmpeg-chip", title: health.ffmpeg.ffmpeg },
                  h("span", { className: "vm-ok-dot" }),
                  h("span", null, "ffmpeg " + health.ffmpeg.version)
                )
              : health
                ? h("div", { className: "vm-ffmpeg-chip is-warn" }, h("span", { className: "vm-warn-dot" }), h("span", null, "ffmpeg?"))
                : h("div", { className: "vm-ffmpeg-chip" }, t("loading"))
          )
        ),

        error ? h("div", { className: "vm-alert is-error" },
          h("div", { className: "vm-alert-text" }, error),
          h("button", { className: "vm-btn vm-btn-ghost", onClick: () => setError("") }, "×")
        ) : null,

        notice ? h("div", { className: "vm-alert is-ok" },
          h("div", { className: "vm-alert-text" }, notice),
          h("button", { className: "vm-btn vm-btn-ghost", onClick: () => setNotice("") }, "×")
        ) : null,

        health && !ffmpegReady ? h("section", { className: "vm-card vm-install-card" },
          h("div", { className: "vm-card-head" },
            h("div", null,
              h("h2", null, t("ffmpegMissing")),
              h("p", { className: "vm-muted" }, canInstall ? t("ffmpegMissingHint") : t("ffmpegMissingHintNoDownload"))
            )
          ),
          h("div", { className: "vm-install-actions" },
            canInstall ? h("button", { className: "vm-btn vm-btn-primary", disabled: installBusy, onClick: handleInstall }, installBusy ? t("installing") : t("install")) : null,
            h("button", { className: "vm-btn", disabled: installBusy, onClick: handleChooseFfmpeg }, t("chooseDir")),
            h("button", { className: "vm-btn vm-btn-ghost", onClick: refreshHealth }, t("recheck"))
          ),
          installBusy || install?.status === "done" || install?.status === "error" ? h("div", { className: "vm-install-progress" },
            h("div", { className: "vm-install-line" },
              h("span", null, install.status === "downloading" ? t("installing") : install.status === "extracting" ? t("extract") : install.status === "verifying" ? t("verifying") : install.status === "done" ? t("installDone") : t("installFailed")),
              h("span", { className: "vm-mono" }, install.total ? fmtBytes(install.received) + " / " + fmtBytes(install.total) : String(installPercent) + "%")
            ),
            h(Bar, { value: installPercent, color: install.status === "error" ? "#ef5350" : undefined }),
            install.error ? h("div", { className: "vm-small is-error-text" }, install.error) : null
          ) : null
        ) : null,

        health && ffmpegReady ? h("div", { className: "vm-ffmpeg-line" },
          h("span", { className: "vm-ok-dot" }),
          h("span", null, t("ffmpegReady")),
          h("span", { className: "vm-sep" }, "·"),
          h("span", { className: "vm-muted" }, t("ffmpegVersion") + " " + health.ffmpeg.version),
          h("span", { className: "vm-sep" }, "·"),
          h("span", { className: "vm-muted vm-ellipsis", title: health.ffmpeg.ffmpeg }, health.ffmpeg.ffmpeg),
          h("button", { className: "vm-link", onClick: handleChooseFfmpeg }, t("chooseDir"))
        ) : null,

        h("section", { className: "vm-card" },
          h("div", { className: "vm-path-row" },
            h("div", { className: "vm-path-field" },
              h("svg", { viewBox: "0 0 24 24", width: 17, height: 17, fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" },
                h("path", { d: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" })
              ),
              h("input", {
                className: "vm-input",
                value: root,
                spellCheck: false,
                placeholder: t("rootPlaceholder"),
                onChange: (e) => setRoot(e.target.value),
                onKeyDown: (e) => { if (e.key === "Enter" && !busy) handleScan(); },
              })
            ),
            h("button", { className: "vm-btn", onClick: handlePick, disabled: Boolean(busy) }, t("pick")),
            h("button", { className: "vm-btn vm-btn-primary", onClick: handleScan, disabled: Boolean(busy) || jobActive }, busy === "scan" ? t("scanning") : t("scan"))
          ),
          h("div", { className: "vm-opts-row" },
            h(Check, { checked: recursive, onChange: setRecursive, label: t("recursive") }),
            h("div", { className: "vm-order" },
              h("span", { className: "vm-muted" }, t("order")),
              h("select", { className: "vm-select", value: order, onChange: (e) => setOrder(e.target.value) },
                h("option", { value: "name" }, t("orderName")),
                h("option", { value: "mtime" }, t("orderMtime"))
              )
            ),
            h(Check, { checked: overwrite, onChange: setOverwrite, label: t("overwrite") }),
            h(Check, { checked: reencode, onChange: setReencode, label: t("reencode") }),
            h(Check, { checked: deleteSource, onChange: setDeleteSource, label: t("deleteSource"), hint: t("deleteWarn") })
          ),
          h("div", { className: "vm-output-row" },
            h(Check, { checked: unified, onChange: setUnified, label: t("unified"), hint: t("unifiedHint") }),
            unified ? h("div", { className: "vm-output-path" },
              h("span", { className: "vm-muted" }, t("unifiedPath")),
              h("div", { className: "vm-path-field" },
                h("svg", { viewBox: "0 0 16 16", width: 14, height: 14 },
                  h("path", { d: "M1.5 4.5h4l1.2 1.6h7.8v6.4a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1z", fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinejoin: "round" })
                ),
                h("input", {
                  className: "vm-input",
                  value: unifiedDir,
                  placeholder: root || t("unifiedPlaceholder"),
                  spellCheck: false,
                  onChange: (e) => setUnifiedDir(e.target.value),
                  onKeyDown: (e) => { if (e.key === "Enter") openBrowser("output"); },
                })
              ),
              h("button", { className: "vm-btn", onClick: () => openBrowser("output"), disabled: Boolean(busy) }, t("pick"))
            ) : null
          ),
          h("div", { className: "vm-hint-row" },
            h("span", { className: "vm-hint" }, t("losslessNote")),
            h("span", { className: "vm-hint" }, t("transcodeNote"))
          )
        ),

        scan ? h("section", { className: "vm-card" },
          h("div", { className: "vm-scan-head" },
            h("div", null,
              h("h2", null, t("found")),
              h("div", { className: "vm-stats" },
                h("span", { className: "vm-stat" }, h("b", null, totals.folders), " " + t("folders")),
                h("span", { className: "vm-stat" }, h("b", null, totals.videos), " " + t("videos")),
                h("span", { className: "vm-stat" }, h("b", null, totals.mergeable), " " + t("mergeable")),
                h("span", { className: "vm-stat vm-muted" }, fmtBytes(totals.bytes))
              )
            ),
            h("div", { className: "vm-scan-actions" },
              h("button", { className: "vm-link", onClick: () => setSelected(new Set(mergeable.map((f) => f.path))) }, t("selectAll")),
              h("span", { className: "vm-sep" }, "·"),
              h("button", { className: "vm-link", onClick: () => setSelected(new Set()) }, t("selectNone")),
              h("span", { className: "vm-selected-count" }, t("selected") + " " + selected.size)
            )
          ),
          h("div", { className: "vm-table-head" },
            h("span", null),
            h("span", null, t("folders")),
            h("span", null, t("videos")),
            h("span", null)
          ),
          h("div", { className: "vm-folder-list" },
            folders.length === 0
              ? h("div", { className: "vm-empty-line" }, t("noVideos"))
              : folders.map((f) => {
                  const isOpen = expanded.has(f.path);
                  const disabled = f.count < 2;
                  return h("div", { className: "vm-folder-block", key: f.path },
                    h("div", { className: cls("vm-folder-row", disabled && "is-disabled") },
                      h("div", { className: "vm-folder-check" },
                        h(Check, { checked: selected.has(f.path), disabled, onChange: () => toggleFolder(f.path) })
                      ),
                      h("button", { className: "vm-folder-main", onClick: () => toggleExpand(f.path), title: f.path },
                        h("div", { className: "vm-folder-name" }, f.rel === "." ? f.path : f.rel),
                        h("div", { className: "vm-folder-sub" }, (f.count >= 2 ? t("startHint") : t("singleSkipped")))
                      ),
                      h("div", { className: "vm-folder-count" }, f.count + " " + t("videos")),
                      h("div", { className: "vm-folder-size" }, fmtBytes(f.totalSize)),
                      h("div", { className: "vm-folder-badges" },
                        disabled ? h("span", { className: "vm-badge" }, t("single")) : null,
                        f.outputExists ? h("span", { className: "vm-badge is-soft" }, t("hasOutput")) : null
                      ),
                      h("button", { className: "vm-icon-btn", onClick: () => toggleExpand(f.path), title: isOpen ? t("collapse") : t("expand") },
                        h("svg", { viewBox: "0 0 16 16", width: 14, height: 14, style: { transform: isOpen ? "rotate(90deg)" : "none", transition: "transform .15s" } },
                          h("path", { d: "M6 3l5 5-5 5", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" })
                        )
                      )
                    ),
                    isOpen ? h("div", { className: "vm-file-list" },
                      f.videos.slice(0, 300).map((v) => h("div", { className: "vm-file-row", key: v.path, title: v.path },
                        h("span", { className: "vm-file-dot" }),
                        h("span", { className: "vm-file-name" }, v.name),
                        h("span", { className: "vm-file-size" }, fmtBytes(v.size))
                      )),
                      f.videos.length > 300 ? h("div", { className: "vm-file-more" }, "+" + (f.videos.length - 300)) : null
                    ) : null
                  );
                })
          ),
          h("div", { className: "vm-start-row" },
            h("div", { className: "vm-start-note" },
              h("span", null, t("startHint")),
              deleteSource ? h("span", { className: "vm-danger-text" }, " · " + t("deleteWarn")) : null
            ),
            h("button", { className: "vm-btn vm-btn-primary vm-btn-lg", disabled: Boolean(busy) || jobActive || selected.size === 0, onClick: handleStart },
              busy === "start" ? t("starting") : t("start") + " (" + selected.size + ")"
            )
          )
        ) : h("section", { className: "vm-empty-card" },
          h("div", { className: "vm-empty-icon" },
            h("svg", { viewBox: "0 0 48 48", width: 44, height: 44, fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" },
              h("rect", { x: 6, y: 10, width: 36, height: 28, rx: 4 }),
              h("path", { d: "M18 10v28M30 10v28M6 24h36" }),
              h("circle", { cx: 24, cy: 24, r: 4 })
            )
          ),
          h("h2", null, t("emptyTitle")),
          h("div", { className: "vm-steps" },
            h("div", { className: "vm-step" }, h("span", null, "1"), h("div", null, t("emptyStep1"))),
            h("div", { className: "vm-step" }, h("span", null, "2"), h("div", null, t("emptyStep2"))),
            h("div", { className: "vm-step" }, h("span", null, "3"), h("div", null, t("emptyStep3")))
          )
        ),

        job ? h("section", { className: "vm-card vm-job-card" },
          h("div", { className: "vm-job-head" },
            h("div", { className: "vm-job-title" },
              h("h2", null, t("job")),
              h(StatusDot, { status: job.status === "running" ? "merging" : job.status === "done" ? "done" : job.status === "failed" ? "error" : job.status === "cancelled" ? "cancelled" : "pending" }),
              h("span", { className: "vm-job-status" }, job.status === "running" ? t("merging") : job.status === "cancelling" ? t("cancelling") : job.status === "done" ? t("done") : job.status === "failed" ? t("error") : job.status === "cancelled" ? t("cancelled") : job.status)
            ),
            h("div", { className: "vm-job-actions" },
              jobActive ? h("button", { className: "vm-btn vm-btn-danger", onClick: handleCancel, disabled: job.status === "cancelling" }, job.status === "cancelling" ? t("cancelling") : t("cancel")) : null,
              !jobActive && job.root ? h("button", { className: "vm-btn", onClick: () => reveal(job.root) }, t("openFolder")) : null
            )
          ),
          h("div", { className: "vm-overall" },
            h("div", { className: "vm-overall-line" },
              h("span", null, t("overall")),
              h("span", { className: "vm-mono" }, (job.overallProgress || 0) + "%  ·  " + (job.completedFolders || 0) + "/" + job.totalFolders),
              job.summary ? h("span", { className: "vm-muted" }, "  ·  " + fmtBytes(job.summary.outputBytes)) : null
            ),
            h(Bar, { value: job.overallProgress || 0 })
          ),
          job.summary ? h("div", { className: "vm-summary-chips" },
            h("span", { className: "vm-summary-chip is-ok" }, t("doneCount") + " " + job.summary.done),
            h("span", { className: "vm-summary-chip" }, t("skippedCount") + " " + job.summary.skipped),
            h("span", { className: "vm-summary-chip is-bad" }, t("errorCount") + " " + job.summary.error),
            h("span", { className: "vm-summary-chip" }, t("outputSize") + " " + fmtBytes(job.summary.outputBytes))
          ) : null,
          jobActive ? h("div", { className: "vm-small vm-muted" }, t("jobRunning")) : null,
          h("div", { className: "vm-job-list" },
            (job.folders || []).map((f) => h("div", { className: cls("vm-job-item", "is-" + f.status), key: f.path },
              h("div", { className: "vm-job-item-head" },
                h(StatusDot, { status: f.status }),
                h("div", { className: "vm-job-item-name", title: f.path }, f.name || f.path),
                h("span", { className: "vm-job-item-count" }, f.count ? f.count + " " + t("videos") : ""),
                h("span", { className: cls("vm-job-item-status", "is-" + f.status) }, statusLabel(f.status)),
                f.status === "done" && f.output ? h("button", { className: "vm-link", onClick: () => reveal(f.output, true) }, t("openFile")) : null,
                f.status === "done" && f.output ? h("button", { className: "vm-link", onClick: () => reveal(f.output) }, t("showInExplorer")) : null
              ),
              f.status === "merging" || f.status === "probing" ? h("div", { className: "vm-job-progress" },
                h(Bar, { value: f.progress || 0 }),
                h("div", { className: "vm-job-progress-meta" },
                  h("span", { className: "vm-ellipsis" }, f.message || ""),
                  h("span", { className: "vm-mono" }, (f.progress || 0) + "%"),
                  f.speed ? h("span", { className: "vm-mono vm-muted" }, f.speed) : null,
                  f.etaSec ? h("span", { className: "vm-mono vm-muted" }, t("eta") + " " + fmtTime(f.etaSec)) : null
                )
              ) : f.message ? h("div", { className: "vm-job-message" }, f.message) : null,
              f.output && f.status === "done" ? h("div", { className: "vm-job-output", title: f.output }, h("span", { className: "vm-muted" }, t("output") + " · "), f.output, h("span", { className: "vm-muted" }, "  (" + fmtBytes(f.outputSize) + ")")) : null,
              f.warnings && f.warnings.length ? h("div", { className: "vm-job-warning" }, t("warnings") + ": " + f.warnings.join("；")) : null
            ))
          ),
          !jobActive && job.status === "done" ? h("div", { className: "vm-job-footer" },
            h("button", { className: "vm-btn", onClick: handleScan }, t("rescan"))
          ) : null
        ) : null,

        browse ? h("div", { className: "vm-modal-backdrop", onMouseDown: closeBrowser },
          h("div", { className: "vm-modal", onMouseDown: (e) => e.stopPropagation() },
            h("div", { className: "vm-modal-head" },
              h("h3", null, browse.mode === "ffmpeg" ? t("chooseDir") : t("browseTitle")),
              h("button", { className: "vm-btn vm-btn-ghost", onClick: closeBrowser }, "×")
            ),
            h("div", { className: "vm-modal-path" },
              h("button", { className: "vm-btn", onClick: browseUp, disabled: !parentPath(browse.path) }, "↑ " + t("browseUp")),
              h("input", {
                className: "vm-input",
                value: browse.path,
                spellCheck: false,
                autoFocus: true,
                onChange: (e) => setBrowse((prev) => ({ ...(prev || {}), path: e.target.value })),
                onKeyDown: (e) => { if (e.key === "Enter") browseEnter(e.target.value); },
              }),
              h("button", { className: "vm-btn", onClick: () => browseEnter(browse.path) }, t("browseRefresh"))
            ),
            h("div", { className: "vm-modal-hint" }, t("browseHint")),
            browse.error ? h("div", { className: "vm-alert is-error" }, h("div", { className: "vm-alert-text" }, browse.error)) : null,
            h("div", { className: "vm-dir-list" },
              browse.loading
                ? h("div", { className: "vm-empty-line" }, t("browseLoading"))
                : (browse.dirs || []).length === 0
                  ? h("div", { className: "vm-empty-line" }, t("browseEmpty"))
                  : (browse.dirs || []).map((d) => h("button", {
                      className: cls("vm-dir", d.hidden && "is-hidden"),
                      key: d.path,
                      title: d.path,
                      onClick: () => browseEnter(d.path),
                    },
                      h("svg", { viewBox: "0 0 24 24", width: 16, height: 16, fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" },
                        h("path", { d: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" })
                      ),
                      h("span", { className: "vm-dir-name" }, d.name)
                    ))
            ),
            h("div", { className: "vm-modal-foot" },
              h("div", { className: "vm-modal-current", title: browse.path }, browse.path || "…"),
              h("button", { className: "vm-btn", onClick: closeBrowser }, t("browseCancel")),
              h("button", { className: "vm-btn vm-btn-primary", onClick: chooseBrowse, disabled: !browse.path || browse.loading }, t("browseSelect"))
            )
          )
        ) : null,

        h("footer", { className: "vm-footer" }, t("tip"))
      );
    }

    const CSS = `
      .vm-root {
        --vm-accent: #4f8cff;
        --vm-ok: #2fbf71;
        --vm-warn: #f5a623;
        --vm-bad: #ef5350;
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        overflow-y: auto;
        padding: 26px 30px 64px;
        font-size: 13px;
        line-height: 1.55;
        color: inherit;
        font-variant-numeric: tabular-nums;
      }
      .vm-root *, .vm-root *::before, .vm-root *::after { box-sizing: border-box; }
      .vm-root h1, .vm-root h2 { margin: 0; font-weight: 650; letter-spacing: -0.01em; }
      .vm-root h1 { font-size: 21px; }
      .vm-root h2 { font-size: 14px; }
      .vm-root p { margin: 0; }
      .vm-root button { font: inherit; color: inherit; }
      .vm-root input, .vm-root select { font: inherit; color: inherit; }
      .vm-hero { display: flex; align-items: flex-start; gap: 16px; max-width: 1180px; margin: 0 auto 18px; }
      .vm-hero-mark { flex: none; width: 46px; height: 46px; border-radius: 13px; display: grid; place-items: center; color: #fff; background: linear-gradient(145deg,#4f8cff,#7a5cff); box-shadow: 0 6px 18px rgba(79,140,255,.3); }
      .vm-hero-text { flex: 1; min-width: 0; padding-top: 1px; }
      .vm-hero-title-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .vm-hero-text p { margin-top: 4px; opacity: .64; font-size: 12.5px; }
      .vm-pill { font-size: 11px; padding: 2px 8px; border-radius: 999px; background: rgba(79,140,255,.14); color: #4f8cff; border: 1px solid rgba(79,140,255,.25); font-weight: 600; }
      .vm-pill-soft { background: rgba(127,127,127,.1); color: inherit; opacity: .72; border-color: rgba(127,127,127,.18); }
      .vm-hero-side { flex: none; padding-top: 4px; }
      .vm-ffmpeg-chip { display: inline-flex; align-items: center; gap: 7px; padding: 5px 10px; border-radius: 999px; border: 1px solid rgba(127,127,127,.22); background: rgba(127,127,127,.07); font-size: 11.5px; opacity: .9; }
      .vm-ffmpeg-chip.is-warn { border-color: rgba(245,166,35,.4); }
      .vm-ok-dot, .vm-warn-dot { width: 7px; height: 7px; border-radius: 50%; flex: none; }
      .vm-ok-dot { background: var(--vm-ok); box-shadow: 0 0 0 3px rgba(47,191,113,.15); }
      .vm-warn-dot { background: var(--vm-warn); }
      .vm-card { max-width: 1180px; margin: 0 auto 16px; border: 1px solid rgba(127,127,127,.2); background: rgba(127,127,127,.055); border-radius: 14px; padding: 16px 18px; }
      .vm-install-card { border-color: rgba(245,166,35,.35); background: rgba(245,166,35,.06); }
      .vm-card-head { display: flex; gap: 14px; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
      .vm-muted { opacity: .6; }
      .vm-small { font-size: 12px; }
      .vm-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11.5px; }
      .vm-ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
      .vm-btn { border: 1px solid rgba(127,127,127,.26); background: rgba(127,127,127,.09); border-radius: 9px; padding: 7px 13px; cursor: pointer; white-space: nowrap; transition: background .12s, border-color .12s, transform .05s; font-size: 12.5px; }
      .vm-btn:hover:not(:disabled) { background: rgba(127,127,127,.16); border-color: rgba(127,127,127,.38); }
      .vm-btn:active:not(:disabled) { transform: translateY(1px); }
      .vm-btn:disabled { opacity: .45; cursor: default; }
      .vm-btn-primary { background: var(--vm-accent); border-color: var(--vm-accent); color: #fff; font-weight: 600; }
      .vm-btn-primary:hover:not(:disabled) { background: #3f7bf0; border-color: #3f7bf0; }
      .vm-btn-danger { color: var(--vm-bad); border-color: rgba(239,83,80,.4); background: rgba(239,83,80,.08); }
      .vm-btn-ghost { border-color: transparent; background: transparent; padding: 2px 8px; font-size: 16px; line-height: 1; opacity: .55; }
      .vm-btn-ghost:hover:not(:disabled) { background: rgba(127,127,127,.14); }
      .vm-btn-lg { padding: 9px 20px; font-size: 13px; border-radius: 10px; }
      .vm-alert { max-width: 1180px; margin: 0 auto 14px; display: flex; align-items: flex-start; gap: 10px; padding: 10px 14px; border-radius: 10px; font-size: 12.5px; border: 1px solid; }
      .vm-alert.is-error { border-color: rgba(239,83,80,.35); background: rgba(239,83,80,.08); color: #ef5350; }
      .vm-alert.is-ok { border-color: rgba(47,191,113,.35); background: rgba(47,191,113,.08); color: #2fbf71; }
      .vm-alert-text { flex: 1; min-width: 0; word-break: break-word; white-space: pre-wrap; }
      .vm-alert .vm-btn-ghost { color: inherit; }
      .vm-ffmpeg-line { max-width: 1180px; margin: 0 auto 12px; display: flex; align-items: center; gap: 7px; font-size: 11.5px; opacity: .8; min-width: 0; }
      .vm-ffmpeg-line .vm-ellipsis { max-width: 42%; }
      .vm-sep { opacity: .35; }
      .vm-link { border: none; background: none; padding: 0; color: var(--vm-accent); cursor: pointer; font-size: 12px; }
      .vm-link:hover { text-decoration: underline; }
      .vm-path-row { display: flex; gap: 8px; align-items: center; }
      .vm-path-field { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; padding: 0 11px; border: 1px solid rgba(127,127,127,.26); border-radius: 9px; background: rgba(127,127,127,.06); height: 36px; }
      .vm-path-field:focus-within { border-color: rgba(79,140,255,.6); box-shadow: 0 0 0 3px rgba(79,140,255,.12); }
      .vm-path-field svg { opacity: .55; flex: none; }
      .vm-input { flex: 1; min-width: 0; border: none; outline: none; background: transparent; height: 100%; padding: 0; }
      .vm-input::placeholder { opacity: .42; }
      .vm-opts-row { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; margin-top: 12px; }
      .vm-output-row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-top: 10px; }
      .vm-output-path { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 280px; }
      .vm-output-path .vm-path-field { flex: 1; height: 34px; }
      .vm-order { display: flex; align-items: center; gap: 6px; font-size: 12px; }
      .vm-select { border: 1px solid rgba(127,127,127,.26); background: rgba(127,127,127,.08); border-radius: 7px; padding: 4px 6px; outline: none; font-size: 12px; }
      .vm-check { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; font-size: 12px; user-select: none; }
      .vm-check.is-disabled { opacity: .4; cursor: default; }
      .vm-check input { position: absolute; opacity: 0; width: 0; height: 0; }
      .vm-check-box { width: 15px; height: 15px; border-radius: 4px; border: 1px solid rgba(127,127,127,.45); display: inline-grid; place-items: center; flex: none; color: #fff; background: transparent; transition: background .1s, border-color .1s; }
      .vm-check input:checked + .vm-check-box { background: var(--vm-accent); border-color: var(--vm-accent); }
      .vm-check-hint { font-size: 11px; opacity: .45; }
      .vm-hint-row { display: flex; gap: 18px; flex-wrap: wrap; margin-top: 10px; }
      .vm-hint { font-size: 11.5px; opacity: .5; }
      .vm-scan-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
      .vm-stats { display: flex; gap: 14px; margin-top: 4px; font-size: 12px; opacity: .8; flex-wrap: wrap; }
      .vm-stat b { font-weight: 650; }
      .vm-scan-actions { display: flex; align-items: center; gap: 4px; font-size: 12px; padding-top: 2px; }
      .vm-selected-count { margin-left: 10px; padding: 3px 9px; border-radius: 999px; background: rgba(79,140,255,.12); color: var(--vm-accent); font-size: 11.5px; font-weight: 600; }
      .vm-table-head { display: grid; grid-template-columns: 34px 1fr 90px 80px; gap: 12px; padding: 12px 6px 6px; font-size: 10.5px; text-transform: uppercase; letter-spacing: .06em; opacity: .42; }
      .vm-folder-list { border-top: 1px solid rgba(127,127,127,.16); }
      .vm-folder-block { border-bottom: 1px solid rgba(127,127,127,.12); }
      .vm-folder-row { display: grid; grid-template-columns: 34px minmax(0,1fr) auto auto auto 24px; gap: 12px; align-items: center; padding: 9px 6px; }
      .vm-folder-row.is-disabled { opacity: .5; }
      .vm-folder-main { border: none; background: none; text-align: left; cursor: pointer; min-width: 0; padding: 0; }
      .vm-folder-name { font-size: 12.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .vm-folder-sub { font-size: 10.5px; opacity: .45; margin-top: 1px; }
      .vm-folder-count, .vm-folder-size { font-size: 11.5px; opacity: .66; white-space: nowrap; }
      .vm-folder-badges { display: flex; gap: 5px; }
      .vm-badge { font-size: 10px; padding: 2px 7px; border-radius: 999px; background: rgba(127,127,127,.12); opacity: .7; white-space: nowrap; }
      .vm-badge.is-soft { background: rgba(245,166,35,.12); color: var(--vm-warn); opacity: .9; }
      .vm-icon-btn { border: none; background: none; cursor: pointer; opacity: .45; padding: 2px; display: grid; place-items: center; }
      .vm-icon-btn:hover { opacity: .9; }
      .vm-file-list { padding: 0 0 8px 40px; }
      .vm-file-row { display: flex; align-items: center; gap: 8px; padding: 3px 0; font-size: 11.5px; opacity: .72; }
      .vm-file-dot { width: 4px; height: 4px; border-radius: 50%; background: currentColor; opacity: .5; flex: none; }
      .vm-file-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .vm-file-size { opacity: .55; font-size: 10.5px; white-space: nowrap; }
      .vm-file-more { font-size: 11px; opacity: .5; padding-left: 12px; }
      .vm-start-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-top: 14px; }
      .vm-start-note { font-size: 11.5px; opacity: .55; }
      .vm-danger-text { color: var(--vm-bad); opacity: .9; }
      .vm-empty-card { max-width: 1180px; margin: 0 auto 16px; border: 1px dashed rgba(127,127,127,.28); border-radius: 14px; padding: 34px 24px; text-align: center; }
      .vm-empty-icon { opacity: .35; margin-bottom: 10px; }
      .vm-empty-card h2 { font-size: 14px; opacity: .75; }
      .vm-steps { display: flex; justify-content: center; gap: 26px; margin-top: 18px; flex-wrap: wrap; }
      .vm-step { display: flex; align-items: center; gap: 8px; font-size: 11.5px; opacity: .55; }
      .vm-step span { width: 19px; height: 19px; border-radius: 50%; border: 1px solid rgba(127,127,127,.35); display: grid; place-items: center; font-size: 10px; }
      .vm-job-head { display: flex; justify-content: space-between; align-items: center; gap: 14px; }
      .vm-job-title { display: flex; align-items: center; gap: 8px; }
      .vm-job-status { font-size: 11.5px; opacity: .6; }
      .vm-job-actions { display: flex; gap: 8px; }
      .vm-overall { margin-top: 12px; }
      .vm-overall-line { display: flex; align-items: center; justify-content: space-between; font-size: 11.5px; opacity: .78; margin-bottom: 6px; gap: 10px; }
      .vm-bar { height: 6px; border-radius: 999px; background: rgba(127,127,127,.18); overflow: hidden; }
      .vm-bar-fill { height: 100%; border-radius: 999px; transition: width .4s ease; }
      .vm-summary-chips { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
      .vm-summary-chip { padding: 3px 9px; border-radius: 999px; background: rgba(127,127,127,.1); font-size: 11px; opacity: .8; }
      .vm-summary-chip.is-ok { background: rgba(47,191,113,.12); color: var(--vm-ok); }
      .vm-summary-chip.is-bad { background: rgba(239,83,80,.1); color: var(--vm-bad); }
      .vm-job-list { margin-top: 10px; border-top: 1px solid rgba(127,127,127,.14); }
      .vm-job-item { padding: 9px 2px; border-bottom: 1px solid rgba(127,127,127,.1); }
      .vm-job-item-head { display: flex; align-items: center; gap: 8px; min-width: 0; }
      .vm-dot { width: 7px; height: 7px; border-radius: 50%; flex: none; }
      .vm-job-item-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12.5px; }
      .vm-job-item-count { font-size: 10.5px; opacity: .45; white-space: nowrap; }
      .vm-job-item-status { font-size: 10.5px; padding: 1px 7px; border-radius: 999px; background: rgba(127,127,127,.1); opacity: .7; white-space: nowrap; }
      .vm-job-item-status.is-done { background: rgba(47,191,113,.12); color: var(--vm-ok); }
      .vm-job-item-status.is-error { background: rgba(239,83,80,.1); color: var(--vm-bad); }
      .vm-job-item-status.is-skipped { background: rgba(245,166,35,.12); color: var(--vm-warn); }
      .vm-job-progress { margin: 7px 0 2px 15px; }
      .vm-job-progress-meta { display: flex; align-items: center; gap: 10px; font-size: 10.5px; opacity: .55; margin-top: 4px; min-width: 0; }
      .vm-job-progress-meta .vm-ellipsis { flex: 1; }
      .vm-job-message { margin: 4px 0 0 15px; font-size: 11px; opacity: .55; word-break: break-word; }
      .vm-job-item.is-error .vm-job-message { color: var(--vm-bad); opacity: .9; }
      .vm-job-output { margin: 4px 0 0 15px; font-size: 10.5px; opacity: .55; word-break: break-all; }
      .vm-job-warning { margin: 4px 0 0 15px; font-size: 10.5px; color: var(--vm-warn); opacity: .8; }
      .vm-job-footer { padding-top: 12px; }
      .vm-footer { max-width: 1180px; margin: 18px auto 0; font-size: 11px; opacity: .4; line-height: 1.6; }
      .vm-install-actions { display: flex; gap: 8px; flex-wrap: wrap; }
      .vm-install-progress { margin-top: 14px; }
      .vm-install-line { display: flex; justify-content: space-between; font-size: 11.5px; opacity: .7; margin-bottom: 6px; gap: 10px; }
      .vm-empty-line { padding: 18px 6px; font-size: 12px; opacity: .5; }
      .vm-modal-backdrop {
        position: fixed; inset: 0; z-index: 9999;
        background: rgba(0,0,0,.42);
        display: flex; align-items: center; justify-content: center;
        padding: 24px;
      }
      .vm-modal {
        width: min(720px, 100%);
        max-height: min(78vh, 700px);
        display: flex; flex-direction: column;
        background: var(--dsw-alias-bg-primary, #fff);
        color: inherit;
        border: 1px solid rgba(127,127,127,.25);
        border-radius: 14px;
        box-shadow: 0 24px 80px rgba(0,0,0,.35);
        overflow: hidden;
      }
      .vm-modal-head {
        display: flex; align-items: center; justify-content: space-between;
        gap: 10px; padding: 13px 18px;
        border-bottom: 1px solid rgba(127,127,127,.16);
      }
      .vm-modal-head h3 { margin: 0; font-size: 14px; font-weight: 600; }
      .vm-modal-path { display: flex; gap: 8px; padding: 12px 18px 6px; }
      .vm-modal-path .vm-input { flex: 1; min-width: 0; }
      .vm-modal-hint { padding: 0 18px 8px; font-size: 11px; opacity: .55; }
      .vm-dir-list {
        flex: 1; overflow-y: auto; min-height: 190px;
        padding: 4px 10px 10px;
        border-top: 1px solid rgba(127,127,127,.10);
        border-bottom: 1px solid rgba(127,127,127,.10);
      }
      .vm-dir {
        display: flex; align-items: center; gap: 9px;
        width: 100%; padding: 9px 10px;
        border: 0; border-radius: 8px;
        background: transparent; color: inherit;
        font: inherit; text-align: left; cursor: pointer;
      }
      .vm-dir:hover { background: rgba(127,127,127,.12); }
      .vm-dir.is-hidden { opacity: .55; }
      .vm-dir-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .vm-modal-foot {
        display: flex; align-items: center; gap: 8px;
        padding: 12px 18px;
      }
      .vm-modal-current {
        flex: 1; min-width: 0;
        font-size: 11px; opacity: .6;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      .is-error-text { color: var(--vm-bad); }
      @media (max-width: 760px) {
        .vm-root { padding: 18px 14px 48px; }
        .vm-hero { flex-wrap: wrap; }
        .vm-hero-side { width: 100%; padding-top: 0; }
        .vm-path-row { flex-wrap: wrap; }
        .vm-modal-path { flex-wrap: wrap; }
        .vm-modal-path .vm-input { flex-basis: 100%; }
        .vm-path-field { flex-basis: 100%; }
        .vm-output-path { flex-basis: 100%; }
        .vm-folder-row { grid-template-columns: 30px minmax(0,1fr) auto 24px; }
        .vm-folder-count, .vm-folder-size { display: none; }
        .vm-table-head { display: none; }
        .vm-start-row { flex-direction: column; align-items: stretch; }
        .vm-start-row .vm-btn { width: 100%; }
      }
      .vm-root::-webkit-scrollbar { width: 10px; }
      .vm-root::-webkit-scrollbar-thumb { background: rgba(127,127,127,.28); border-radius: 5px; border: 3px solid transparent; background-clip: padding-box; }
    `;

    function apply(ctx) {
      const slots = ctx.slots;
      const register = slots.register.bind(slots);
      ctx.effect(() => {
        const el = document.createElement("style");
        el.dataset.plugin = "dsh-video-merger";
        el.textContent = CSS;
        document.head.appendChild(el);
        return () => { el.remove(); };
      }, "dsh-video-merger: styles");

      slots.inject("conversation.view", () => register({
        name: "conversation.view",
        id: "video-merger",
        order: 30,
        label: () => {
          const locale = ctx.get("locale");
          try {
            const lang = String(locale?.getSnapshot?.()?.active || "").toLowerCase().startsWith("en") ? "en" : "zh";
            return DICT[lang].tab;
          } catch {
            return DICT.zh.tab;
          }
        },
        inject: () => ({
          locale: ctx.get("locale"),
          uiWorkspace: ctx.get("uiWorkspace"),
        }),
      }, VideoMergerView));
    }

    exports.apply = apply;
    exports.inject = ["slots", "locale", "uiWorkspace"];
    // Exposed for the Node-side unit test; not part of the client plugin contract.
    exports._normalizeListing = normalizeListing;
    return module.exports;
  },
});
