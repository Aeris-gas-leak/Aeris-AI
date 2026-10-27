// recorder.js — aggregates session utilities and the live simulator so that
// any page importing from either can use this single file.

// Session utilities (pure, no simulator dependency)
export {
  ensureRoomSeries,
  newSession,
  timeAt,
  durationSeconds,
  createLevelTracker,
  latestReading,
  chartPoints,
  csvTimestamp,
  sessionCsv,
  downloadCsv,
  loadSessions,
  saveSession,
  deleteSession,
  findSession,
} from './session_utils.js'

// Live simulator controls — pages that import { start, stop, useRecorder,
// SPEEDS, setSpeed, showLive } from 'recorder.js' get them here.
export { SPEEDS, setSpeed, showLive, start, stop, useRecorder, addRoom } from './simulator.js'
