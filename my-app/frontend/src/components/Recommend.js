import { useQuery } from "@apollo/client"
import { USER } from "../queries"
import { useState, useEffect } from "react"
import Books from "./Books"

const Recommend = (props) => {
    const [favorite_genre, setFavGenre] = useState(null)
    const result = useQuery(USER)

    useEffect(() => {
      if(result.data){
        try{
          setFavGenre(result.data.me.favorite_genre)
        }
        catch{
          return 
        }
      }
    }, [result])
    
    if (!props.show){
        return null
    }

    return (
        <div>
            <h2>recommendations</h2>
            <p>book in your favorite genre {favorite_genre}</p>
            <Books genre={favorite_genre}/>
        </div>
    )
}

export default Recommend