import React, { useState, useEffect } from "react";
import "./App.css";

// THEME COLORS: #1976d2 (primary), #424242 (secondary), #ffea00 (accent)
/**
 * PUBLIC_INTERFACE
 * Main Notes App component.
 * - Sidebar: Search, notes list, create note.
 * - Main area: view/edit note.
 * - Modern, minimalistic, light theme with color palette.
 */

// ENV config for API endpoint
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

// API helper functions (CRUD operations)
async function fetchNotes(search = "") {
  const url = search ? `${API_BASE_URL}/notes?search=${encodeURIComponent(search)}` : `${API_BASE_URL}/notes`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error("Error fetching notes.");
  return resp.json();
}

// PUBLIC_INTERFACE
async function fetchNote(id) {
  const resp = await fetch(`${API_BASE_URL}/notes/${id}`);
  if (!resp.ok) throw new Error("Error fetching note.");
  return resp.json();
}

// PUBLIC_INTERFACE
async function createNote(title, content) {
  const resp = await fetch(`${API_BASE_URL}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content }),
  });
  if (!resp.ok) throw new Error("Error creating note.");
  return resp.json();
}

// PUBLIC_INTERFACE
async function updateNote(id, title, content) {
  const resp = await fetch(`${API_BASE_URL}/notes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content }),
  });
  if (!resp.ok) throw new Error("Error updating note.");
  return resp.json();
}

// PUBLIC_INTERFACE
async function deleteNote(id) {
  const resp = await fetch(`${API_BASE_URL}/notes/${id}`, {
    method: "DELETE",
  });
  if (!resp.ok) throw new Error("Error deleting note.");
  return true;
}

function Sidebar({
  notes,
  selectedId,
  onSelect,
  onSearch,
  onCreate,
  searchVal,
  loading,
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Notes</h2>
        <button className="accent-btn" onClick={onCreate} title="New note">
          +
        </button>
      </div>
      <input
        className="sidebar-search"
        placeholder="Search notes..."
        value={searchVal}
        onChange={e => onSearch(e.target.value)}
        disabled={loading}
      />
      <nav className="notes-list">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : notes.length === 0 ? (
          <div className="empty-list">No notes found.</div>
        ) : (
          notes.map(note => (
            <div
              className={
                "note-list-item" + (note.id === selectedId ? " selected" : "")
              }
              key={note.id}
              onClick={() => onSelect(note.id)}
              tabIndex={0}
            >
              <strong>{note.title || "Untitled"}</strong>
              <span className="note-snippet">
                {note.content && note.content.length > 40
                  ? note.content.slice(0, 40) + "..."
                  : note.content}
              </span>
            </div>
          ))
        )}
      </nav>
    </aside>
  );
}

function NoteEditor({
  note,
  onSave,
  onDelete,
  onCancel,
  editing,
  setEditing,
  loading,
}) {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(note?.title || "");
    setContent(note?.content || "");
    setSaving(false);
  }, [note]);

  if (!note && !editing) {
    return (
      <div className="main-area-empty">
        <span>Select or create a note to begin.</span>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    await onSave({ ...note, title, content });
    setSaving(false);
  };

  return (
    <section className="main-area">
      {editing ? (
        <div className="note-edit-form">
          <input
            className="note-title-input"
            placeholder="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            disabled={saving}
            autoFocus
          />
          <textarea
            className="note-content-input"
            placeholder="Your note here..."
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={12}
            disabled={saving}
          />
          <div className="edit-actions">
            <button onClick={handleSave} className="primary-btn" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
            {note?.id && (
              <button
                onClick={() => onDelete(note.id)}
                className="danger-btn"
                disabled={saving}
              >
                Delete
              </button>
            )}
            <button
              onClick={() => {
                setEditing(false);
                setTitle(note?.title || "");
                setContent(note?.content || "");
              }}
              className="secondary-btn"
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="note-view">
          <div className="note-view-header">
            <h3>{note.title || "Untitled"}</h3>
            <button
              className="primary-btn"
              onClick={() => setEditing(true)}
              disabled={loading}
            >
              Edit
            </button>
          </div>
          <article className="note-view-content">{note.content}</article>
        </div>
      )}
    </section>
  );
}

/**
 * PUBLIC_INTERFACE
 * Main App
 */
function App() {
  const [theme] = useState("light"); // theme support stub, light only
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Fetch notes list, optionally with search
  const reloadNotes = async searchVal => {
    try {
      setLoading(true);
      setErrorMsg("");
      const ns = await fetchNotes(searchVal);
      setNotes(ns);
    } catch (e) {
      setErrorMsg((e && e.message) || "Could not load notes.");
    } finally {
      setLoading(false);
    }
  };

  // On mount and search
  useEffect(() => {
    reloadNotes(search);
    // eslint-disable-next-line
  }, [search]);

  // When selectedId changes, fetch full note
  useEffect(() => {
    if (selectedId) {
      setLoading(true);
      setErrorMsg("");
      fetchNote(selectedId)
        .then(n => {
          setSelectedNote(n);
          setEditing(false);
        })
        .catch(() => setErrorMsg("Could not load note."))
        .finally(() => setLoading(false));
    } else {
      setSelectedNote(null);
      setEditing(false);
    }
  }, [selectedId]);

  // Handlers
  const handleNoteSelect = id => {
    setSelectedId(id);
    setEditing(false);
  };

  const handleSearch = val => {
    setSearch(val);
  };

  const handleCreate = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const newNote = await createNote("Untitled", "");
      setSelectedId(newNote.id);
      reloadNotes(search);
    } catch (e) {
      setErrorMsg("Could not create note.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async updatedNote => {
    setLoading(true);
    setErrorMsg("");
    try {
      if (!updatedNote.id) {
        // New note
        const created = await createNote(updatedNote.title, updatedNote.content);
        setSelectedId(created.id);
      } else {
        await updateNote(updatedNote.id, updatedNote.title, updatedNote.content);
        setSelectedId(updatedNote.id);
      }
      reloadNotes(search);
      setEditing(false);
    } catch (e) {
      setErrorMsg("Could not save note.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm("Delete this note?")) return;
    setLoading(true);
    setErrorMsg("");
    try {
      await deleteNote(id);
      setSelectedId(null);
      reloadNotes(search);
    } catch (e) {
      setErrorMsg("Could not delete note.");
    } finally {
      setLoading(false);
    }
  };

  // Apply light theme styles (overrides)
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
  }, []);

  return (
    <div className="notes-app-root">
      <Sidebar
        notes={notes}
        selectedId={selectedId}
        onSelect={handleNoteSelect}
        onSearch={handleSearch}
        onCreate={handleCreate}
        searchVal={search}
        loading={loading}
      />
      <main className="main-container">
        <header className="main-header">
          <span className="brand">NotesApp</span>
          <span className="api-base-url" title="API endpoint">
            {API_BASE_URL}
          </span>
        </header>
        {errorMsg && <div className="error-msg">{errorMsg}</div>}
        <NoteEditor
          note={selectedNote}
          onSave={handleSave}
          onDelete={handleDelete}
          onCancel={() => setEditing(false)}
          editing={editing}
          setEditing={setEditing}
          loading={loading}
        />
      </main>
    </div>
  );
}

export default App;
