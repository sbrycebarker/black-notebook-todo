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