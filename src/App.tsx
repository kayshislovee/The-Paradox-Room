import { useState, useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { Splash } from './components/Splash/Splash';
import { LevelSelect } from './components/LevelSelect/LevelSelect';
import { GameScene } from './components/GameScene/GameScene';
import { WinScreen } from './components/WinScreen/WinScreen';
import { Settings } from './components/Settings/Settings';
import { LoadingScreen } from './components/LoadingScreen/LoadingScreen';
import { LEVELS } from './data/levels';
import { DialogScreen } from './components/Dialog/DialogScreen';
import { AuthScreen } from './components/Auth/AuthScreen';
import { ProfileIcon } from './components/Profile/ProfileIcon';
import { AchievementScreen } from './components/Achievement/AchievementScreen';
import { TreasureScreen } from './components/Treasure/TreasureScreen';
import { TreasureShowcase } from './components/Treasure/TreasureShowcase';
import { setUnauthorizedHandler } from './hooks/useapi';
import { ComicScene } from './components/Comic/ComicScene';
import type { ComicPage, Level } from './types/game.types';
import { LoseScreen } from './components/WinScreen/LoseScreen';
import { useVoiceChat } from './hooks/useVoiceChat';
import { useLobby } from './hooks/useLobby';
import { LobbyScreen } from './components/Lobby/LobbyScreen';
import { BrainMazePuzzle } from './components/PuzzleModal/BrainMazePuzzle';
import { ExitLockScreen } from './components/PuzzleModal/ExitLockScreen';
import { ComputerPuzzle } from './components/PuzzleModal/ComputerPuzzle';
import { ComputerPuzzle as SafePuzzleComponent } from './components/PuzzleModal/SafePuzzle';
import { ChemicalBottlePuzzle as ChemicalSortPuzzle } from './components/PuzzleModal/ChemicalBottlePuzzle';
import { DualPuzzle } from './components/PuzzleModal/DualPuzzle';
import { Level7FinalComic } from './components/Level7/Level7FinalComic';

// ─── Dev Preview Components ──────────────────────────────────────────────────

function ComputerPuzzlePreview() {
    const [key, setKey] = useState(0);
    const [status, setStatus] = useState<string>('Ready');

    const samplePuzzle = {
        id: 'computer-dev-preview',
        title: 'SECURITY TERMINAL',
        type: 'computer' as const,
        answer: '1234',
        maxDigits: 4,
        clueIds: [],
    };

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#090d16' }}>
            <div style={{
                position: 'fixed', top: 12, left: 12, zIndex: 100000,
                background: 'rgba(15, 23, 42, 0.95)', color: '#38bdf8', padding: '10px 16px',
                borderRadius: 8, fontSize: 13, fontFamily: 'monospace', border: '1px solid rgba(56, 189, 248, 0.4)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', gap: 12
            }}>
                <span>🖥️ DEV PREVIEW: <b>ComputerPuzzle.tsx</b></span>
                <span style={{ color: '#94a3b8' }}>Status: <b style={{ color: status === 'Solved!' ? '#34d399' : '#fbbf24' }}>{status}</b></span>
                <button
                    onClick={() => { setStatus('Ready'); setKey(k => k + 1); }}
                    style={{
                        background: '#0284c7', color: '#fff', border: 'none',
                        borderRadius: 4, padding: '4px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 'bold'
                    }}
                >
                    🔄 Restart Puzzle
                </button>
                <button
                    onClick={() => { window.location.href = window.location.pathname; }}
                    style={{
                        background: '#ef4444', color: '#fff', border: 'none',
                        borderRadius: 4, padding: '4px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 'bold'
                    }}
                >
                    Exit Dev Mode
                </button>
            </div>
            <ComputerPuzzle
                key={key}
                puzzle={samplePuzzle}
                onSolve={() => setStatus('Solved!')}
                onClose={() => { window.location.href = window.location.pathname; }}
            />
        </div>
    );
}

