import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './App.css';

function App() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch all todos from Supabase when the page loads
  useEffect(() => {
    let ignore = false;

    async function fetchTodos() {
      const { data, error } = await supabase
        .from('todolist')
        .select('*')
        .order('created_at', { ascending: false });

      if (!ignore) {
        if (error) {
          console.error('Error fetching todos:', error);
        } else {
          setTodos(data);
        }
        setLoading(false);
      }
    }

    fetchTodos();

    return () => { ignore = true; };
  }, []);

  // Add a new todo to the database
  async function addTodo(e) {
    e.preventDefault();
    if (!newTodo.trim()) return;

    const { data, error } = await supabase
      .from('todolist')
      .insert([{ text: newTodo, completed: false }])
      .select();

    if (error) {
      console.error('Error adding todo:', error);
    } else {
      setTodos([data[0], ...todos]);
      setNewTodo('');
    }
  }

  // Toggle a todo between complete and incomplete
  async function toggleTodo(id, completed) {
    const { error } = await supabase
      .from('todolist')
      .update({ completed: !completed })
      .eq('id', id);

    if (error) {
      console.error('Error updating todo:', error);
    } else {
      setTodos(todos.map(todo =>
        todo.id === id ? { ...todo, completed: !completed } : todo
      ));
    }
  }

  // Delete a todo from the database
  async function deleteTodo(id) {
    const { error } = await supabase
      .from('todolist')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting todo:', error);
    } else {
      setTodos(todos.filter(todo => todo.id !== id));
    }
  }

  return (
    <div className="Notebook">
      <h1 className="notebook-title">My Notes</h1>
      <form onSubmit={addTodo} className="todo-form">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add new note..."
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
  );
}

export default App;
