# Black Notebook Todo - Step-by-Step Walkthrough

Build a todo list app with React + Supabase, styled like an old black notebook.

**Current Status:** Project initialized, Supabase package installed, ready to build.

---

## Step 1: Set Up Supabase Project

### 1.1 Create Supabase Account & Project

1. Go to https://supabase.com
2. Sign up (free tier is fine)
3. Click "New Project"
4. Fill in:
   - **Name:** black-notebook-todo
   - **Database Password:** (save this somewhere!)
   - **Region:** Pick closest to you
5. Wait for project to initialize (~2 minutes)

### 1.2 Create the Todos Table

1. In Supabase dashboard, go to **Table Editor** (left sidebar)
2. Click **"New Table"**
3. Configure:
   - **Name:** `todos`
   - **Enable Row Level Security (RLS):** Leave OFF for now (we'll add later)
4. Add columns (click "Add column" for each):

| Column Name | Type | Default | Other |
|-------------|------|---------|-------|
| id | int8 | (auto) | Primary key (auto-set) |
| created_at | timestamptz | now() | (auto-set) |
| text | text | (none) | NOT NULL |
| completed | bool | false | |

5. Click **"Save"**

### 1.3 Get Your API Keys

1. Go to **Settings** → **API** (left sidebar)
2. Copy these two values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)

---

## Step 2: Connect React to Supabase

### 2.1 Create Environment File

Create a new file: `src/.env.local` (or `.env` in project root)

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**IMPORTANT:** Add `.env.local` to `.gitignore`!

### 2.2 Create Supabase Client

Create a new file: `src/supabaseClient.js`

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
```

---

## Step 3: Build the Todo Component

### 3.1 Replace App.jsx

Replace the contents of `src/App.jsx` with:

```jsx
import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import './App.css'