function ScenePreview({ previewId }: { previewId: string }) {
    // previewId format:
    //   scene atau scene:char (mis. scene7_1, scene7_1:char1)
    //   level:scene (mis. level_6:scene_garden_1)
    //   level:scene:char (mis. level_7:scene7_1:char1)
    const [levelId, sceneId, char] = previewId.split(':');
    const level = LEVELS.find((l) => l.id === levelId);
    const scene = sceneId
        ? level?.scenes.find((s) => s.id === sceneId)
        : level?.scenes[0];

    useEffect(() => {
        if (levelId && sceneId) {
            useGameStore.getState().setGuest();
            useGameStore.getState().startLevel(levelId);
            useGameStore.getState().goToScene(sceneId);
            if (char) useGameStore.getState().setPlayerCharacter(char);
        }
    }, []);

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#000' }}>
            <div style={{
                position: 'absolute', top: 10, left: 10, zIndex: 99999,
                background: 'rgba(0,0,0,0.85)', color: '#fbbf24', padding: '8px 14px',
                borderRadius: 8, fontSize: 12, fontFamily: 'monospace',
                border: '1px solid rgba(251,191,36,0.4)',
            }}>
                🛠️ PREVIEW: {level?.title ?? levelId} / {scene?.label ?? sceneId}
                {char && <span style={{ color: '#34d399' }}> [{char}]</span>}
            </div>
            {scene && level && (
                <div style={{ display: 'flex', height: '100%' }}>
                    <GameScene voiceChat={{ isActive: false, startVoice: () => {}, stopVoice: () => {}, toggleMute: () => {}, isMuted: false, isSpeaking: false } as any} />
                </div>
            )}
            {!scene && (
                <div style={{ padding: 40, color: '#fbbf24', fontFamily: 'monospace' }}>
                    Scene tidak ditemukan. Cek id level &amp; scene.<br /><br />
                    Contoh: ?preview=level_7:scene7_2<br />
                    ?preview=level_7:scene7_2:char2<br />
                    ?preview=scene7_2
                </div>
            )}
        </div>
    );
}

function SafePuzzlePreview() {
    const [key, setKey] = useState(0);
    const [status, setStatus] = useState('Ready');

    const samplePuzzle = {
        id: 'safe-dev-preview',
        title: 'SAFE LOCKER',
        type: 'computer' as const,
        answer: '1234',
        maxDigits: 4,
        clueIds: [],
    };

    const exitPreview = () => {
        window.location.href = window.location.pathname;
    };

    const restartPuzzle = () => {
        useGameStore.getState().setPuzzleInputState(samplePuzzle.id, null);
        setStatus('Ready');
        setKey(value => value + 1);
    };

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#090d16' }}>
            <div style={{
                position: 'fixed', top: 12, left: 12, zIndex: 100000,
                background: 'rgba(15, 23, 42, 0.95)', color: '#38bdf8', padding: '10px 16px',
                borderRadius: 8, fontSize: 13, fontFamily: 'monospace', border: '1px solid rgba(56, 189, 248, 0.4)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', gap: 12
            }}>
                <span>🔐 DEV PREVIEW: <b>SafePuzzle.tsx</b></span>
                <span style={{ color: '#94a3b8' }}>Status: <b style={{ color: status === 'Solved!' ? '#34d399' : '#fbbf24' }}>{status}</b></span>
                <button onClick={restartPuzzle} style={{
                    background: '#0284c7', color: '#fff', border: 'none',
                    borderRadius: 4, padding: '4px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 'bold'
                }}>
                    Restart Puzzle
                </button>
                <button onClick={exitPreview} style={{
                    background: '#ef4444', color: '#fff', border: 'none',
                    borderRadius: 4, padding: '4px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 'bold'
                }}>
                    Exit Preview
                </button>
            </div>
            <SafePuzzleComponent
                key={key}
                puzzle={samplePuzzle}
                onSolve={() => setStatus('Solved!')}
                onClose={exitPreview}
            />
        </div>
    );
}

function BrainMazePreview() {
    const [key, setKey] = useState(0);
    const [status, setStatus] = useState<string>('Solving...');

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#090d16' }}>
            <div style={{
                position: 'fixed', top: 12, left: 12, zIndex: 999999,
                background: 'rgba(15, 23, 42, 0.95)', color: '#38bdf8', padding: '10px 16px',
                borderRadius: 8, fontSize: 13, fontFamily: 'monospace', border: '1px solid rgba(56, 189, 248, 0.4)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', gap: 12
            }}>
                <span>🧩 DEV PREVIEW: <b>BrainMazePuzzle.tsx</b></span>
                <span style={{ color: '#94a3b8' }}>Status: <b style={{ color: status === 'Solved!' ? '#34d399' : '#fbbf24' }}>{status}</b></span>
                <button
                    onClick={() => { setStatus('Solving...'); setKey(k => k + 1); }}
                    style={{
                        background: '#0284c7', color: '#fff', border: 'none',
                        borderRadius: 4, padding: '4px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 'bold'
                    }}
                >
                    🔄 Restart Puzzle
                </button>
                <button
                    onClick={() => { window.location.href = window.location.pathname; }}
                    style={{
                        background: '#ef4444', color: '#fff', border: 'none',
                        borderRadius: 4, padding: '4px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 'bold'
                    }}
                >
                    Exit Dev Mode
                </button>
            </div>
            <BrainMazePuzzle
                key={key}
                onSolve={() => setStatus('Solved!')}
                onClose={() => { window.location.href = window.location.pathname; }}
            />
        </div>
    );
}

