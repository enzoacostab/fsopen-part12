import { ApolloServer } from '@apollo/server'
import { v1 as uuid } from 'uuid'
import Book from './models/Book.js'
import Author from './models/Author.js'
import User from './models/User.js'
import {GraphQLError} from 'graphql'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { PubSub } from 'graphql-subscriptions'
import 'dotenv/config.js'
import { expressMiddleware } from '@apollo/server/express';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
const pubsub = new PubSub()
mongoose.set('strictQuery', false)

const MONGODB_URI = process.env.MONGODB_URI

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message)
  })

const typeDefs = `
  type Authors {
    name: String
    id: ID!
    born: Int
    bookCount: Int
  }

  type Books {
    title: String!
    author: Authors!
    published: Int!
    genres: [String!]!
    id: ID!
  }

  type User {
    username: String!
    favorite_genre: String!
    id: ID!
  }
  
  type Token {
    value: String!
  }

  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Books!]!
    allAuthors: [Authors!]!
    me: User
    allGenres: [String!]!
  }

  type Mutation{
    addBook(
      title: String!
      author: String!
      published: Int!
      genres: [String!]!
    ): Books!

    editAuthor(
      name: String!
      setBornTo: Int!
    ): Authors

    createUser(
      username: String!
      favoriteGenre: String!
    ): User

    login(
      username: String!
      password: String!
    ): Token
  }

  type Subscription {
    bookAdded: Books!
  }    
`

const resolvers = {
  Query: {
    bookCount: () => Book.collection.countDocuments(),
    authorCount: () => Author.collection.countDocuments(),
    allBooks: async(root, args) => {
      let bks = await Book.find({}).populate('author')
      if (args.author){
        bks = bks.filter(b => b.author.name === args.author)
      }
      if (args.genre){
        bks = bks.filter(b => b.genres.includes(args.genre))
      }
      return bks
    },
    allAuthors: async() => Author.find({}),
    me: (root, args, context) => context.currentUser,
    allGenres: async() => {
      const arr=[];
      rr = await Book.find({})
      rr.forEach(e=>e.genres.forEach(g=>arr.push(g)))
      return arr;
    }
  },
 
      
  Mutation: {
    addBook: async(root, args, {currentUser}) => {
      if (!currentUser){
        throw new GraphQLError('not authenticated', {
          extensions: {
            code: 'BAD_USER_INPUT',
          }
        })
      }
      if (args.author.length<4){
        throw new GraphQLError('Author name too short', {
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidArgs: args.author
          }
        })
      }
      const b = await Book.findOne({title:args.title})
      if (b){
        throw new GraphQLError('Title must be unique', {
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidArgs: args.title
          }
        })
      }
      if (args.title.length<2){
        throw new GraphQLError('Title too short', {
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidArgs: args.title
          }
        })
      }
    
      const author = await Author.findOne({name: args.author})
      let res = null
      if (!author){
        const au = new Author({name: args.author, born:0, bookCount:1})
        await au.save()
        res = au
      }
      else{
        author.bookCount = author.bookCount+1
        await author.save()
        res = author
      }
      
      const book = new Book({...args, author: res})
      await book.save()
      pubsub.publish('BOOK_ADDED', { bookAdded: book })
      return book 
    },

    editAuthor: async(root, args, {currentUser}) => {
      if (!currentUser){
        throw new GraphQLError('not authenticated', {
          extensions: {
            code: 'BAD_USER_INPUT',
          }
        })
      }
      let author = await Author.findOne({name: args.name})
      if (!author){
        return null
      }
      author.born = args.setBornTo
      return author.save()
    },

    createUser: async (root, args) => {
      const user = new User({ username: args.username, favorite_genre: args.favoriteGenre})
  
      return user.save()
        .catch(error => {
          throw new GraphQLError('Creating the user failed', {
            extensions: {
              code: 'BAD_USER_INPUT',
              invalidArgs: args.name,
              error
            }
          })
        })
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username })
  
      if ( !user || args.password !== 'secret' ) {
        throw new GraphQLError('wrong credentials', {
          extensions: {
            code: 'BAD_USER_INPUT'
          }
        })        
      }
  
      const userForToken = {
        username: user.username,
        id: user._id,
      }
  
      return { value: jwt.sign(userForToken, process.env.JWT_SECRET) }
    },
  },

  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator(['BOOK_ADDED'])
    },
  },
  }
  
const app = express();
const httpServer = createServer(app);
const schema = makeExecutableSchema({ typeDefs, resolvers });
const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql',
});
const serverCleanup = useServer({ schema }, wsServer);
const server = new ApolloServer({
  schema,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer }),
  {async serverWillStart() {
    return {
      async drainServer() {
        await serverCleanup.dispose();
      }
    }
  }
  }
  ]
});
await server.start();
app.use('/graphql', cors(), express.json(),
  expressMiddleware(server, {
    context: async ({ req }) => {
      const auth = req ? req.headers.authorization : null
      if (auth && auth.startsWith('Bearer ')) {
        const decodedToken = jwt.verify(
          auth.substring(7), process.env.JWT_SECRET
        )
        const currentUser = await User
          .findById(decodedToken.id)
        return { currentUser }
      }
    }
  }),
);


await new Promise((resolve) => httpServer.listen({ port: 4000 }, resolve))
console.log(`Server ready at http://localhost:4000/graphql`)
  