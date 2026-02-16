import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './App.css';


// state variables: todos, newTodo, loading

function App() {
  const [ todos, setTodos ] = useState([]);
  const [ newTodo, setNewTodo ] = useState('');
  const [ loading, setLoading ] = useState(true);


}

export default App;
