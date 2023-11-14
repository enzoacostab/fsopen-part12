import { useQuery, useMutation } from "@apollo/client"
import { useEffect, useState } from "react"
import { ALL_AUTHORS, EDIT_BORN } from "../queries"

const Authors = (props) => {
  const [authors, setAuthors] = useState([])
  const [name, setName] = useState('')
  const [born, setBorn] = useState(0)
  const [options, setOptions] = useState([])

  const result = useQuery(ALL_AUTHORS)
  
  useEffect(() =>{
    if (result.data){
      setAuthors(result.data.allAuthors)
      setOptions(result.data.allAuthors.map(a => a.name))
      setName(result.data.allAuthors[0].name)
    }
  },[result])

  const [editBorn] = useMutation(EDIT_BORN, {
    refetchQueries: [{query: ALL_AUTHORS}]
  })

  const submit = (event) => {
    event.preventDefault()
    editBorn({variables: {name, born}})
    setBorn(0)
    setName('')
  }

  if (!props.show) {
    return null
  }

  if (result.loading){
    return <div>...loading</div>
  }
  
  return (
    <div>
      <h2>authors</h2>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>born</th>
            <th>books</th>
          </tr>
          {authors.map((a) => (
            <tr key={a.name}>
              <td>{a.name}</td>
              <td>{a.born}</td>
              <td>{a.bookCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>set birthyear</h2>
      <form onSubmit={submit}>
        <select onChange={({target}) => setName(target.value)}>
            {options.map(opt => 
              <option key={opt} value={opt}>{opt}</option>
            )}
        </select>
        <input type="number" value={born} placeholder="born" onChange={({target}) => target.value >= 0 && setBorn(Number(target.value))}/>
        <input type="submit" value='submit'/>
      </form>
    </div>
  )
}

export default Authors