function ExitLockPreview() {
    const [key, setKey] = useState(0);
    const [status, setStatus] = useState('Ready');

    const exitPreview = () => {
        window.location.href = window.location.pathname;
    };

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#090d16' }}>
            <div style={{
                position: 'fixed', top: 12, left: 12, zIndex: 100000,
                background: 'rgba(15, 23, 42, 0.95)', color: '#fbbf24', padding: '10px 16px',
                borderRadius: 8, fontSize: 13, fontFamily: 'monospace', border: '1px solid rgba(251, 191, 36, 0.45)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', gap: 12
            }}>
                <span>DEV PREVIEW: <b>ExitLockScreen.tsx</b></span>
                <span style={{ color: '#94a3b8' }}>Status: <b style={{ color: status === 'Solved!' ? '#34d399' : '#fbbf24' }}>{status}</b></span>
                <button onClick={() => { setStatus('Ready'); setKey(value => value + 1); }} style={{
                    background: '#b45309', color: '#fff', border: 'none', borderRadius: 4,
                    padding: '4px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 'bold'
                }}>
                    Restart
                </button>
                <button onClick={exitPreview} style={{
                    background: '#991b1b', color: '#fff', border: 'none', borderRadius: 4,
                    padding: '4px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 'bold'
                }}>
                    Exit Preview
                </button>
            </div>
            <ExitLockScreen
                key={key}
                collectedCount={1}
                totalNodes={1}
                onSolve={() => setStatus('Solved!')}
                onClose={exitPreview}
            />
        </div>
    );
}

function ChemicalBottlePreview() {
    const [key, setKey] = useState(0);
    const [status, setStatus] = useState('Ready');

    const exitPreview = () => {
        window.location.href = window.location.pathname;
    };

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#090d16' }}>
            <div style={{
                position: 'fixed', top: 12, left: 12, zIndex: 100000,
                background: 'rgba(15, 23, 42, 0.95)', color: '#38bdf8', padding: '10px 16px',
                borderRadius: 8, fontSize: 13, fontFamily: 'monospace', border: '1px solid rgba(56, 189, 248, 0.4)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', gap: 12
            }}>
                <span>🧪 DEV PREVIEW: <b>ChemicalBottlePuzzle.tsx</b></span>
                <span style={{ color: '#94a3b8' }}>Status: <b style={{ color: status === 'Solved!' ? '#34d399' : '#fbbf24' }}>{status}</b></span>
                <button onClick={() => { setStatus('Ready'); setKey(value => value + 1); }} style={{
                    background: '#0284c7', color: '#fff', border: 'none', borderRadius: 4,
                    padding: '4px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 'bold'
                }}>
                    Restart Puzzle
                </button>
                <button onClick={exitPreview} style={{
                    background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4,
                    padding: '4px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 'bold'
                }}>
                    Exit Preview
                </button>
            </div>
            <ChemicalSortPuzzle
                key={key}
                onSolve={() => setStatus('Solved!')}
                onClose={exitPreview}
            />
        </div>
    );
}