function App() {
  const [todos, setTodos] = useState([])
  const [newTodo, setNewTodo] = useState('')
  const [loading, setLoading] = useState(true)

  // Fetch todos on mount
  useEffect(() => {
    fetchTodos()
  }, [])

  async function fetchTodos() {
    setLoading(true)
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching todos:', error)
    } else {
      setTodos(data)
    }
    setLoading(false)
  }

  async function addTodo(e) {
    e.preventDefault()
    if (!newTodo.trim()) return

    const { data, error } = await supabase
      .from('todos')
      .insert([{ text: newTodo, completed: false }])
      .select()

    if (error) {
      console.error('Error adding todo:', error)
    } else {
      setTodos([data[0], ...todos])
      setNewTodo('')
    }
  }

  async function toggleTodo(id, completed) {
    const { error } = await supabase
      .from('todos')
      .update({ completed: !completed })
      .eq('id', id)

    if (error) {
      console.error('Error updating todo:', error)
    } else {
      setTodos(todos.map(todo =>
        todo.id === id ? { ...todo, completed: !completed } : todo
      ))
    }
  }

  async function deleteTodo(id) {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting todo:', error)
    } else {
      setTodos(todos.filter(todo => todo.id !== id))
    }
  }

  return (
    <div className="notebook">
      <h1 className="notebook-title">My Notes</h1>

      <form onSubmit={addTodo} className="todo-form">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Write something..."
          className="todo-input"
        />
        <button type="submit" className="add-btn">+</button>
      </form>

      {loading ? (
        <p className="loading">Loading...</p>
      ) : (
        <ul className="todo-list">
          {todos.map(todo => (
            <li key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
              <span
                onClick={() => toggleTodo(todo.id, todo.completed)}
                className="todo-text"
              >
                {todo.text}
              </span>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="delete-btn"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {todos.length === 0 && !loading && (
        <p className="empty-message">No notes yet. Start writing!</p>
      )}
    </div>
  )
}

export default App
```

---

## Step 4: Style Like a Black Notebook

### 4.1 Replace App.css

Replace `src/App.css` with:

```css
/* The Notebook */
.notebook {
  background-color: #1a1a1a;
  border: 2px solid #333;
  border-radius: 4px;
  width: 100%;
  max-width: 500px;
  min-height: 600px;
  padding: 40px 30px;
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.5),
    inset 0 0 50px rgba(0, 0, 0, 0.3);
  position: relative;
}

/* Red margin line */
.notebook::before {
  content: '';
  position: absolute;
  left: 50px;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: #8b0000;
  opacity: 0.5;
}

/* Notebook title */
.notebook-title {
  font-family: 'Courier New', monospace;
  color: #ddd;
  font-size: 1.5rem;
  margin-bottom: 30px;
  text-align: center;
  font-weight: normal;
  letter-spacing: 2px;
}

/* Input form */
.todo-form {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  padding-left: 40px;
}

.todo-input {
  flex: 1;
  background: transparent;
  border: none;
  border-bottom: 1px solid #444;
  color: #ccc;
  font-family: 'Courier New', monospace;
  font-size: 1rem;
  padding: 10px 0;
  outline: none;
}

.todo-input::placeholder {
  color: #666;
  font-style: italic;
}

.todo-input:focus {
  border-bottom-color: #888;
}

.add-btn {
  background: #333;
  border: 1px solid #555;
  color: #aaa;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.add-btn:hover {
  background: #444;
  color: #fff;
}

/* Todo list */
.todo-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

/* Individual todo items - lined paper effect */
.todo-item {
  display: flex;
  align-items: center;
  padding: 15px 10px 15px 40px;
  border-bottom: 1px solid #333;
  background: repeating-linear-gradient(
    transparent,
    transparent 29px,
    #333 29px,
    #333 30px
  );
}

.todo-text {
  flex: 1;
  color: #ccc;
  font-family: 'Courier New', monospace;
  cursor: pointer;
  transition: all 0.2s;
}

.todo-item:hover .todo-text {
  color: #fff;
}

/* Completed todo */
.todo-item.completed .todo-text {
  text-decoration: line-through;
  color: #666;
}

/* Delete button */
.delete-btn {
  background: transparent;
  border: none;
  color: #666;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0 10px;
  transition: color 0.2s;
}

.delete-btn:hover {
  color: #ff4444;
}

/* Loading and empty states */
.loading,
.empty-message {
  color: #666;
  text-align: center;
  font-family: 'Courier New', monospace;
  font-style: italic;
  padding: 40px;
}
```

### 4.2 Update index.css

Replace `src/index.css` with:

```css
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background-color: #0d0d0d;
  min-height: 100vh;
}

#root {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
```

---

## Step 5: Test It!

### 5.1 Start the Dev Server

```bash
cd black-notebook-todo
npm run dev
```

### 5.2 Open in Browser

Go to http://localhost:5173

### 5.3 Test Features

1. **Add a todo:** Type something and press Enter or click +
2. **Complete a todo:** Click the text to toggle strikethrough
3. **Delete a todo:** Click the × button
4. **Refresh page:** Your todos should persist (they're in Supabase!)

---

## Step 6: Verify Data in Supabase

1. Go to your Supabase dashboard
2. Click **Table Editor** → **todos**
3. You should see your todos in the database!

---

## Troubleshooting

### "Failed to fetch" or network errors
- Check your `.env.local` file has correct URL and key
- Make sure you restarted the dev server after adding env vars
- Check Supabase dashboard → Settings → API for correct values

### Todos not saving
- Check browser console (F12) for errors
- Verify the `todos` table exists in Supabase
- Make sure column names match exactly: `id`, `text`, `completed`, `created_at`

### Styling looks wrong
- Make sure you replaced both `App.css` and `index.css`
- Try hard refresh: Ctrl+Shift+R

---

## What You Learned

1. **Supabase setup** - Creating projects, tables, getting API keys
2. **React + Supabase** - Using the client library for CRUD operations
3. **useState & useEffect** - React hooks for state and side effects
4. **Async/await** - Modern JavaScript for database operations
5. **CSS styling** - Creating a realistic notebook effect

---

## Next Steps (Optional)

- [ ] Add user authentication (Supabase Auth)
- [ ] Add due dates to todos
- [ ] Add categories/tags
- [ ] Deploy to Vercel or Netlify
- [ ] Add Row Level Security (RLS) for multi-user support

---

**Last Updated:** January 15, 2026
