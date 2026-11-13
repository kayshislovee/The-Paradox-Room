import { useGameStore } from '../../store/gameStore';
import type { Level } from '../../types/game.types';
import { KeypadPuzzle } from './KeypadPuzzle';
import { KeypadPuzzle as LibraryKeypadPuzzle } from './keypadperpus';
import { KeypadPuzzle as CorridorKeypadPuzzle } from './keypadkoridor';
import { SequencePuzzle } from './SequencePuzzle';
import { PatternPuzzle } from './PatternPuzzle';
import { LeverPuzzle } from './LeverPuzzle';
import { ColorPatternPuzzle } from './ColorPatternPuzzle';
import { ArrowInputPuzzle } from './ArrowInputPuzzle';
import { ChemicalBottlePuzzle as ChemicalSortPuzzle } from './ChemicalBottlePuzzle';
import { usePuzzleSync } from '../../hooks/Usepuzzlesync.ts';
import { multiplayer } from '../../lib/multiplayer';
import styles from './PuzzleModal.module.css';
import { DualPuzzle } from './DualPuzzle';
import { ComputerPuzzle } from './ComputerPuzzle';
import { ComputerPuzzle as SafePuzzle } from './SafePuzzle';


interface Props {
  puzzleId: string;
  level: Level;
}

