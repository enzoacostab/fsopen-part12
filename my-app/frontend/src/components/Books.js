import { useQuery } from "@apollo/client"
import { useEffect, useState } from "react"
import { ALL_BOOKS, ALL_GENRES } from "../queries"

const Books = (props) => {
  const [books, setBooks] = useState([])
  const [genres, setGenres] = useState([])
  const [genre, setGenre] = useState(props.genre)

  const resBooks = useQuery(ALL_BOOKS, {variables:{genre}})
  const resGenres = useQuery(ALL_GENRES)

  useEffect(() =>{
    if (resBooks.data){
      setBooks(resBooks.data.allBooks)
    }
    if (resGenres.data){
      const ns = new Set(resGenres.data.allGenres)
      setGenres(Array.from(ns))
    }
    if (props.show){
      resBooks.refetch()
    }
  },[resBooks, resGenres, props.show])

  const genreFilter = (genre) =>{
    setGenre(genre)
  }

  if (!props.show && !props.genre) {
    return null
  }

  if (resBooks.loading){
    return <div>...loading</div>
  }

  if (props.genre){
    return (
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
            <th>genres</th>
          </tr>
          {books.map((book) => (
            <tr key={book.title}>
              <td>{book.title}</td>
              <td>{book.author.name}</td>
              <td>{book.published}</td>
              <td>{book.genres.join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return (
    <div>
      <h2>books</h2>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
            <th>genres</th>
          </tr>
          {books.map((book) => (
            <tr key={book.title}>
              <td>{book.title}</td>
              <td>{book.author.name}</td>
              <td>{book.published}</td>
              <td>{book.genres.join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {genres.map(genre =>(
        <button onClick={()=>genreFilter(genre)} key={genre}>{genre}</button>
      ))}
      <button onClick={()=>genreFilter(null)} key='all genres'>all genres</button>
    </div>
  )
}

export default Books
