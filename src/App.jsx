import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <h1>Black Notebook Todo</h1>
      <p>We'll build this together, step by step!</p>

      <button onClick={() => setCount((count) => count + 1)}>
        count is {count}
      </button>

      <p className="read-the-docs">
        Ready to start building?
      </p>
    </div>
  )
}

export default App