export function PuzzleModal({ puzzleId, level }: Props) {
  const { closePuzzle, solvePuzzle, isPuzzleSolved, addToInventory, showNotification, triggerSceneDialog } =
    useGameStore();

  // Ambil lobby state dari store
  const lobbyCode = useGameStore((s) => s.lobbyCode);
  const token = useGameStore((s) => s.token);

  const puzzle = level.puzzles.find((p) => p.id === puzzleId);
  if (!puzzle) return null;

  const alreadySolved = isPuzzleSolved(puzzleId);
  const isLibraryKeypad = puzzle.id === 'puzzle_library_door';

  const handleSolve = () => {
    useGameStore.getState().setPuzzleInputState(puzzleId, null);
    useGameStore.getState().setPuzzleInputState('puzzle_dual_lock', null);

    solvePuzzle(puzzleId);
    if (puzzle.reward) {
      const item = level.items.find((i) => i.id === puzzle.reward);
      if (item) addToInventory(item);
    }

    // Khusus puzzle_chest_s4: langsung buka chest setelah solved
    if (puzzleId === 'puzzle_chest_s4') {
      showNotification('🔓 Kunci terbuka! Membuka chest...', 'success');
      setTimeout(() => {
        closePuzzle();
        useGameStore.getState().setChestOpen('chest_scene4');
        triggerSceneDialog('scene7_4_chest');
      }, 800);
    } else {
      showNotification('Sistem teraktifkan! Pintu terbuka!', 'success');
      setTimeout(() => closePuzzle(), 1500);
    }
  };

  // ── Real-time shared input dari player lain ───────────────────────────────
  const { sharedInput, sharedBy } = usePuzzleSync(puzzleId);

  // ── Sync input ke lobby via Reverb ────────────────────────────────────────
  const syncInput = async (input: any) => {
    if (!lobbyCode || !token) return;
    multiplayer.syncPuzzleInput(puzzleId, input);
  };

  const isLevel6Puzzle = ['puzzle_color_pattern', 'puzzle_arrow_input', 'puzzle_chemical_bottles'].includes(puzzleId);

  if (puzzle.id === 'puzzle_chest_s4' && !alreadySolved) {
    return (
      <SafePuzzle
        puzzle={puzzle}
        onSolve={handleSolve}
        onClose={closePuzzle}
        onInputChange={lobbyCode ? syncInput : undefined}
        sharedInput={lobbyCode ? sharedInput : undefined}
        sharedBy={sharedBy ?? undefined}
      />
    );
  }

  if (isLevel6Puzzle && !alreadySolved) {
    return (
      <>
        {puzzle.id === 'puzzle_color_pattern' && (
          <ColorPatternPuzzle
            onSolve={handleSolve}
            onClose={closePuzzle}
            onInputChange={lobbyCode ? syncInput : undefined}
            sharedInput={lobbyCode ? sharedInput : undefined}
            sharedBy={sharedBy ?? undefined}
          />
        )}
        {puzzle.id === 'puzzle_arrow_input' && (
          <ArrowInputPuzzle
            onSolve={handleSolve}
            onClose={closePuzzle}
            onInputChange={lobbyCode ? syncInput : undefined}
            sharedInput={lobbyCode ? sharedInput : undefined}
            sharedBy={sharedBy ?? undefined}
          />
        )}
        {puzzle.id === 'puzzle_chemical_bottles' && (
          <ChemicalSortPuzzle
            onSolve={handleSolve}
            onClose={closePuzzle}
          />
        )}
      </>
    );
  }
 if (puzzle.type === ('dual' as any)) {
  return (
    <DualPuzzle
      onSolve={handleSolve}
      onClose={closePuzzle}
      symbolAnswer={(puzzle as any).symbolAnswer}
    />
  );
}
  const isComputerPuzzle = puzzle.type === 'computer' ||
    puzzle.id === 'puzzle_store_computer' ||
    puzzle.id === 'puzzle_toystore_door';

  if (isComputerPuzzle && !alreadySolved) {
    return (
      <ComputerPuzzle
        puzzle={puzzle}
        onSolve={handleSolve}
        onClose={closePuzzle}
        onInputChange={lobbyCode ? syncInput : undefined}
        sharedInput={lobbyCode ? sharedInput : undefined}
        sharedBy={sharedBy ?? undefined}
      />
    );
  }
  const isLeverPuzzle = puzzle.id === 'puzzle_lever_pattern' || puzzle.patternSize === 8;

  return (
    <div className={styles.overlay} onClick={closePuzzle}>
      <div
        className={`${styles.box} ${isLibraryKeypad ? styles.libraryKeypadBox : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {isLibraryKeypad ? (
          <button
            className={styles.libraryKeypadCloseBtn}
            onClick={closePuzzle}
            aria-label="Tutup keypad"
          >
            ✕
          </button>
        ) : (
          <div className={styles.header}>
            <h3 className={styles.title}>{puzzle.title}</h3>
            <button className={styles.closeBtn} onClick={closePuzzle}>✕</button>
          </div>
        )}

        <div className={styles.content}>
          {alreadySolved ? (
            <div className={styles.solved}>✓ SISTEM SUDAH AKTIF</div>
          ) : (
            <>
            
              {isLeverPuzzle && (
                <LeverPuzzle
                  puzzle={puzzle}
                  onSolve={handleSolve}
                  onInputChange={lobbyCode ? syncInput : undefined}
                  sharedInput={lobbyCode ? sharedInput : undefined}
                  sharedBy={sharedBy ?? undefined}
                />
              )}
              {!isLeverPuzzle && puzzle.id === 'puzzle_library_door' && (
                <LibraryKeypadPuzzle
                  puzzle={puzzle}
                  onSolve={handleSolve}
                  onInputChange={lobbyCode ? syncInput : undefined}
                  sharedInput={lobbyCode ? sharedInput : undefined}
                  sharedBy={sharedBy ?? undefined}
                />
              )}
              {!isLeverPuzzle && puzzle.id === 'puzzle_scene2' && (
                <CorridorKeypadPuzzle
                  puzzle={puzzle}
                  onSolve={handleSolve}
                  onInputChange={lobbyCode ? syncInput : undefined}
                  sharedInput={lobbyCode ? sharedInput : undefined}
                  sharedBy={sharedBy ?? undefined}
                />
              )}
              {!isLeverPuzzle && puzzle.type === 'keypad' && puzzle.id !== 'puzzle_library_door' && puzzle.id !== 'puzzle_scene2' && (
                <KeypadPuzzle
                  puzzle={puzzle}
                  onSolve={handleSolve}
                  onInputChange={lobbyCode ? syncInput : undefined}
                  sharedInput={lobbyCode ? sharedInput : undefined}
                  sharedBy={sharedBy ?? undefined}
                />
              )}
              {!isLeverPuzzle && puzzle.type === 'sequence' && (
                <SequencePuzzle
                  puzzle={puzzle}
                  onSolve={handleSolve}
                  onInputChange={lobbyCode ? syncInput : undefined}
                  sharedInput={lobbyCode ? sharedInput : undefined}
                  sharedBy={sharedBy ?? undefined}
                />
              )}
              {!isLeverPuzzle && puzzle.type === 'pattern' && (
                <PatternPuzzle
                  puzzle={puzzle}
                  onSolve={handleSolve}
                  onInputChange={lobbyCode ? syncInput : undefined}
                  sharedInput={lobbyCode ? sharedInput : undefined}
                  sharedBy={sharedBy ?? undefined}
                />
              )}
            </>
          )}
        </div>

        {/* Clue hints */}
        {!isLibraryKeypad && puzzle.clueIds.length > 0 && (
          <div className={styles.clueHints}>
            <span className={styles.clueLabel}>Clue terkait:</span>
            {puzzle.clueIds.map((cid) => {
              const clue = level.clues.find((c) => c.id === cid);
              return clue ? (
                <span key={cid} className={styles.clueTag}>{clue.hint}</span>
              ) : null;
            })}
          </div>
        )}
      </div>
    </div>
  );
}