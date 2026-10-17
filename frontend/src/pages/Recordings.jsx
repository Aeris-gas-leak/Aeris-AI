import { useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteSession, downloadCsv, durationSeconds, loadSessions } from '../sensors/sessions.js'
import { ROOMS } from '../sensors/rooms.js'
import { formatCount, formatDate, formatDuration } from '../format.js'

export default function Recordings() {
  const [sessions, setSessions] = useState(loadSessions)
  const [confirming, setConfirming] = useState(null)

  function remove(id) {
    deleteSession(id)
    setSessions(loadSessions())
    setConfirming(null)
  }

  return (
    <section className="recordings" aria-labelledby="recordings-heading">
      <h1 id="recordings-heading">Recordings</h1>
      <p className="page-note">Saved in this browser. Download a CSV to keep a recording anywhere else.</p>

      {sessions.length ? (
        <div className="table-scroll">
          <table className="recordings-table">
            <thead>
              <tr>
                <th scope="col">Started</th>
                <th scope="col" className="num">Length</th>
                <th scope="col" className="num">Readings</th>
                <th scope="col" className="num">Threshold events</th>
                <th scope="col"><span className="visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s.id}>
                  <th scope="row"><Link to={`/app/recordings/${s.id}`}>{formatDate(s.startedAt)}</Link></th>
                  <td className="num">{formatDuration(durationSeconds(s))}</td>
                  <td className="num">{formatCount(s.length * ROOMS.length)}</td>
                  <td className="num">{s.events.length}</td>
                  <td className="row-actions">
                    <button type="button" className="text-button" onClick={() => downloadCsv(s)}>Download CSV</button>
                    {confirming === s.id ? (
                      <>
                        <button type="button" className="text-button danger" onClick={() => remove(s.id)}>Delete for good</button>
                        <button type="button" className="text-button" onClick={() => setConfirming(null)}>Keep</button>
                      </>
                    ) : (
                      <button type="button" className="text-button" onClick={() => setConfirming(s.id)}>Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <h2>No recordings yet</h2>
          <p>Recordings appear here when you stop them. <Link to="/app">Open the Recorder</Link> to make one.</p>
        </div>
      )}
    </section>
  )
}