function DualPuzzlePreview() {
    const [key, setKey] = useState(0);
    const [status, setStatus] = useState('Ready');

    const exitPreview = () => {
        window.location.href = window.location.pathname;
    };

    const restartPuzzle = () => {
        useGameStore.getState().setPuzzleInputState('puzzle_dual_lock', null);
        setStatus('Ready');
        setKey(value => value + 1);
    };

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#090d16' }}>
            <div style={{
                position: 'fixed', top: 12, left: 12, zIndex: 100000,
                background: 'rgba(15, 23, 42, 0.95)', color: '#38bdf8', padding: '10px 16px',
                borderRadius: 8, fontSize: 13, fontFamily: 'monospace', border: '1px solid rgba(56, 189, 248, 0.4)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', gap: 12
            }}>
                <span>🔐 DEV PREVIEW: <b>DualPuzzle.tsx</b></span>
                <span style={{ color: '#94a3b8' }}>Status: <b style={{ color: status === 'Solved!' ? '#34d399' : '#fbbf24' }}>{status}</b></span>
                <button onClick={restartPuzzle} style={{
                    background: '#0284c7', color: '#fff', border: 'none', borderRadius: 4,
                    padding: '4px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 'bold'
                }}>
                    Restart Puzzle
                </button>
                <button onClick={exitPreview} style={{
                    background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4,
                    padding: '4px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 'bold'
                }}>
                    Exit Preview
                </button>
            </div>
            <DualPuzzle
                key={key}
                symbolAnswer={['bintang', 'bulat', 'segitiga']}
                onSolve={() => setStatus('Solved!')}
                onClose={exitPreview}
            />
        </div>
    );
}

function Level7FinalComicPreview() {
    const searchParams = new URLSearchParams(window.location.search);
    const initialSrc = searchParams.get('src') || '/comic/scene5_end.png';
    const [src, setSrc] = useState(initialSrc);
    const [key, setKey] = useState(0);
    const [leverSolved, setLeverSolved] = useState(false);
    const [status, setStatus] = useState('Tuas belum ditarik');

    const exitPreview = () => {
        window.location.href = window.location.pathname;
    };

    const handleLeverPulled = () => {
        setLeverSolved(true);
        setStatus('Berhasil ditarik (Solved)!');
    };

    const restartPreview = (solved = false) => {
        setLeverSolved(solved);
        setStatus(solved ? 'Mode Lever Solved' : 'Tuas direset (belum ditarik)');
        setKey((k) => k + 1);
    };

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#090d16' }}>
            <div style={{
                position: 'fixed', top: 12, left: 12, zIndex: 100000,
                background: 'rgba(15, 23, 42, 0.95)', color: '#38bdf8', padding: '10px 16px',
                borderRadius: 8, fontSize: 13, fontFamily: 'monospace', border: '1px solid rgba(56, 189, 248, 0.4)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap'
            }}>
                <span>🎬 DEV PREVIEW: <b>Level7FinalComic.tsx</b></span>
                <span style={{ color: '#94a3b8' }}>Status: <b style={{ color: leverSolved ? '#34d399' : '#fbbf24' }}>{status}</b></span>
                <button
                    onClick={() => restartPreview(false)}
                    style={{
                        background: '#0284c7', color: '#fff', border: 'none',
                        borderRadius: 4, padding: '4px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 'bold'
                    }}
                >
                    🔄 Reset (Tuas Atas)
                </button>
                <button
                    onClick={() => restartPreview(true)}
                    style={{
                        background: '#0d9488', color: '#fff', border: 'none',
                        borderRadius: 4, padding: '4px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 'bold'
                    }}
                >
                    ⚡ Test Solved State
                </button>
                <label style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Comic:
                    <select
                        value={src}
                        onChange={(e) => { setSrc(e.target.value); setKey(k => k + 1); }}
                        style={{
                            background: '#1e293b', color: '#f8fafc', border: '1px solid #475569',
                            borderRadius: 4, padding: '2px 6px', fontSize: 11
                        }}
                    >
                        <option value="/comic/scene5awalkayshi.png">scene5awalkayshi.png (char1)</option>
                        <option value="/comic/scene5awalvania.png">scene5awalvania.png (char2)</option>
                        <option value="/comic/scene5reactorkayshi.jpg">scene5reactorkayshi.jpg (char1)</option>
                        <option value="/comic/scene5reactorvania.png">scene5reactorvania.png (char2)</option>
                        <option value="/comic/scene5_all_complete_dummy.svg">scene5_all_complete_dummy.svg</option>
                        <option value="/comic/scene42.png">/comic/scene42.png</option>
                        <option value="/comic/scene3akhir.png">/comic/scene3akhir.png</option>
                        <option value="/comic/scene1.png">/comic/scene1.png</option>
                    </select>
                </label>
                <button
                    onClick={exitPreview}
                    style={{
                        background: '#ef4444', color: '#fff', border: 'none',
                        borderRadius: 4, padding: '4px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 'bold'
                    }}
                >
                    Exit Preview
                </button>
            </div>
            <Level7FinalComic
                key={key}
                src={src}
                leverSolved={leverSolved}
                onLeverPulled={handleLeverPulled}
            />
        </div>
    );
}

