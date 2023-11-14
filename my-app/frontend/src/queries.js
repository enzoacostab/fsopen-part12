import { gql } from "@apollo/client";

const BOOK_DETAILS = gql`
  fragment BookDetails on Books {
    id
    title
    author{
      name
    }
    published 
    genres
  }
`

export const ALL_AUTHORS = gql`
query{
  allAuthors{
    name
    bookCount
    born
  }
}`

export const ALL_BOOKS = gql`
query allBooks($genre: String){
  allBooks(genre:$genre){
    ...BookDetails
  }
}
${BOOK_DETAILS}
`

export const ALL_GENRES = gql`
query{
  allGenres
}`

export const USER = gql`
query{
  me{
    favorite_genre
  }
}`

export const ADD_BOOK = gql`
mutation createBook($title: String!
  $author: String!
  $published: Int!
  $genres: [String!]!) {
  addBook (
    title: $title,
    author: $author,
    published: $published,
    genres: $genres) {
    ...BookDetails
  }
}
${BOOK_DETAILS}
`

export const EDIT_BORN = gql`
mutation editBorn($name: String!
  $born: Int!) {
  editAuthor (
    name: $name,
    setBornTo: $born){
        name
        born
    }
}`

export const LOGIN = gql`
  mutation login($username: String!, $password: String!) {
    login(username: $username, password: $password)  {
      value
    }
  }
`

export const BOOK_ADDED = gql`
  subscription {
    bookAdded {
      ...BookDetails
    }
  }
  ${BOOK_DETAILS}
`