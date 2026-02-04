# Black Notebook Todo - Step-by-Step Walkthrough

Build a todo list app with React + Supabase, styled like an old black notebook.

**Current Status:** Project initialized with React 19 + Vite 7, Supabase client installed. Start at Step 1 to set up your Supabase backend, then follow each step in order.

---

## Before You Start

Open the project in VS Code (or your preferred editor):

```bash
cd C:\Users\el_se\Projects\black-notebook-todo
code .
```

This will make it easy to create and edit files throughout the walkthrough.

---

## Step 1: Set Up Supabase Project

### 1.1 Create Supabase Account & Project

1. Go to https://supabase.com
2. Sign up (free tier is fine)
3. Click "New Project"
4. Fill in:
   - **Name:** black-notebook-todo
   - **Database Password:** Generate one (you won't need this for the app, but save it in case you want direct database access later)
   - **Region:** Pick closest to you
5. Click **"Create new project"** and wait for it to initialize (~2 minutes)

### 1.2 Create the Todos Table

1. In Supabase dashboard, go to **Table Editor** (left sidebar)
2. Click **"New Table"**
3. Configure:
   - **Name:** `todolist`
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

Open a terminal in VS Code (Terminal → New Terminal, or `` Ctrl+` ``).

### 2.1 Create Environment File

Create the `.env.local` file using one of these methods:

**Option A - VS Code:** Right-click in the file explorer (root level, same as `package.json`) → New File → name it `.env.local`

**Option B - PowerShell:**
```powershell
New-Item .env.local
```

Then open `.env.local` and add these two lines (replace with your actual values from Step 1.3):

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Note:** The `.gitignore` already excludes `*.local` files, so your keys won't be committed to git.

### 2.2 Create Supabase Client

Create the file using one of these methods:

**Option A - VS Code:** Right-click the `src` folder → New File → name it `supabaseClient.js`

**Option B - PowerShell:**
```powershell
New-Item src\supabaseClient.js
```

Then open `src/supabaseClient.js` and paste this code:

```javascript
// Import the createClient function from Supabase's JavaScript library
// This function lets us connect to our Supabase database
import { createClient } from '@supabase/supabase-js'

// Grab our Supabase URL and API key from environment variables
// import.meta.env is how Vite accesses .env files
// The VITE_ prefix is required for Vite to expose these to the browser
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create and export the Supabase client
// This client is what we'll use throughout the app to talk to our database
// We export it so other files (like App.jsx) can import and use it
export const supabase = createClient(supabaseUrl, supabaseKey)
```

---

## Step 3: Build the Todo Component

### 3.1 Replace App.jsx

Open `src/App.jsx` in your editor and replace **all** the contents with:

```jsx
// useState - lets us create variables that trigger re-renders when they change
// useEffect - lets us run code when the component loads or when dependencies change
import { useState, useEffect } from 'react'

// Import our Supabase client so we can talk to the database
import { supabase } from './supabaseClient'

// Import the CSS styles for this component
import './App.css'

function App() {
  // STATE VARIABLES
  // ---------------
  // todos: array that holds all our todo items from the database
  // setTodos: function to update the todos array
  const [todos, setTodos] = useState([])

  // newTodo: stores what the user is currently typing in the input field
  const [newTodo, setNewTodo] = useState('')

  // loading: tracks whether we're waiting for data from the database
  // starts as true because we fetch todos immediately when the app loads
  const [loading, setLoading] = useState(true)

  // FETCH TODOS - Get all todos from Supabase
  // async/await lets us wait for the database response before continuing
  // Defined before useEffect so it's available when useEffect calls it
  async function fetchTodos() {
    // Note: loading already starts as true, so no need to set it here
    // Query the 'todolist' table in Supabase
    // .select('*') means get all columns
    // .order() sorts by created_at with newest first (ascending: false)
    const { data, error } = await supabase
      .from('todolist')
      .select('*')
      .order('created_at', { ascending: false })

    // If something went wrong, log the error
    // Otherwise, put the data into our todos state
    if (error) {
      console.error('Error fetching todos:', error)
    } else {
      setTodos(data)
    }

    setLoading(false)
  }

  // useEffect runs code when the component first loads
  // The empty array [] means "only run this once when the component mounts"
  // This is where we fetch existing todos from the database
  useEffect(() => {
    fetchTodos()
  }, [])

  // ADD TODO - Insert a new todo into the database
  async function addTodo(e) {
    // Prevent the form from refreshing the page (default form behavior)
    e.preventDefault()

    // Don't add empty todos - trim() removes whitespace
    if (!newTodo.trim()) return

    // Insert a new row into the 'todolist' table
    // .select() at the end returns the newly created row so we can use it
    const { data, error } = await supabase
      .from('todolist')
      .insert([{ text: newTodo, completed: false }])
      .select()

    if (error) {
      console.error('Error adding todo:', error)
    } else {
      // Add the new todo to the beginning of our array
      // data[0] is the newly created todo
      // ...todos spreads out the existing todos after it
      setTodos([data[0], ...todos])

      // Clear the input field
      setNewTodo('')
    }
  }

  // TOGGLE TODO - Mark a todo as complete or incomplete
  async function toggleTodo(id, completed) {
    // Update the 'completed' column to the opposite of what it was
    // .eq('id', id) is like a WHERE clause - only update the row with this id
    const { error } = await supabase
      .from('todolist')
      .update({ completed: !completed })
      .eq('id', id)

    if (error) {
      console.error('Error updating todo:', error)
    } else {
      // Update our local state to match the database
      // .map() goes through each todo and returns a new array
      // If the id matches, return a new object with completed flipped
      // If it doesn't match, return the todo unchanged
      setTodos(todos.map(todo =>
        todo.id === id ? { ...todo, completed: !completed } : todo
      ))
    }
  }

  // DELETE TODO - Remove a todo from the database
  async function deleteTodo(id) {
    // Delete the row where id matches
    const { error } = await supabase
      .from('todolist')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting todo:', error)
    } else {
      // Remove the deleted todo from our local state
      // .filter() keeps only the todos whose id doesn't match the deleted one
      setTodos(todos.filter(todo => todo.id !== id))
    }
  }

  // THE JSX - What gets rendered to the screen
  return (
    <div className="notebook">
      <h1 className="notebook-title">My Notes</h1>

      {/* Form for adding new todos */}
      {/* onSubmit calls addTodo when user presses Enter or clicks the button */}
      <form onSubmit={addTodo} className="todo-form">
        <input
          type="text"
          value={newTodo}
          // Update newTodo state every time the user types
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Write something..."
          className="todo-input"
        />
        <button type="submit" className="add-btn">+</button>
      </form>

      {/* Conditional rendering: show loading message OR the todo list */}
      {/* The ? : is a ternary operator - like an inline if/else */}
      {loading ? (
        <p className="loading">Loading...</p>
      ) : (
        <ul className="todo-list">
          {/* .map() loops through each todo and creates a list item for it */}
          {/* key={todo.id} helps React track which items changed */}
          {todos.map(todo => (
            <li key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
              {/* Clicking the text toggles the completed status */}
              <span
                onClick={() => toggleTodo(todo.id, todo.completed)}
                className="todo-text"
              >
                {todo.text}
              </span>
              {/* Delete button */}
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

      {/* Show this message only if there are no todos AND we're not loading */}
      {todos.length === 0 && !loading && (
        <p className="empty-message">No notes yet. Start writing!</p>
      )}
    </div>
  )
}

// Export the component so main.jsx can import and render it
export default App
```

---

## Step 4: Style Like a Black Notebook

### 4.1 Replace App.css

Open `src/App.css` in your editor and replace **all** the contents with:

```css
/* ===========================================
   THE NOTEBOOK CONTAINER
   This is the main wrapper that looks like a physical notebook
   =========================================== */
.notebook {
  background-color: #1a1a1a;          /* Dark gray, almost black - like a black notebook cover */
  border: 2px solid #333;              /* Subtle border to define the edges */
  border-radius: 4px;                  /* Slightly rounded corners */
  width: 100%;                         /* Take full width of parent... */
  max-width: 500px;                    /* ...but never wider than 500px */
  min-height: 600px;                   /* At least this tall to look like a notebook */
  padding: 40px 30px;                  /* Space inside the notebook edges */
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.5),   /* Drop shadow underneath for depth */
    inset 0 0 50px rgba(0, 0, 0, 0.3); /* Inner shadow for that worn look */
  position: relative;                  /* Needed for the ::before pseudo-element */
}

/* ===========================================
   RED MARGIN LINE
   The vertical red line you see in real notebooks
   Using ::before creates an element without adding HTML
   =========================================== */
.notebook::before {
  content: '';                         /* Required for pseudo-elements to show */
  position: absolute;                  /* Position relative to .notebook */
  left: 50px;                          /* 50px from the left edge */
  top: 0;                              /* Start at the top... */
  bottom: 0;                           /* ...and go all the way to the bottom */
  width: 2px;                          /* Thin line */
  background-color: #8b0000;           /* Dark red color */
  opacity: 0.5;                        /* Make it subtle, not harsh */
}

/* ===========================================
   NOTEBOOK TITLE
   "My Notes" at the top
   =========================================== */
.notebook-title {
  font-family: 'Courier New', monospace; /* Typewriter-style font */
  color: #ddd;                           /* Light gray text */
  font-size: 1.5rem;                     /* Decent size but not huge */
  margin-bottom: 30px;                   /* Space below the title */
  text-align: center;                    /* Centered horizontally */
  font-weight: normal;                   /* Not bold - keeps it elegant */
  letter-spacing: 2px;                   /* Spread out the letters a bit */
}

/* ===========================================
   INPUT FORM
   The container for the text input and add button
   =========================================== */
.todo-form {
  display: flex;                       /* Put input and button side by side */
  gap: 10px;                           /* Space between input and button */
  margin-bottom: 30px;                 /* Space below the form */
  padding-left: 40px;                  /* Indent past the red margin line */
}

/* The text input field */
.todo-input {
  flex: 1;                             /* Take up all available space */
  background: transparent;             /* See-through background */
  border: none;                        /* Remove default border */
  border-bottom: 1px solid #444;       /* Only show bottom border (underline) */
  color: #ccc;                         /* Light gray text */
  font-family: 'Courier New', monospace; /* Match the notebook style */
  font-size: 1rem;                     /* Normal text size */
  padding: 10px 0;                     /* Vertical padding only */
  outline: none;                       /* Remove the blue focus outline */
}

/* Placeholder text (before user types anything) */
.todo-input::placeholder {
  color: #666;                         /* Darker gray for placeholder */
  font-style: italic;                  /* Italicized to show it's a hint */
}

/* When the input is focused (clicked into) */
.todo-input:focus {
  border-bottom-color: #888;           /* Brighter underline to show it's active */
}

/* ===========================================
   ADD BUTTON
   The circular + button to add new todos
   =========================================== */
.add-btn {
  background: #333;                    /* Dark background */
  border: 1px solid #555;              /* Subtle border */
  color: #aaa;                         /* Gray plus sign */
  width: 40px;                         /* Fixed width... */
  height: 40px;                        /* ...and height to make it square */
  border-radius: 50%;                  /* 50% makes a square into a circle */
  font-size: 1.5rem;                   /* Big plus sign */
  cursor: pointer;                     /* Show hand cursor on hover */
  transition: all 0.2s;                /* Smooth animation for hover effect */
}

/* Hover state for the add button */
.add-btn:hover {
  background: #444;                    /* Slightly lighter background */
  color: #fff;                         /* White plus sign */
}

/* ===========================================
   TODO LIST
   The <ul> that contains all the todo items
   =========================================== */
.todo-list {
  list-style: none;                    /* Remove default bullet points */
  padding: 0;                          /* Remove default padding */
  margin: 0;                           /* Remove default margin */
}

/* ===========================================
   INDIVIDUAL TODO ITEMS
   Each <li> in the list
   The background creates horizontal lines like notebook paper
   =========================================== */
.todo-item {
  display: flex;                       /* Put text and delete button side by side */
  align-items: center;                 /* Vertically center the contents */
  padding: 15px 10px 15px 40px;        /* Padding: top, right, bottom, left */
  border-bottom: 1px solid #333;       /* Separator line between todos */
  /* Repeating gradient creates the lined paper effect */
  /* It draws a thin #333 line every 30px */
  background: repeating-linear-gradient(
    transparent,
    transparent 29px,
    #333 29px,
    #333 30px
  );
}

/* The todo text itself */
.todo-text {
  flex: 1;                             /* Take up available space */
  color: #ccc;                         /* Light gray text */
  font-family: 'Courier New', monospace; /* Typewriter font */
  cursor: pointer;                     /* Hand cursor to show it's clickable */
  transition: all 0.2s;                /* Smooth color transition on hover */
}

/* When hovering over a todo item, brighten the text */
.todo-item:hover .todo-text {
  color: #fff;
}

/* ===========================================
   COMPLETED TODOS
   When a todo has the 'completed' class, style it differently
   =========================================== */
.todo-item.completed .todo-text {
  text-decoration: line-through;       /* Strike through the text */
  color: #666;                         /* Dim the text color */
}

/* ===========================================
   DELETE BUTTON
   The × button to remove a todo
   =========================================== */
.delete-btn {
  background: transparent;             /* No background */
  border: none;                        /* No border */
  color: #666;                         /* Dim gray by default */
  font-size: 1.5rem;                   /* Decent size for easy clicking */
  cursor: pointer;                     /* Hand cursor */
  padding: 0 10px;                     /* Horizontal padding for click area */
  transition: color 0.2s;              /* Smooth color change on hover */
}

/* Delete button turns red on hover */
.delete-btn:hover {
  color: #ff4444;                      /* Bright red to indicate danger/delete */
}

/* ===========================================
   LOADING AND EMPTY STATES
   Messages shown when loading or when there are no todos
   =========================================== */
.loading,
.empty-message {
  color: #666;                         /* Muted gray color */
  text-align: center;                  /* Centered text */
  font-family: 'Courier New', monospace; /* Match the theme */
  font-style: italic;                  /* Italicized for emphasis */
  padding: 40px;                       /* Plenty of space around it */
}
```

### 4.2 Replace index.css

Open `src/index.css` in your editor and replace **all** the contents with:

```css
/* ===========================================
   GLOBAL STYLES
   These apply to the entire page, not just our component
   =========================================== */

/* Universal box-sizing reset */
/* Makes padding and border included in element's total width/height */
/* Without this, a 100px wide box with 10px padding would actually be 120px */
* {
  box-sizing: border-box;
}

/* Body styles - the entire page */
body {
  margin: 0;                           /* Remove default browser margin */
  background-color: #0d0d0d;           /* Very dark background (darker than notebook) */
  min-height: 100vh;                   /* At least full viewport height */
                                       /* vh = viewport height, 100vh = full screen */
}

/* Root div where React mounts our app */
/* We use flexbox to center the notebook on the page */
#root {
  min-height: 100vh;                   /* Full viewport height */
  display: flex;                       /* Enable flexbox layout */
  align-items: center;                 /* Center vertically */
  justify-content: center;             /* Center horizontally */
  padding: 20px;                       /* Some breathing room on small screens */
}
```

---

## Step 5: Test It!

### 5.1 Start the Dev Server

Run this command in your terminal (make sure you're in the project folder):

```bash
npm run dev
```

### 5.2 Open in Browser

Open http://localhost:5173 in your browser.

### 5.3 Test Features

1. **Add a todo:** Type something and press Enter or click +
2. **Complete a todo:** Click the text to toggle strikethrough
3. **Delete a todo:** Click the × button
4. **Refresh page:** Your todos should persist (they're in Supabase!)

---

## Step 6: Verify Data in Supabase

1. Go to your Supabase dashboard
2. Click **Table Editor** → **todolist**
3. You should see your todos in the database!

---

## Troubleshooting

### "Failed to fetch" or network errors
- Check your `.env.local` file has correct URL and key
- Make sure you restarted the dev server after adding env vars
- Check Supabase dashboard → Settings → API for correct values

### Todos not saving
- Check browser console (F12) for errors
- Verify the `todolist` table exists in Supabase
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

**Last Updated:** February 2, 2026