// ─── Main App ────────────────────────────────────────────────────────────────

export default function App() {
    const screen = useGameStore((s) => s.screen);
    const player = useGameStore((s) => s.player);
    const isGuest = useGameStore((s) => s.isGuest);
    const token = useGameStore((s) => s.token);
    const logout = useGameStore((s) => s.logout);
    const startLevel = useGameStore((s) => s.startLevel);
    const [showComic, setShowComic] = useState(false);
    const [comicPageIndex, setComicPageIndex] = useState(() => {
        const requestedPage = Number(new URLSearchParams(window.location.search).get('page'));
        return Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage - 1 : 0;
    });
    const [, setLevelDataVersion] = useState(0);

    const showProfile = ['splash', 'main_menu'].includes(screen);
    const [showLoading, setShowLoading] = useState(false);
    const [showDialog, setShowDialog] = useState(false);
    const [pendingLevelId, setPendingLevelId] = useState<string | null>(null);
    // Level yang dipakai prolog/comic. Diambil dari API (hasil edit admin),
    // BUKAN dari konstanta LEVELS yang hardcode di dalam kode.
    const [pendingLevel, setPendingLevel] = useState<Level | null>(null);
    const lobbyCode = useGameStore((s) => s.lobbyCode);
    // Showcase treasure yang baru dikumpulkan (semua level).
    const collectedTreasure = useGameStore((s) => s.collectedTreasure);
    const clearCollectedTreasure = useGameStore((s) => s.setCollectedTreasure);
    const lobbyState = useLobby();
    const voiceChat = useVoiceChat(lobbyState.lobby?.lobby_code ?? lobbyCode);

    useEffect(() => {
        const refreshLevelData = () => setLevelDataVersion((version) => version + 1);
        window.addEventListener('level-data-updated', refreshLevelData);
        return () => window.removeEventListener('level-data-updated', refreshLevelData);
    }, []);

    useEffect(() => {
        // Daftarkan handler logout global
        setUnauthorizedHandler(() => {
            logout();
        });
    }, [logout]);

    useEffect(() => {
        // Cek validitas token saat app pertama load
        if (!token) return;

        const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

        fetch(`${API_BASE}/me`, {
            headers: { 'Authorization': `Bearer ${token}` },
        }).then((res) => {
            if (res.status === 401) logout();
        }).catch(() => {
            // Network error, biarkan saja
        });
    }, [token, logout]);

    // Dev mode preview via URL
    // Contoh: ?comic=level_7&scene=scene7_3
    //         ?comic=level_7&scene=scene7_4&page=2  (halaman kedua comicPages)
    //         ?comic=level_7&scene=scene7_5&char=char1  (untuk sceneComics root level)
    //         ?puzzle=brainmaze
    const searchParams = new URLSearchParams(window.location.search);
    const devComicLevelId = searchParams.get('comic');
    const devComicSceneId = searchParams.get('scene');
    const devComicVariant = searchParams.get('variant');
    const devPuzzle = searchParams.get('puzzle');
    const devPreview = searchParams.get('preview');

    if (
        devPuzzle === 'level7finalcomic' ||
        devPuzzle === 'finalcomic' ||
        devPreview === 'level7finalcomic' ||
        devPreview === 'finalcomic' ||
        devComicLevelId === 'level7finalcomic'
    ) {
        return <Level7FinalComicPreview />;
    }

    if (devPreview) {
        return <ScenePreview previewId={devPreview} />;
    }

    if (devPuzzle === 'computer' || devPuzzle === 'computerpuzzle') {
        return <ComputerPuzzlePreview />;
    }

    if (devComicLevelId) {
        const devChar = new URLSearchParams(window.location.search).get('char');
        return <ScenePreview previewId={`${devComicLevelId}:${devComicSceneId ?? ''}${devChar ? ':' + devChar : ''}`} />;
    }

    if (devPuzzle === 'safe' || devPuzzle === 'safepuzzle') {
        return <SafePuzzlePreview />;
    }

    if (devPuzzle === 'exitlock') {
        return <ExitLockPreview />;
    }

    if (devPuzzle === 'chemicalbottlepuzzle' || devPuzzle === 'chemicalbottle') {
        return <ChemicalBottlePreview />;
    }

    if (devPuzzle === 'dualpuzzle' || devPuzzle === 'dual') {
        return <DualPuzzlePreview />;
    }

    if (devPuzzle === 'brainmaze' || devPuzzle === 'maze') {
        return <BrainMazePreview />;
    }

    if (devComicLevelId) {
        const devLevel = LEVELS.find((l) => l.id === devComicLevelId);
        const devChar = searchParams.get('char'); // char1 / char2 / dll
        const topComicPages = (devLevel as any)?.comicPages as ComicPage[] | undefined;

        // ── Prioritas 1: sceneComics di root level (scene7_5, scene7_5_reactor_complete, dll) ──
        if (devComicSceneId) {
            const rootSceneComics = (devLevel as any)?.sceneComics as Record<string, any> | undefined;
            const rootEntry = rootSceneComics?.[devComicSceneId];

            if (rootEntry) {
                // Pilih gambar dan koordinat panel berdasarkan ?char=.
                const characterComic = devChar
                    ? rootEntry.srcByReleasedCharacter?.[devChar]
                    : undefined;
                const resolvedSrc: string = characterComic?.src ?? rootEntry.src ?? '';
                const panels = characterComic?.panels
                    ?? rootEntry.panels
                    ?? [{ x: 0, y: 0, width: 100, height: 100 }];

                if (resolvedSrc) {
                    return (
                        <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
                            <div style={{
                                position: 'absolute', top: 10, left: 10, zIndex: 99999,
                                background: 'rgba(0,0,0,0.85)', color: '#00c8ff', padding: '8px 14px',
                                borderRadius: 8, fontSize: 12, fontFamily: 'monospace', border: '1px solid rgba(0,200,255,0.4)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                            }}>
                                🛠️ DEV COMIC PREVIEW: <b>{devComicLevelId}</b> / <b>{devComicSceneId}</b>
                                {devChar && <span style={{ color: '#34d399' }}>char: {devChar}</span>}
                                <span style={{ color: '#aaa' }}>(Edit level7.ts &amp; save to live update)</span>
                                <button onClick={() => { window.location.href = window.location.pathname; }} style={{
                                    background: '#ef4444', color: '#fff', border: 'none',
                                    borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontSize: 10, fontWeight: 'bold',
                                }}>
                                    Exit Dev Mode
                                </button>
                            </div>
                            <ComicScene
                                src={resolvedSrc}
                                panels={panels}
                                onDone={() => {}}
                                isLastPage={false}
                            />
                        </div>
                    );
                }
            }
        }

        // ── Prioritas 2: sceneComic / comicPages di dalam scenes array ──
        const targetSceneWithComic = devComicSceneId
          ? devLevel?.scenes?.find((s) => s.id === devComicSceneId)
          : devLevel?.scenes?.find((s) => (s as any).sceneComic || ((s as any).comicPages && (s as any).comicPages.length > 0));

              const sceneComicPages = (targetSceneWithComic as any)?.comicPages as ComicPage[] | undefined;
              const sceneComic = (targetSceneWithComic as any)?.sceneComic as ComicPage | undefined;

              const pages: ComicPage[] = devComicVariant === 'sceneComic' && sceneComic
                  ? [sceneComic]
                  : (!devComicSceneId && topComicPages && topComicPages.length > 0)
                      ? topComicPages
                      : sceneComicPages && sceneComicPages.length > 0
                          ? sceneComicPages
                          : sceneComic
                              ? [sceneComic]
                              : [];

        const page = pages[comicPageIndex] ?? pages[0];

        if (page) {
            return (
                <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
                    <div style={{
                        position: 'absolute', top: 10, left: 10, zIndex: 99999,
                        background: 'rgba(0,0,0,0.85)', color: '#00c8ff', padding: '8px 14px',
                        borderRadius: 8, fontSize: 12, fontFamily: 'monospace', border: '1px solid rgba(0,200,255,0.4)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    }}>
                        🛠️ DEV COMIC PREVIEW: <b>{devComicLevelId}</b> ({targetSceneWithComic?.id ?? 'level'})
                        <span style={{ color: '#aaa', marginLeft: 8 }}>(Edit level7.ts &amp; save to live update)</span>
                        <button onClick={() => { window.location.href = window.location.pathname; }} style={{
                            marginLeft: 12, background: '#ef4444', color: '#fff', border: 'none',
                            borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontSize: 10, fontWeight: 'bold',
                        }}>
                            Exit Dev Mode
                        </button>
                    </div>
                    <ComicScene
                        src={page.src}
                        panels={page.panels}
                        onDone={() => setComicPageIndex((i) => (i + 1) % Math.max(1, pages.length))}
                        isLastPage={false}
                    />
                </div>
            );
        }
    }

    if (!player && !isGuest) {
        return <AuthScreen />;
    }

    const handleStartLevel = (levelId: string) => {
        setPendingLevelId(levelId);
        setShowLoading(true);
    };

    const handleLoadingDone = async () => {
        if (!pendingLevelId) {
            setShowLoading(false);
            return;
        }

        // Ambil detail level dari API dulu supaya prolog & comic memakai
        // data terbaru dari admin (dialog lines, comic, background).
        const level = (await useGameStore.getState().loadLevelPreview(pendingLevelId)) ?? null;
        setPendingLevel(level);

        // Cek comic dulu sebelum dialog
        if ((level as any)?.comicSrc) {
            setShowLoading(false);
            setShowComic(true);
            return;
        }

        if (level?.introDialog && level.introDialog.length > 0) {
            setShowLoading(false);
            setShowDialog(true);
        } else {
            await startLevel(pendingLevelId);
            setShowLoading(false);
            setPendingLevelId(null);
        }
    };

    const handleDialogDone = async () => {
        const levelId = pendingLevelId;
        if (levelId) {
            await startLevel(levelId);
        }
        setShowDialog(false);
        setShowLoading(false);
        setPendingLevelId(null);
    };


    return (
        <>
            {showProfile && <ProfileIcon />}

            {/* Showcase treasure: muncul di semua level, ditutup dengan klik di mana saja */}
            <TreasureShowcase treasure={collectedTreasure} onClose={() => clearCollectedTreasure(null)} />
            {showLoading && pendingLevelId ? (
                <LoadingScreen levelId={pendingLevelId!} onDone={handleLoadingDone} />
            ) : showDialog && pendingLevel?.introDialog ? (
                <DialogScreen
                    lines={pendingLevel.introDialog}
                    background={pendingLevel.scenes[0]?.backgroundImage}
                    music={pendingLevel.dialogMusic}
                    onDone={handleDialogDone}
                />
            ) : null}

            {showComic && pendingLevelId && (() => {
                const level = pendingLevel;
                const comicPages = (level as any)?.comicPages as ComicPage[] | undefined;
                const currentPage = comicPages?.[comicPageIndex];
                if (!currentPage) return null;

                return (
                    <ComicScene
                        src={currentPage.src}
                        panels={currentPage.panels}
                        onDone={async () => {
                            const isLastPage = comicPageIndex >= (comicPages?.length ?? 1) - 1;
                            if (!isLastPage) {
                                setComicPageIndex((i) => i + 1);
                                return;
                            }
                            setShowComic(false);
                            setComicPageIndex(0);
                            const lv = pendingLevel;
                            if (lv?.introDialog && lv.introDialog.length > 0) {
                                setShowDialog(true);
                            } else if (pendingLevelId) {
                                await startLevel(pendingLevelId);
                                setPendingLevelId(null);
                            }
                        }}
                        isLastPage={comicPageIndex >= (comicPages?.length ?? 1) - 1}
                    />
                );
            })()}

            {!showLoading && !showDialog && !showComic && (() => {
                switch (screen) {
                    case 'splash':
                    case 'main_menu':
                        return <Splash />;
                    case 'lobby':
                        return (
                            <LobbyScreen
                                onClose={() => useGameStore.getState().goTo('splash')}
                                lobbyState={lobbyState}
                                voiceChat={voiceChat}
                            />
                        );
                    case 'level_select':
                        return <LevelSelect onStartLevel={handleStartLevel} />;
                    case 'gameplay':
                    case 'win':
                    case 'lose':
                        return (
                            <>
                                <div style={{ display: screen === 'gameplay' ? 'block' : 'none' }}>
                                    <GameScene voiceChat={voiceChat} />
                                </div>
                                {screen === 'win' && <WinScreen onStartLevel={handleStartLevel} />}
                                {screen === 'lose' && <LoseScreen onStartLevel={handleStartLevel} />}
                            </>
                        );
                    case 'settings':
                        return <Settings />;
                    case 'achievements':
                        return <AchievementScreen />;
                    case 'treasures':
                        return <TreasureScreen />;
                    default:
                        return <Splash />;
                }
            })()}
        </>
    );
}